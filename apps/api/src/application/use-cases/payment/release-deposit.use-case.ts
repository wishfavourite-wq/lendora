import type { IPaymentRepository } from '@/application/ports/repositories/payment.repository.port.js'
import type { IRentalRepository }  from '@/application/ports/repositories/rental.repository.port.js'
import type { IPaymentGateway }    from '@/application/ports/services/payment-gateway.service.port.js'
import type { Payment, RentalId }  from '@lendora/shared'
import { PaymentStatus, PaymentType } from '@lendora/shared'
import { DomainError }             from '@/domain/errors/index.js'

interface Deps {
  paymentRepo: IPaymentRepository
  rentalRepo:  IRentalRepository
  /** bKash or Nagad gateway used for the original payment */
  getGatewayForRental: (rentalId: RentalId) => Promise<IPaymentGateway>
}

interface ReleaseDepositInput {
  rentalId:  RentalId
  /** Amount actually deducted for damage. 0 = full refund. */
  deduction: number
  reason?:   string
}

interface ReleaseDepositResult {
  refundPayment:    Payment | null
  deductionPayment: Payment | null
  amountRefunded:   number
  amountDeducted:   number
}

/**
 * Releases the security deposit after rental return is confirmed.
 *
 * Two financial events may be created:
 *   - DEPOSIT_REFUND payment record for the refunded portion
 *   - DAMAGE_DEDUCTION payment record for the withheld portion (if any)
 *
 * If there's a refund amount, issues it via the original payment gateway.
 * If the gateway's refund fails, the payment is still recorded as FAILED so
 * admin can retry or process manually.
 */
export class ReleaseDepositUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: ReleaseDepositInput): Promise<ReleaseDepositResult> {
    const rental = await this.deps.rentalRepo.findById(input.rentalId)
    if (!rental) throw new DomainError('RENTAL_NOT_FOUND', 'Rental not found', 404)

    // Only released from RETURN_CONFIRMED or later states
    if (!['RETURN_CONFIRMED', 'COMPLETED'].includes(rental.status)) {
      throw new DomainError('INVALID_STATE', 'Deposit can only be released after return is confirmed', 409)
    }

    // Idempotency — check if a refund was already processed
    const existing = await this.deps.paymentRepo.findPayments({
      rentalId: input.rentalId,
      status:   PaymentStatus.COMPLETED,
    })
    const alreadyRefunded = existing.items.some((p) => p.type === PaymentType.DEPOSIT_REFUND)
    if (alreadyRefunded) throw new DomainError('DEPOSIT_ALREADY_RELEASED', 'Deposit has already been released', 409)

    const depositAmount  = rental.depositAmount
    const deduction      = Math.min(Math.max(0, input.deduction), depositAmount)
    const refundAmount   = depositAmount - deduction

    let refundPayment:    Payment | null = null
    let deductionPayment: Payment | null = null

    // ── Record damage deduction ────────────────────────────────────────────
    if (deduction > 0) {
      deductionPayment = await this.deps.paymentRepo.createPayment({
        rentalId:            input.rentalId,
        payerId:             rental.renterId,
        type:                PaymentType.DAMAGE_DEDUCTION,
        amount:              deduction,
        currency:            'BDT',
        method:              'CASH' as import('@lendora/shared').PaymentMethod,
        status:              PaymentStatus.COMPLETED,
        externalReference:   null,
        gatewayTransactionId: null,
        gatewayResponse:     { reason: input.reason ?? 'Damage deduction', deduction, depositAmount },
        initiatedAt:         new Date(),
        completedAt:         new Date(),
        failedAt:            null,
        failureReason:       null,
      })
    }

    // ── Issue gateway refund for the remaining amount ──────────────────────
    if (refundAmount > 0) {
      // Find the original payment to determine which gateway to call
      const payments    = await this.deps.paymentRepo.findPaymentsByRental(input.rentalId)
      const originalPay = payments.find(
        (p) => p.type === PaymentType.RENTAL_PAYMENT && p.status === PaymentStatus.COMPLETED,
      )

      let gatewayTransactionId: string | null = null
      let refundStatus = PaymentStatus.PENDING

      if (originalPay?.gatewayTransactionId) {
        try {
          const gateway = await this.deps.getGatewayForRental(input.rentalId)
          const result  = await gateway.refund(
            originalPay.gatewayTransactionId,
            refundAmount,
            input.reason ?? 'Security deposit refund',
          )

          gatewayTransactionId = result.refundTransactionId
          refundStatus = result.status === 'SUCCESS' ? PaymentStatus.COMPLETED : PaymentStatus.FAILED
        } catch {
          // Gateway refund failed — payment recorded as FAILED for manual processing
          refundStatus = PaymentStatus.FAILED
        }
      } else {
        // Cash or offline payment — mark as COMPLETED (admin handles manually)
        refundStatus = PaymentStatus.COMPLETED
      }

      refundPayment = await this.deps.paymentRepo.createPayment({
        rentalId:            input.rentalId,
        payerId:             rental.renterId,
        type:                PaymentType.DEPOSIT_REFUND,
        amount:              refundAmount,
        currency:            'BDT',
        method:              originalPay?.method ?? ('CASH' as import('@lendora/shared').PaymentMethod),
        status:              refundStatus,
        externalReference:   null,
        gatewayTransactionId,
        gatewayResponse:     { deduction, refundAmount, depositAmount },
        initiatedAt:         new Date(),
        completedAt:         refundStatus === PaymentStatus.COMPLETED ? new Date() : null,
        failedAt:            refundStatus === PaymentStatus.FAILED    ? new Date() : null,
        failureReason:       refundStatus === PaymentStatus.FAILED    ? 'Gateway refund failed — requires manual processing' : null,
      })
    }

    // Advance rental to COMPLETED
    if (rental.status !== 'COMPLETED') {
      await this.deps.rentalRepo.updateStatus(input.rentalId, 'COMPLETED')
    }

    return { refundPayment, deductionPayment, amountRefunded: refundAmount, amountDeducted: deduction }
  }
}
