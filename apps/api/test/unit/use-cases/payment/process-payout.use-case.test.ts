import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ProcessVendorPayoutUseCase } from '../../../../src/application/use-cases/payment/process-vendor-payout.use-case.js'
import { mockRentalRepo, mockPaymentRepo, mockVendorRepo } from '../../../factories/mock.repositories.js'
import { buildRental, buildPayment, buildPayout, buildVendorProfile } from '../../../factories/entity.builders.js'
import { DomainError } from '../../../../src/domain/errors/index.js'
import { VENDOR_RULES, RENTAL_RULES } from '@lendora/shared'
import { asId } from '@lendora/shared'
import type { RentalId } from '@lendora/shared'

const RENTAL_ID = asId<RentalId>('rental-001')

// A completed rental whose returnedAt is old enough to have passed the hold
function completedRental(daysAgo = VENDOR_RULES.PAYOUT_HOLD_DAYS + 1) {
  const completedAt = new Date(Date.now() - daysAgo * 86_400_000)
  return buildRental({
    status:      'COMPLETED' as any,
    completedAt,
    rentalFee:   7500,
  })
}

describe('ProcessVendorPayoutUseCase', () => {
  let rentalRepo:  ReturnType<typeof mockRentalRepo>
  let paymentRepo: ReturnType<typeof mockPaymentRepo>
  let vendorRepo:  ReturnType<typeof mockVendorRepo>
  let useCase:     ProcessVendorPayoutUseCase

  beforeEach(() => {
    rentalRepo  = mockRentalRepo()
    paymentRepo = mockPaymentRepo()
    vendorRepo  = mockVendorRepo()
    useCase     = new ProcessVendorPayoutUseCase({ paymentRepo, rentalRepo, vendorRepo })

    rentalRepo.findById.mockResolvedValue(completedRental())
    paymentRepo.findPayoutByRentalId.mockResolvedValue(null)
    paymentRepo.findPaymentsByRental.mockResolvedValue([
      buildPayment({ type: 'RENTAL_PAYMENT' as any, status: 'COMPLETED' as any }),
    ])
    vendorRepo.findById.mockResolvedValue(buildVendorProfile())
    paymentRepo.createPayout.mockResolvedValue(buildPayout())
    vendorRepo.updateEarningsCache.mockResolvedValue(undefined)
  })

  // ── Happy path ─────────────────────────────────────────────────────────────

  it('creates a PENDING payout for the vendor', async () => {
    const result = await useCase.execute({ rentalId: RENTAL_ID })

    expect(result.payout.status).toBe('PENDING')
    expect(paymentRepo.createPayout).toHaveBeenCalledOnce()
  })

  it('deducts platform fee correctly (10% of rental fee)', async () => {
    const result = await useCase.execute({ rentalId: RENTAL_ID })

    // 7500 × 10% = 750 fee → 6750 net
    expect(result.platformFee).toBeCloseTo(750)
    expect(result.netAmount).toBeCloseTo(6750)
    expect(result.grossAmount).toBe(7500)
  })

  it('updates vendor earnings cache after payout is created', async () => {
    await useCase.execute({ rentalId: RENTAL_ID })

    // Called with (vendorId, newTotalEarnings, newTotalRentals)
    expect(vendorRepo.updateEarningsCache).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(Number), // totalEarnings + netAmount
      expect.any(Number), // totalRentals + 1
    )
  })

  // ── Hold period ────────────────────────────────────────────────────────────

  it('throws DomainError when within the 3-day hold period', async () => {
    rentalRepo.findById.mockResolvedValue(completedRental(1)) // only 1 day ago

    await expect(
      useCase.execute({ rentalId: RENTAL_ID }),
    ).rejects.toMatchObject({ code: 'PAYOUT_HOLD_ACTIVE' })
  })

  it('succeeds on the first day after hold period expires', async () => {
    // Exactly PAYOUT_HOLD_DAYS + 1 days ago
    rentalRepo.findById.mockResolvedValue(completedRental(VENDOR_RULES.PAYOUT_HOLD_DAYS + 1))

    await expect(useCase.execute({ rentalId: RENTAL_ID })).resolves.toBeDefined()
  })

  // ── Idempotency ────────────────────────────────────────────────────────────

  it('throws DomainError when payout already exists for this rental', async () => {
    paymentRepo.findPayoutByRentalId.mockResolvedValue(buildPayout())

    await expect(
      useCase.execute({ rentalId: RENTAL_ID }),
    ).rejects.toMatchObject({ code: 'PAYOUT_EXISTS' })
  })

  // ── State guards ───────────────────────────────────────────────────────────

  it('throws DomainError when rental is not COMPLETED', async () => {
    rentalRepo.findById.mockResolvedValue(buildRental({ status: 'RETURN_CONFIRMED' as any }))

    await expect(useCase.execute({ rentalId: RENTAL_ID })).rejects.toThrow(DomainError)
  })

  it('throws DomainError when no completed payment exists for the rental', async () => {
    paymentRepo.findPaymentsByRental.mockResolvedValue([
      buildPayment({ status: 'PENDING' as any }),
    ])

    await expect(useCase.execute({ rentalId: RENTAL_ID })).rejects.toMatchObject({
      code: 'PAYMENT_NOT_FOUND',
    })
  })

  it('throws DomainError when vendor is not found', async () => {
    vendorRepo.findById.mockResolvedValue(null)

    await expect(useCase.execute({ rentalId: RENTAL_ID })).rejects.toThrow(DomainError)
  })

  // ── Minimum payout guard ───────────────────────────────────────────────────

  it('throws DomainError when net payout is below minimum', async () => {
    // ৳500 rentalFee × 90% = ৳450 net — below MIN_PAYOUT of ৳500
    rentalRepo.findById.mockResolvedValue(
      buildRental({
        status:      'COMPLETED' as any,
        completedAt: new Date(Date.now() - (VENDOR_RULES.PAYOUT_HOLD_DAYS + 1) * 86_400_000),
        rentalFee:   500,
      }),
    )

    await expect(useCase.execute({ rentalId: RENTAL_ID })).rejects.toMatchObject({
      code: 'PAYOUT_BELOW_MINIMUM',
    })
  })
})
