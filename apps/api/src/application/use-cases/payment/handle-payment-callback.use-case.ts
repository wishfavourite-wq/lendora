import type { IPaymentRepository } from '@/application/ports/repositories/payment.repository.port.js'
import type { IRentalRepository }  from '@/application/ports/repositories/rental.repository.port.js'
import type { IPaymentGateway }    from '@/application/ports/services/payment-gateway.service.port.js'
import type { Payment }            from '@lendora/shared'
import { PaymentStatus }           from '@lendora/shared'
import { DomainError }             from '@/domain/errors/index.js'

interface Deps {
  paymentRepo: IPaymentRepository
  rentalRepo:  IRentalRepository
  gateway:     IPaymentGateway
}

interface CallbackInput {
  /** Raw query params forwarded from the gateway redirect */
  params: Record<string, string>
}

interface CallbackResult {
  payment: Payment
  success: boolean
}

/**
 * Handles the gateway callback after a renter completes (or cancels/fails) payment.
 *
 * If payment succeeds:
 *   - Marks Payment as COMPLETED
 *   - Advances Rental status from PENDING_CONFIRMATION → CONFIRMED
 *
 * If payment fails/cancelled:
 *   - Marks Payment as FAILED / CANCELLED
 *   - Rental stays in PENDING_CONFIRMATION (renter can retry)
 */
export class HandlePaymentCallbackUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: CallbackInput): Promise<CallbackResult> {
    const verified = await this.deps.gateway.verifyCallback(input.params)

    // Find the payment by gateway reference
    const payment = await this.deps.paymentRepo.findPaymentByExternalRef(verified.gatewayRef)
    if (!payment) {
      throw new DomainError('PAYMENT_NOT_FOUND', `No payment found for gateway ref: ${verified.gatewayRef}`, 404)
    }

    // Idempotency — if already processed, return current state
    if (payment.status !== PaymentStatus.PENDING) {
      return { payment, success: payment.status === PaymentStatus.COMPLETED }
    }

    if (verified.status === 'SUCCESS') {
      const updated = await this.deps.paymentRepo.updatePaymentStatus(
        payment.id,
        PaymentStatus.COMPLETED,
        {
          gatewayTransactionId: verified.gatewayTransactionId,
          gatewayResponse:      verified.raw,
          completedAt:          new Date(),
        },
      )

      // Advance rental to CONFIRMED so vendor sees it
      await this.deps.rentalRepo.updateStatus(payment.rentalId, 'CONFIRMED')

      return { payment: updated, success: true }
    }

    const failStatus = verified.status === 'CANCELLED'
      ? PaymentStatus.CANCELLED
      : PaymentStatus.FAILED

    const updated = await this.deps.paymentRepo.updatePaymentStatus(
      payment.id,
      failStatus,
      {
        gatewayResponse: verified.raw,
        failedAt:        new Date(),
        failureReason:   `Gateway returned: ${verified.status}`,
      },
    )

    return { payment: updated, success: false }
  }
}
