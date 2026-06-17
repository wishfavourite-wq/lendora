import type { IPaymentRepository } from '@/application/ports/repositories/payment.repository.port.js'
import type { IRentalRepository }  from '@/application/ports/repositories/rental.repository.port.js'
import type { IPaymentGateway }    from '@/application/ports/services/payment-gateway.service.port.js'
import type { Payment, RentalId, UserId } from '@lendora/shared'
import { PaymentMethod, PaymentStatus, PaymentType } from '@lendora/shared'
import { DomainError }             from '@/domain/errors/index.js'
import { RENTAL_RULES }            from '@lendora/shared'
import { asId }                    from '@lendora/shared'
import type { PaymentId }          from '@lendora/shared'

interface Deps {
  paymentRepo: IPaymentRepository
  rentalRepo:  IRentalRepository
  gateway:     IPaymentGateway
  serverUrl:   string
}

interface InitiatePaymentInput {
  rentalId:    RentalId
  userId:      UserId
  method:      'BKASH' | 'NAGAD' | 'ROCKET'
  payerPhone?: string
}

interface InitiatePaymentResult {
  payment:     Payment
  redirectUrl: string
}

export class InitiateRentalPaymentUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    const rental = await this.deps.rentalRepo.findById(input.rentalId)
    if (!rental) throw new DomainError('RENTAL_NOT_FOUND', 'Rental not found', 404)
    if (rental.renterId !== input.userId) throw new DomainError('FORBIDDEN', 'You do not own this rental', 403)
    if (rental.status !== 'PENDING_CONFIRMATION') {
      throw new DomainError('INVALID_STATE', 'Rental is not awaiting payment', 409)
    }

    // Prevent duplicate pending payments
    const existing = await this.deps.paymentRepo.findPayments({ rentalId: input.rentalId, status: PaymentStatus.PENDING })
    if (existing.items.length > 0) {
      throw new DomainError('PAYMENT_EXISTS', 'A pending payment already exists for this rental', 409)
    }

    const totalAmount  = rental.totalAmount   // already includes rentalFee + deposit + delivery
    const merchantRef  = `LENDORA-${rental.id}-${Date.now()}`
    const callbackUrl  = `${this.deps.serverUrl}/payments/${input.method.toLowerCase()}/callback`
    const cancelUrl    = `${this.deps.serverUrl}/payments/${input.method.toLowerCase()}/cancel`

    const gatewayResult = await this.deps.gateway.initiatePayment({
      merchantRef,
      amount:      totalAmount,
      currency:    'BDT',
      callbackUrl,
      cancelUrl,
      description: `Lendora rental #${rental.id}`,
      payerPhone:  input.payerPhone,
    })

    const payment = await this.deps.paymentRepo.createPayment({
      rentalId:            input.rentalId,
      payerId:             input.userId,
      type:                PaymentType.RENTAL_PAYMENT,
      amount:              totalAmount,
      currency:            'BDT',
      method:              input.method as PaymentMethod,
      status:              PaymentStatus.PENDING,
      externalReference:   gatewayResult.gatewayRef,
      gatewayTransactionId: null,
      gatewayResponse:     gatewayResult.raw,
      initiatedAt:         new Date(),
      completedAt:         null,
      failedAt:            null,
      failureReason:       null,
    })

    return { payment, redirectUrl: gatewayResult.redirectUrl }
  }
}
