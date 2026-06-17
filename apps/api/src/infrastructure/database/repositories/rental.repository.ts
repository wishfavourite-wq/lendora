import type { PrismaClient, Prisma } from '@prisma/client'
import type {
  IRentalRepository, FindRentalsOptions, VendorAnalytics,
} from '@/application/ports/repositories/rental.repository.port.js'
import type {
  Rental, RentalId, ProductId, VendorId, UserId,
  RentalSummary, ReturnRecord,
} from '@lendora/shared'
import type { RentalStatus } from '@lendora/shared'
import { asId } from '@lendora/shared'
import { ProductUnavailableError } from '@/domain/errors/index.js'

type PrismaRental = Prisma.RentalGetPayload<Record<string, never>>
type PrismaReturn = Prisma.ReturnRecordGetPayload<{
  include: { evidence: true }
}>

const ACTIVE_STATUSES: RentalStatus[] = [
  'PENDING_CONFIRMATION',
  'CONFIRMED',
  'READY_FOR_PICKUP',
  'ACTIVE',
]

// Only confirmed-and-beyond rentals lock the product against new bookings
const LOCKING_STATUSES: RentalStatus[] = [
  'CONFIRMED',
  'READY_FOR_PICKUP',
  'ACTIVE',
]

export class PrismaRentalRepository implements IRentalRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: RentalId): Promise<Rental | null> {
    const row = await this.db.rental.findUnique({ where: { id } })
    return row ? this.mapRental(row) : null
  }

  async findMany(opts: FindRentalsOptions): Promise<{ items: Rental[]; total: number }> {
    const where = this.buildWhere(opts)
    const page  = opts.page  ?? 1
    const limit = opts.limit ?? 20

    const [rows, total] = await this.db.$transaction([
      this.db.rental.findMany({
        where,
        skip:    (page - 1) * limit,
        take:    limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.db.rental.count({ where }),
    ])

    return { items: rows.map(this.mapRental), total }
  }

  async findSummaries(opts: FindRentalsOptions): Promise<{ items: RentalSummary[]; total: number }> {
    const where = this.buildWhere(opts)
    const page  = opts.page  ?? 1
    const limit = opts.limit ?? 20

    const [rows, total] = await this.db.$transaction([
      this.db.rental.findMany({
        where,
        skip:    (page - 1) * limit,
        take:    limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { name: true, media: { take: 1, orderBy: { sortOrder: 'asc' }, select: { url: true } } } },
          renter:  { select: { name: true } },
          vendor:  { select: { businessName: true } },
        },
      }),
      this.db.rental.count({ where }),
    ])

    const items: RentalSummary[] = rows.map((r) => ({
      id:             asId<RentalId>(r.id),
      status:         r.status    as RentalStatus,
      startDate:      r.startDate,
      endDate:        r.endDate,
      totalDays:      r.totalDays,
      totalAmount:    Number(r.totalAmount),
      depositAmount:  Number(r.depositAmount),
      depositStatus:  r.depositStatus as import('@lendora/shared').DepositStatus,
      createdAt:      r.createdAt,
      pricePerDay:    Number(r.pricePerDay),
      lateDays:       r.lateDays,
      lateFeeAmount:  Number(r.lateFeeAmount),
      productName:    r.product.name,
      productImage:   r.product.media[0]?.url ?? null,
      vendorName:     r.vendor.businessName,
      renterName:     r.renter.name,
    }))

    return { items, total }
  }

  /**
   * Race-condition-safe rental creation.
   *
   * Flow (all inside one MySQL transaction):
   *   1. SELECT ... FOR UPDATE  → acquires exclusive row lock on the product
   *   2. Check for overlapping active rentals
   *   3. INSERT rental
   *
   * Any concurrent request trying to book the same product in this window
   * will block on step 1 until this transaction commits or rolls back.
   */
  async createWithLock(data: Omit<Rental, 'id' | 'createdAt' | 'updatedAt'>): Promise<Rental> {
    return this.db.$transaction(async (tx) => {
      // ── Step 1: Acquire row-level lock ──────────────────────────────────────
      await tx.$executeRaw`
        SELECT id FROM products WHERE id = ${data.productId} FOR UPDATE
      `

      // ── Step 2: Overlap check (inside the locked transaction) ───────────────
      // Only CONFIRMED and above lock the product; PENDING_CONFIRMATION does not
      const overlap = await tx.rental.count({
        where: {
          productId: data.productId,
          status:    { in: LOCKING_STATUSES },
          startDate: { lte: data.endDate },
          endDate:   { gte: data.startDate },
        },
      })

      if (overlap > 0) {
        throw new ProductUnavailableError(data.productId, data.startDate, data.endDate)
      }

      // ── Step 3: Also check blocked dates ────────────────────────────────────
      const blocked = await tx.productBlockedDate.count({
        where: {
          productId: data.productId,
          date:      { gte: data.startDate, lte: data.endDate },
        },
      })

      if (blocked > 0) {
        throw new ProductUnavailableError(data.productId, data.startDate, data.endDate)
      }

      // ── Step 4: Insert rental ────────────────────────────────────────────────
      const row = await tx.rental.create({
        data: {
          productId:          data.productId,
          renterId:           data.renterId,
          vendorId:           data.vendorId,
          status:             data.status,
          startDate:          data.startDate,
          endDate:            data.endDate,
          totalDays:          data.totalDays,
          pricePerDay:        data.pricePerDay,
          rentalFee:          data.rentalFee,
          depositAmount:      data.depositAmount,
          depositStatus:      data.depositStatus,
          platformFeeRate:    data.platformFeeRate,
          platformFee:        data.platformFee,
          vendorPayout:       data.vendorPayout,
          deliveryFee:        data.deliveryFee,
          totalAmount:        data.totalAmount,
          deliveryAddress:    data.deliveryAddress     ?? undefined,
          pickupAddress:      data.pickupAddress       ?? undefined,
          returnAddress:      data.returnAddress       ?? undefined,
          renterNotes:        data.renterNotes         ?? undefined,
          cancellationReason: data.cancellationReason  ?? undefined,
        },
      })

      return this.mapRental(row)
    })
  }

  async updateStatus(
    id: RentalId,
    status: RentalStatus,
    meta?: Partial<Rental>,
  ): Promise<Rental> {
    const now = new Date()
    const timestamps: Record<string, Date> = {}

    if (status === 'CONFIRMED'         ) timestamps['confirmedAt']        = now
    if (status === 'ACTIVE'            ) timestamps['startedAt']          = now
    if (status === 'RETURN_INITIATED'  ) timestamps['returnInitiatedAt']  = now
    if (status === 'RETURN_RECEIVED'   ) timestamps['returnReceivedAt']   = now
    if (status === 'COMPLETED'         ) timestamps['completedAt']        = now
    if (status === 'CANCELLED'         ) timestamps['cancelledAt']        = now

    const row = await this.db.rental.update({
      where: { id },
      data:  {
        status,
        ...timestamps,
        ...(meta?.cancellationReason && { cancellationReason: meta.cancellationReason }),
        ...(meta?.cancellationNote   && { cancellationNote:   meta.cancellationNote }),
        ...(meta?.vendorNotes        && { vendorNotes:        meta.vendorNotes }),
        ...(meta?.depositStatus      && { depositStatus:      meta.depositStatus }),
      },
    })
    return this.mapRental(row)
  }

  async update(id: RentalId, data: Partial<Omit<Rental, 'id' | 'createdAt' | 'productId' | 'renterId' | 'vendorId'>>): Promise<Rental> {
    const row = await this.db.rental.update({
      where: { id },
      data:  data as Prisma.RentalUpdateInput,
    })
    return this.mapRental(row)
  }

  async hasOverlappingActiveRental(
    productId: ProductId,
    startDate: Date,
    endDate:   Date,
    excludeRentalId?: RentalId,
  ): Promise<boolean> {
    const count = await this.db.rental.count({
      where: {
        productId,
        status:    { in: ACTIVE_STATUSES },
        startDate: { lte: endDate },
        endDate:   { gte: startDate },
        ...(excludeRentalId && { NOT: { id: excludeRentalId } }),
      },
    })
    return count > 0
  }

  async findReturnRecord(rentalId: RentalId): Promise<ReturnRecord | null> {
    const row = await this.db.returnRecord.findUnique({
      where:   { rentalId },
      include: { evidence: true },
    })
    return row ? this.mapReturn(row) : null
  }

  async createReturnRecord(
    data: Omit<ReturnRecord, 'id' | 'createdAt' | 'updatedAt' | 'evidence'>,
  ): Promise<ReturnRecord> {
    const row = await this.db.returnRecord.create({
      data: {
        rentalId:            data.rentalId,
        reportedByVendor:    data.reportedByVendor,
        condition:           data.condition as import('@prisma/client').ReturnCondition,
        damageDescription:   data.damageDescription   ?? undefined,
        damageAmount:        data.damageAmount         ?? undefined,
        lateDays:            data.lateDays             ?? undefined,
        latePenalty:         data.latePenalty          ?? undefined,
        outstandingDue:      data.outstandingDue       ?? undefined,
        depositDeduction:    data.depositDeduction,
        depositRefund:       data.depositRefund,
        vendorAgreed:        data.vendorAgreed,
        renterAgreed:        data.renterAgreed,
        adminReviewRequired: data.adminReviewRequired,
      },
      include: { evidence: true },
    })
    return this.mapReturn(row)
  }

  async updateReturnRecord(rentalId: RentalId, data: Partial<ReturnRecord>): Promise<ReturnRecord> {
    const row = await this.db.returnRecord.update({
      where:   { rentalId },
      data:    data as Prisma.ReturnRecordUpdateInput,
      include: { evidence: true },
    })
    return this.mapReturn(row)
  }

  async getVendorAnalytics(
    vendorId: VendorId,
    from:     Date,
    until:    Date,
  ): Promise<VendorAnalytics> {
    const [rentals, depositStats, topProducts] = await this.db.$transaction([
      this.db.rental.findMany({
        where:  { vendorId, createdAt: { gte: from, lte: until } },
        select: {
          status:       true,
          vendorPayout: true,
          depositAmount: true,
          depositStatus: true,
          vendor:       { select: { averageRating: true } },
        },
      }),
      this.db.rental.aggregate({
        _sum:   { vendorPayout: true, depositAmount: true },
        where:  { vendorId, status: 'COMPLETED', createdAt: { gte: from, lte: until } },
      }),
      this.db.rental.groupBy({
        by:     ['productId'],
        _count: { id: true },
        where:  { vendorId, createdAt: { gte: from, lte: until } },
        orderBy: { _count: { id: 'desc' } },
        take:   5,
      }),
    ])

    const topWithNames = await Promise.all(
      topProducts.map(async (p) => {
        const product = await this.db.product.findUnique({ where: { id: p.productId }, select: { name: true } })
        return {
          productId:   asId<ProductId>(p.productId),
          name:        product?.name ?? '',
          rentalCount: p._count.id,
        }
      })
    )

    return {
      totalRentals:     rentals.length,
      completedRentals: rentals.filter((r) => r.status === 'COMPLETED').length,
      cancelledRentals: rentals.filter((r) => r.status === 'CANCELLED').length,
      totalRevenue:     Number(depositStats._sum.vendorPayout ?? 0),
      averageRating:    rentals[0]?.vendor.averageRating ?? 0,
      totalDeposits:    Number(depositStats._sum.depositAmount ?? 0),
      depositsRefunded: rentals.filter((r) => r.depositStatus === 'FULLY_REFUNDED').reduce((s, r) => s + Number(r.depositAmount), 0),
      depositsForfeited: rentals.filter((r) => r.depositStatus === 'FORFEITED').reduce((s, r) => s + Number(r.depositAmount), 0),
      topProducts:      topWithNames,
    }
  }

  private buildWhere(opts: FindRentalsOptions): Prisma.RentalWhereInput {
    return {
      ...(opts.renterId  && { renterId:  opts.renterId  }),
      ...(opts.vendorId  && { vendorId:  opts.vendorId  }),
      ...(opts.productId && { productId: opts.productId }),
      ...(opts.status    && {
        status: Array.isArray(opts.status)
          ? { in: opts.status }
          : opts.status,
      }),
      ...(opts.from  && { startDate: { gte: opts.from  } }),
      ...(opts.until && { endDate:   { lte: opts.until } }),
    }
  }

  private mapRental(row: PrismaRental): Rental {
    return {
      id:                 asId<RentalId>(row.id),
      productId:          asId<ProductId>(row.productId),
      renterId:           asId<UserId>(row.renterId),
      vendorId:           asId<VendorId>(row.vendorId),
      status:             row.status          as RentalStatus,
      startDate:          row.startDate,
      endDate:            row.endDate,
      totalDays:          row.totalDays,
      pricePerDay:        Number(row.pricePerDay),
      rentalFee:          Number(row.rentalFee),
      depositAmount:      Number(row.depositAmount),
      depositStatus:      row.depositStatus   as import('@lendora/shared').DepositStatus,
      platformFeeRate:    Number(row.platformFeeRate),
      platformFee:        Number(row.platformFee),
      vendorPayout:       Number(row.vendorPayout),
      deliveryFee:        Number(row.deliveryFee),
      totalAmount:        Number(row.totalAmount),
      deliveryAddress:    row.deliveryAddress,
      pickupAddress:      row.pickupAddress,
      returnAddress:      row.returnAddress,
      renterNotes:        row.renterNotes,
      vendorNotes:        row.vendorNotes,
      lateDays:           row.lateDays,
      lateFeeAmount:      Number(row.lateFeeAmount),
      overdueNotifiedAt:  row.overdueNotifiedAt,
      confirmedAt:        row.confirmedAt,
      startedAt:          row.startedAt,
      returnInitiatedAt:  row.returnInitiatedAt,
      returnReceivedAt:   row.returnReceivedAt,
      completedAt:        row.completedAt,
      cancelledAt:        row.cancelledAt,
      cancellationReason: row.cancellationReason as import('@lendora/shared').CancellationReason | null,
      cancellationNote:   row.cancellationNote,
      createdAt:          row.createdAt,
      updatedAt:          row.updatedAt,
    }
  }

  private mapReturn(row: PrismaReturn): ReturnRecord {
    return {
      id:                  row.id,
      rentalId:            asId<RentalId>(row.rentalId),
      reportedByVendor:    row.reportedByVendor,
      condition:           row.condition  as import('@lendora/shared').ReturnCondition,
      damageDescription:   row.damageDescription,
      damageAmount:        row.damageAmount    ? Number(row.damageAmount)    : null,
      lateDays:            row.lateDays        ?? null,
      latePenalty:         row.latePenalty     ? Number(row.latePenalty)     : null,
      outstandingDue:      row.outstandingDue  ? Number(row.outstandingDue)  : null,
      depositDeduction:    Number(row.depositDeduction),
      depositRefund:       Number(row.depositRefund),
      vendorAgreed:        row.vendorAgreed,
      renterAgreed:        row.renterAgreed,
      adminReviewRequired: row.adminReviewRequired,
      createdAt:           row.createdAt,
      updatedAt:           row.updatedAt,
      evidence:            row.evidence.map((e) => ({
        id:          asId<import('@lendora/shared').MediaId>(e.id),
        fileUrl:     e.fileUrl,
        type:        e.type as 'photo' | 'video',
        uploadedBy:  asId<UserId>(e.uploadedBy),
        uploadedAt:  e.uploadedAt,
      })),
    }
  }
}
