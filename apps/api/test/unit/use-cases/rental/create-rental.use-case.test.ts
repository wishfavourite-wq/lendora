import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CreateRentalUseCase } from '../../../../src/application/use-cases/rental/create-rental.use-case.js'
import {
  mockUserRepo, mockProductRepo, mockRentalRepo,
} from '../../../factories/mock.repositories.js'
import { mockCacheService, mockEventBus } from '../../../factories/mock.services.js'
import {
  buildUser, buildVendorUser, buildVendorProfile, buildProduct, buildRental,
} from '../../../factories/entity.builders.js'
import {
  NotFoundError, ForbiddenError, ProductUnavailableError, VendorNotVerifiedError,
} from '../../../../src/domain/errors/index.js'
import { asId } from '@lendora/shared'
import type { UserId, ProductId } from '@lendora/shared'

const RENTER_ID = asId<UserId>('user-001')
const VENDOR_USER_ID = asId<UserId>('user-vendor-001')

const VALID_INPUT = {
  productId:       'product-001',
  startDate:       new Date('2025-05-01'),
  endDate:         new Date('2025-05-05'),
  deliveryAddress: null,
  pickupAddress:   null,
  renterNotes:     null,
}

describe('CreateRentalUseCase', () => {
  let userRepo:     ReturnType<typeof mockUserRepo>
  let productRepo:  ReturnType<typeof mockProductRepo>
  let rentalRepo:   ReturnType<typeof mockRentalRepo>
  let cache:        ReturnType<typeof mockCacheService>
  let eventBus:     ReturnType<typeof mockEventBus>
  let useCase:      CreateRentalUseCase

  beforeEach(() => {
    userRepo    = mockUserRepo()
    productRepo = mockProductRepo()
    rentalRepo  = mockRentalRepo()
    cache       = mockCacheService()
    eventBus    = mockEventBus()
    useCase     = new CreateRentalUseCase({ rentalRepo, productRepo, userRepo, eventBus, cache })

    // Default happy-path setup
    productRepo.findById.mockResolvedValue(buildProduct())
    userRepo.findVendorProfileById.mockResolvedValue(buildVendorProfile())
    userRepo.findById.mockResolvedValue(buildVendorUser())
    productRepo.isAvailableForRange.mockResolvedValue(true)
    rentalRepo.createWithLock.mockResolvedValue(buildRental())
  })

  // ── Happy path ─────────────────────────────────────────────────────────────

  it('creates a rental and publishes a RentalCreated event', async () => {
    const rental = await useCase.execute(RENTER_ID, VALID_INPUT)

    expect(rental.id).toBe('rental-001')
    expect(rentalRepo.createWithLock).toHaveBeenCalledOnce()
    expect(eventBus.publish).toHaveBeenCalledOnce()
  })

  it('calculates pricing correctly: fee + deposit + delivery', async () => {
    await useCase.execute(RENTER_ID, { ...VALID_INPUT, deliveryAddress: '123 Test St' })

    const callArg = rentalRepo.createWithLock.mock.calls[0]![0]
    // 5 days × ৳1500/day = ৳7500 rental fee
    expect(callArg.rentalFee).toBe(7500)
    // 10% platform fee
    expect(callArg.platformFee).toBeCloseTo(750)
    // deposit as set on the product
    expect(callArg.depositAmount).toBe(5000)
    // delivery fee from product
    expect(callArg.deliveryFee).toBe(200)
  })

  it('invalidates availability cache after creating rental', async () => {
    await useCase.execute(RENTER_ID, VALID_INPUT)

    expect(cache.del).toHaveBeenCalledWith(expect.stringContaining('avail:product-001'))
  })

  // ── Product guards ─────────────────────────────────────────────────────────

  it('throws NotFoundError when product does not exist', async () => {
    productRepo.findById.mockResolvedValue(null)

    await expect(useCase.execute(RENTER_ID, VALID_INPUT)).rejects.toThrow(NotFoundError)
  })

  it('throws ProductUnavailableError when product is not ACTIVE', async () => {
    productRepo.findById.mockResolvedValue(buildProduct({ status: 'INACTIVE' as any }))

    await expect(useCase.execute(RENTER_ID, VALID_INPUT)).rejects.toThrow(ProductUnavailableError)
  })

  // ── Vendor guards ──────────────────────────────────────────────────────────

  it('throws NotFoundError when vendor profile does not exist', async () => {
    userRepo.findVendorProfileById.mockResolvedValue(null)

    await expect(useCase.execute(RENTER_ID, VALID_INPUT)).rejects.toThrow(NotFoundError)
  })

  it('throws VendorNotVerifiedError when vendor is PENDING_VERIFICATION', async () => {
    userRepo.findVendorProfileById.mockResolvedValue(
      buildVendorProfile({ status: 'PENDING_VERIFICATION' as any }),
    )

    await expect(useCase.execute(RENTER_ID, VALID_INPUT)).rejects.toThrow(VendorNotVerifiedError)
  })

  it('throws VendorNotVerifiedError when vendor is SUSPENDED', async () => {
    userRepo.findVendorProfileById.mockResolvedValue(
      buildVendorProfile({ status: 'SUSPENDED' as any }),
    )

    await expect(useCase.execute(RENTER_ID, VALID_INPUT)).rejects.toThrow(VendorNotVerifiedError)
  })

  // ── Self-rental guard ──────────────────────────────────────────────────────

  it('throws ForbiddenError when renter is the product owner', async () => {
    userRepo.findById.mockResolvedValue(buildVendorUser({ id: RENTER_ID }))

    await expect(useCase.execute(RENTER_ID, VALID_INPUT)).rejects.toThrow(ForbiddenError)
  })

  // ── Duration guards ────────────────────────────────────────────────────────

  it('throws ForbiddenError when duration is below minRentalDays', async () => {
    productRepo.findById.mockResolvedValue(buildProduct({ minRentalDays: 7 }))

    await expect(useCase.execute(RENTER_ID, VALID_INPUT)).rejects.toThrow(ForbiddenError)
  })

  it('throws ForbiddenError when duration exceeds maxRentalDays', async () => {
    productRepo.findById.mockResolvedValue(buildProduct({ maxRentalDays: 3 }))

    await expect(useCase.execute(RENTER_ID, VALID_INPUT)).rejects.toThrow(ForbiddenError)
  })

  // ── Availability ───────────────────────────────────────────────────────────

  it('throws ProductUnavailableError when product is already booked for the range', async () => {
    productRepo.isAvailableForRange.mockResolvedValue(false)

    await expect(useCase.execute(RENTER_ID, VALID_INPUT)).rejects.toThrow(ProductUnavailableError)
  })

  it('does NOT publish an event when rental creation fails', async () => {
    productRepo.isAvailableForRange.mockResolvedValue(false)

    await useCase.execute(RENTER_ID, VALID_INPUT).catch(() => {})

    expect(eventBus.publish).not.toHaveBeenCalled()
  })

  // ── Status set correctly ───────────────────────────────────────────────────

  it('always creates rental in PENDING_CONFIRMATION status', async () => {
    await useCase.execute(RENTER_ID, VALID_INPUT)

    expect(rentalRepo.createWithLock.mock.calls[0]![0].status).toBe('PENDING_CONFIRMATION')
  })
})
