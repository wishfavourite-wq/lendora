import type { IRentalRepository }  from '@/application/ports/repositories/rental.repository.port.js'
import type { IProductRepository } from '@/application/ports/repositories/product.repository.port.js'
import type { IEventBus }          from '@/application/ports/services/event-bus.port.js'
import type { RentalId, UserId }   from '@lendora/shared'
import type { ReturnCondition }    from '@lendora/shared'
import { DomainError }             from '@/domain/errors/index.js'
import { DEPOSIT_RULES }           from '@lendora/shared'

interface Deps {
  rentalRepo:  IRentalRepository
  productRepo: IProductRepository
  eventBus:    IEventBus
}

interface ConfirmReturnInput {
  rentalId:           RentalId
  vendorId:           UserId
  condition:          ReturnCondition
  damageDescription?: string
  damageAmount?:      number
}

export class ConfirmReturnUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: ConfirmReturnInput) {
    const rental = await this.deps.rentalRepo.findById(input.rentalId)
    if (!rental) throw new DomainError('RENTAL_NOT_FOUND', 'Rental not found', 404)
    if (rental.vendorId !== input.vendorId) throw new DomainError('FORBIDDEN', 'Not authorized', 403)

    const validStates = ['RETURN_INITIATED', 'RETURN_IN_TRANSIT', 'RETURN_RECEIVED']
    if (!validStates.includes(rental.status)) {
      throw new DomainError('INVALID_STATE', `Cannot confirm return for rental in '${rental.status}' status`, 422)
    }

    // ── Late return ────────────────────────────────────────────────────────────
    // Late fees are deducted automatically and in real time while the rental
    // is ACTIVE/OVERDUE (see utils/late-fee.ts) — by the time the return is
    // confirmed, rental.lateDays / rental.lateFeeAmount are already frozen and
    // the deduction has already been transferred to the vendor's wallet.
    const lateDays    = rental.lateDays
    const latePenalty = rental.lateFeeAmount

    // GOOD / EXCELLENT / PERFECT = acceptable return; anything else = admin review
    const isDamaged           = !['GOOD', 'EXCELLENT', 'PERFECT'].includes(input.condition as string)
    const damageAmount        = isDamaged ? (input.damageAmount ?? 0) : 0
    // Any bad condition (MINOR_DAMAGE / MAJOR_DAMAGE / DAMAGED) requires admin review
    const adminReviewRequired = isDamaged

    // The late portion is already deducted; only the damage portion (if any) is
    // deferred to admin review and added to depositDeduction at the resolve step.
    const depositDeduction = latePenalty
    const depositRefund    = Math.max(0, Number(rental.depositAmount) - depositDeduction)

    const depositStatus = adminReviewRequired
      ? 'PARTIAL_REFUND_PENDING'
      : depositDeduction > 0
        ? 'PARTIALLY_REFUNDED'
        : 'FULLY_REFUNDED'

    const returnRecord = await this.deps.rentalRepo.createReturnRecord({
      rentalId:            input.rentalId,
      reportedByVendor:    true,
      condition:           input.condition,
      damageDescription:   input.damageDescription,
      damageAmount:        damageAmount > 0 ? damageAmount : null,
      lateDays:            lateDays > 0 ? lateDays : null,
      latePenalty:         latePenalty > 0 ? latePenalty : null,
      outstandingDue:      null,
      depositDeduction,
      depositRefund,
      vendorAgreed:        true,
      renterAgreed:        false,
      adminReviewRequired,
    })

    await this.deps.rentalRepo.updateStatus(input.rentalId, 'RETURN_RECEIVED', { depositStatus })
    await this.deps.productRepo.incrementRentalCount(rental.productId)

    // Good-condition returns complete immediately; damaged ones wait for admin review
    if (!returnRecord.adminReviewRequired) {
      await this.deps.rentalRepo.updateStatus(input.rentalId, 'COMPLETED')
    }

    return { rental, returnRecord, depositRefund, depositDeduction }
  }
}
