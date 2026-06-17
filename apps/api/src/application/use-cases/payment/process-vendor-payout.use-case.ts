import type { IPaymentRepository } from '@/application/ports/repositories/payment.repository.port.js'
import type { IRentalRepository }  from '@/application/ports/repositories/rental.repository.port.js'
import type { IVendorRepository }  from '@/application/ports/repositories/vendor.repository.port.js'
import type { VendorPayout, RentalId } from '@lendora/shared'
import { PaymentStatus, PaymentType } from '@lendora/shared'
import { RENTAL_RULES, VENDOR_RULES } from '@lendora/shared'
import { DomainError }               from '@/domain/errors/index.js'

interface Deps {
  paymentRepo: IPaymentRepository
  rentalRepo:  IRentalRepository
  vendorRepo:  IVendorRepository
}

interface ProcessPayoutInput {
  rentalId: RentalId
}

interface ProcessPayoutResult {
  payout:       VendorPayout
  grossAmount:  number
  platformFee:  number
  netAmount:    number
}

/**
 * Processes vendor payout after a rental completes and the hold period elapses.
 *
 * Business rules (from business.constants.ts):
 *   - PLATFORM_FEE_RATE = 10% of rental revenue
 *   - PAYOUT_HOLD_DAYS  = 3 days after rental completion
 *   - MIN_PAYOUT        = ৳500
 *
 * The payout is recorded as PENDING — actual disbursement to the vendor's
 * bKash/bank account happens via a separate scheduled job or admin action.
 * This use case only validates eligibility and creates the payout record.
 */
export class ProcessVendorPayoutUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: ProcessPayoutInput): Promise<ProcessPayoutResult> {
    const rental = await this.deps.rentalRepo.findById(input.rentalId)
    if (!rental) throw new DomainError('RENTAL_NOT_FOUND', 'Rental not found', 404)
    if (rental.status !== 'COMPLETED') {
      throw new DomainError('INVALID_STATE', 'Rental must be COMPLETED before payout can be processed', 409)
    }

    // Enforce hold period: payout only after PAYOUT_HOLD_DAYS from completion
    const completedAt = rental.completedAt ?? rental.updatedAt
    const holdExpiry  = new Date(completedAt.getTime() + VENDOR_RULES.PAYOUT_HOLD_DAYS * 86_400_000)
    if (new Date() < holdExpiry) {
      throw new DomainError(
        'PAYOUT_HOLD_ACTIVE',
        `Payout is on hold until ${holdExpiry.toISOString()}`,
        409,
      )
    }

    // Idempotency — don't double-pay
    const existing = await this.deps.paymentRepo.findPayoutByRentalId(input.rentalId)
    if (existing) throw new DomainError('PAYOUT_EXISTS', 'Payout already exists for this rental', 409)

    // Verify the rental was actually paid
    const payments    = await this.deps.paymentRepo.findPaymentsByRental(input.rentalId)
    const rentalPay   = payments.find(
      (p) => p.type === PaymentType.RENTAL_PAYMENT && p.status === PaymentStatus.COMPLETED,
    )
    if (!rentalPay) throw new DomainError('PAYMENT_NOT_FOUND', 'No completed payment found for this rental', 404)

    // Retrieve vendor to get their preferred payout method
    const vendor = await this.deps.vendorRepo.findById(rental.vendorId)
    if (!vendor) throw new DomainError('VENDOR_NOT_FOUND', 'Vendor not found', 404)

    const grossAmount = rental.rentalFee               // Deposit is not part of vendor revenue
    const platformFee = Math.round(grossAmount * RENTAL_RULES.PLATFORM_FEE_RATE)
    const netAmount   = grossAmount - platformFee

    if (netAmount < VENDOR_RULES.MIN_PAYOUT) {
      throw new DomainError(
        'PAYOUT_BELOW_MINIMUM',
        `Net payout ৳${netAmount} is below the minimum of ৳${VENDOR_RULES.MIN_PAYOUT}`,
        409,
      )
    }

    // Prefer bKash if the vendor has a number on file, otherwise Nagad
    const payoutMethod: import('@lendora/shared').PaymentMethod =
      vendor.bkashNumber ? 'BKASH' : vendor.nagadNumber ? 'NAGAD' : 'BANK'

    const payout = await this.deps.paymentRepo.createPayout({
      vendorId:      rental.vendorId,
      rentalId:      input.rentalId,
      amount:        netAmount,
      method:        payoutMethod,
      status:        'PENDING',
      processedAt:   null,
      failureReason: null,
    })

    // Update vendor earnings cache (totalEarnings incremented, +1 rental)
    await this.deps.vendorRepo.updateEarningsCache(
      rental.vendorId,
      vendor.totalEarnings + netAmount,
      vendor.totalRentals + 1,
    )

    return { payout, grossAmount, platformFee, netAmount }
  }
}
