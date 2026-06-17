import type { IRentalRepository }   from '@/application/ports/repositories/rental.repository.port.js'
import type { IProductRepository }  from '@/application/ports/repositories/product.repository.port.js'
import type { IUserRepository }     from '@/application/ports/repositories/user.repository.port.js'
import type { IEventBus }           from '@/application/ports/services/event-bus.service.port.js'
import type { ICacheService }       from '@/application/ports/services/cache.service.port.js'
import {
  type CreateRentalInput,
  type Rental, type RentalId, type UserId,
  RENTAL_RULES, DEPOSIT_RULES, PLATFORM,
  VendorStatus, UserRole,
} from '@lendora/shared'
import {
  NotFoundError, ForbiddenError,
  ProductUnavailableError, VendorNotVerifiedError,
} from '@/domain/errors/index.js'
import { RentalCreatedEvent } from '@/domain/events/rental.events.js'
import { CACHE_KEYS }         from '@/application/ports/services/cache.service.port.js'

interface Deps {
  rentalRepo:  IRentalRepository
  productRepo: IProductRepository
  userRepo:    IUserRepository
  eventBus:    IEventBus
  cache:       ICacheService
}

interface CreateRentalResult {
  rental:       Rental
  paymentRef:   string
  redirectUrl:  string
}

/**
 * Orchestrates the full rental-creation flow:
 * 1. Load and validate product + vendor
 * 2. Check date-range availability (with advisory lock in repo)
 * 3. Calculate pricing
 * 4. Persist rental in PENDING_CONFIRMATION state
 * 5. Publish domain event
 * 6. Return rental + payment initiation redirect
 */
export class CreateRentalUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(renterId: UserId, input: CreateRentalInput): Promise<Rental> {
    const { rentalRepo, productRepo, userRepo, eventBus, cache } = this.deps

    // ── 1. Load product ───────────────────────────────────────────────────────
    const product = await productRepo.findById(input.productId as import('@lendora/shared').ProductId)
    if (!product) throw new NotFoundError('Product', input.productId)
    if (product.status !== 'ACTIVE') {
      throw new ProductUnavailableError(input.productId, input.startDate, input.endDate)
    }

    // ── 2. Validate vendor is approved ────────────────────────────────────────
    const vendor = await userRepo.findVendorProfileById(product.vendorId)
    if (!vendor) throw new NotFoundError('Vendor', product.vendorId)
    if (vendor.status !== VendorStatus.ACTIVE) throw new VendorNotVerifiedError()

    // ── 3. Validate renter is not the vendor themselves ───────────────────────
    const vendorUser = await userRepo.findById(vendor.userId)
    if (vendorUser?.id === renterId) {
      throw new ForbiddenError('You cannot rent your own product')
    }

    // ── 4. Validate date range ────────────────────────────────────────────────
    const start = new Date(input.startDate)
    const end   = new Date(input.endDate)

    // Calculate total days from calendar dates (matches frontend differenceInDays)
    const startDay = new Date(start); startDay.setHours(0, 0, 0, 0)
    const endDay   = new Date(end);   endDay.setHours(0, 0, 0, 0)
    const totalDays = Math.round(
      (endDay.getTime() - startDay.getTime()) / (1000 * 60 * 60 * 24)
    )

    // Expand time range to cover the full rental window for DB queries
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)

    if (totalDays < product.minRentalDays) {
      throw new ForbiddenError(`Minimum rental period is ${product.minRentalDays} day(s)`)
    }
    if (product.maxRentalDays && totalDays > product.maxRentalDays) {
      throw new ForbiddenError(`Maximum rental period is ${product.maxRentalDays} day(s)`)
    }

    // ── 5. Check availability (repo acquires SELECT FOR UPDATE lock) ──────────
    const isAvailable = await productRepo.isAvailableForRange(
      product.id,
      { startDate: start, endDate: end },
    )
    if (!isAvailable) {
      throw new ProductUnavailableError(product.id, start, end)
    }

    // ── 6. Pricing calculation ────────────────────────────────────────────────
    const pricePerDay   = Number(product.pricePerDay)
    const rentalFee     = pricePerDay * totalDays
    const depositAmount = Number(product.depositAmount)
    const deliveryFee   = input.deliveryAddress && product.deliveryAvailable
      ? Number(product.deliveryFee ?? 0)
      : 0
    const platformFee   = rentalFee * RENTAL_RULES.PLATFORM_FEE_RATE
    const vendorPayout  = rentalFee - platformFee
    const totalAmount   = rentalFee + depositAmount + deliveryFee

    // ── 7. Create rental (race-condition-safe, uses DB-level lock) ────────────
    const rental = await rentalRepo.createWithLock({
      productId:          product.id,
      renterId:           renterId,
      vendorId:           vendor.id,
      status:             'PENDING_CONFIRMATION',
      startDate:          start,
      endDate:            end,
      totalDays,
      pricePerDay,
      rentalFee,
      depositAmount,
      depositStatus:      'HELD',
      platformFeeRate:    RENTAL_RULES.PLATFORM_FEE_RATE,
      platformFee,
      vendorPayout,
      deliveryFee,
      totalAmount,
      deliveryAddress:    input.deliveryAddress ?? null,
      pickupAddress:      input.pickupAddress   ?? null,
      renterNotes:        input.renterNotes     ?? null,
      vendorNotes:        null,
      confirmedAt:        null,
      startedAt:          null,
      returnInitiatedAt:  null,
      returnReceivedAt:   null,
      completedAt:        null,
      cancelledAt:        null,
      cancellationReason: null,
      cancellationNote:   null,
    })

    // ── 8. Invalidate availability cache ─────────────────────────────────────
    const month = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`
    await cache.del(CACHE_KEYS.availability(product.id, month))

    // ── 9. Publish domain event (fires notification, email, etc.) ─────────────
    await eventBus.publish(new RentalCreatedEvent(
      rental.id,
      product.id,
      renterId,
      vendor.userId,
    ))

    return rental
  }
}
