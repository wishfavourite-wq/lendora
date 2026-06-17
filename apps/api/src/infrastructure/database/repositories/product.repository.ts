import type { PrismaClient, Prisma } from '@prisma/client'
import type { IProductRepository } from '@/application/ports/repositories/product.repository.port.js'
import type {
  Product, ProductId, VendorId, CategoryId,
  ProductSearchFilters, ProductSearchResult, DateRange,
} from '@lendora/shared'
import { asId } from '@lendora/shared'

type PrismaProduct = Prisma.ProductGetPayload<{
  include: { media: true }
}>

const ACTIVE_RENTAL_STATUSES = [
  'PENDING_CONFIRMATION',
  'CONFIRMED',
  'READY_FOR_PICKUP',
  'ACTIVE',
] as const

// Only confirmed-and-beyond rentals lock the product as unavailable
const LOCKING_RENTAL_STATUSES = [
  'CONFIRMED',
  'READY_FOR_PICKUP',
  'ACTIVE',
] as const

export class PrismaProductRepository implements IProductRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: ProductId): Promise<Product | null> {
    const row = await this.db.product.findFirst({
      where:   { id, deletedAt: null },
      include: { media: { orderBy: { sortOrder: 'asc' } } },
    })
    return row ? this.mapProduct(row) : null
  }

  async findBySlug(slug: string): Promise<Product | null> {
    const row = await this.db.product.findFirst({
      where:   { slug, deletedAt: null },
      include: { media: { orderBy: { sortOrder: 'asc' } } },
    })
    return row ? this.mapProduct(row) : null
  }

  async findByVendorId(
    vendorId: VendorId,
    page = 1,
    limit = 20,
    status?: string,
  ): Promise<{ items: Product[]; total: number }> {
    const where: Prisma.ProductWhereInput = {
      vendorId,
      deletedAt: null,
      ...(status && { status: status as any }),
    }
    const [rows, total] = await this.db.$transaction([
      this.db.product.findMany({
        where,
        include: { media: { orderBy: { sortOrder: 'asc' } } },
        skip:    (page - 1) * limit,
        take:    limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.db.product.count({ where }),
    ])
    return { items: rows.map(this.mapProduct), total }
  }

  async search(
    filters: ProductSearchFilters,
    page: number,
    limit: number,
  ): Promise<ProductSearchResult> {
    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      status:    'ACTIVE',
      ...(filters.categoryId && {
        OR: [
          { categoryId: filters.categoryId },
          { category: { parentId: filters.categoryId } },
        ],
      }),
      ...(filters.district   && { district: { contains: filters.district } }),
      ...(filters.division   && { division: { contains: filters.division } }),
      ...(filters.condition?.length && { condition: { in: filters.condition } }),
      ...(filters.deliveryOnly      && { deliveryAvailable: true }),
      ...(filters.instantBooking    && { isInstantBooking: true }),
      ...(filters.minPrice !== undefined && {
        pricePerDay: { gte: filters.minPrice },
      }),
      ...(filters.maxPrice !== undefined && {
        pricePerDay: { ...(filters.minPrice !== undefined ? { gte: filters.minPrice } : {}), lte: filters.maxPrice },
      }),
      ...(filters.minRating !== undefined && {
        averageRating: { gte: filters.minRating },
      }),
      ...(filters.query && {
        OR: [
          { name:        { contains: filters.query } },
          { description: { contains: filters.query } },
          { brand:       { contains: filters.query } },
          { model:       { contains: filters.query } },
        ],
      }),
      ...(filters.availableFrom && filters.availableUntil && {
        NOT: {
          rentals: {
            some: {
              status:    { in: [...ACTIVE_RENTAL_STATUSES] },
              startDate: { lte: filters.availableUntil },
              endDate:   { gte: filters.availableFrom },
            },
          },
        },
      }),
    }

    const skip = (page - 1) * limit
    const now = new Date()
    const [rows, total, activeRentalsNow] = await this.db.$transaction([
      this.db.product.findMany({
        where,
        include: {
          media: { orderBy: { sortOrder: 'asc' }, take: 1 },
          vendor: {
            select: {
              id:           true,
              businessName: true,
              user: { select: { avatarUrl: true } },
            },
          },
        },
        skip,
        take:    limit,
        orderBy: [{ averageRating: 'desc' }, { totalRentals: 'desc' }, { createdAt: 'desc' }],
      }),
      this.db.product.count({ where }),
      // Fetch IDs of products locked by a confirmed rental covering right now
      this.db.rental.findMany({
        where: {
          status:    { in: [...LOCKING_RENTAL_STATUSES] },
          startDate: { lte: now },
          endDate:   { gte: now },
        },
        select: { productId: true },
      }),
    ])

    const rentedOutIds = new Set(activeRentalsNow.map((r) => r.productId))

    return {
      items: rows.map((row) => ({
        ...this.mapProduct(row as any),
        isAvailableNow:  !rentedOutIds.has(row.id),
        vendorName:      (row as any).vendor?.businessName ?? '',
        vendorAvatarUrl: (row as any).vendor?.user?.avatarUrl ?? null,
      })) as any,
      total,
      page,
      pageSize:   limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  async findFeatured(limit: number): Promise<Product[]> {
    const rows = await this.db.product.findMany({
      where:   { status: 'ACTIVE', deletedAt: null, averageRating: { gte: 4.0 } },
      include: { media: { orderBy: { sortOrder: 'asc' }, take: 1 } },
      take:    limit,
      orderBy: [{ totalRentals: 'desc' }, { averageRating: 'desc' }],
    })
    return rows.map(this.mapProduct)
  }

  async findRecent(limit: number): Promise<Product[]> {
    const rows = await this.db.product.findMany({
      where:   { status: 'ACTIVE', deletedAt: null },
      include: { media: { orderBy: { sortOrder: 'asc' }, take: 1 } },
      take:    limit,
      orderBy: { createdAt: 'desc' },
    })
    return rows.map(this.mapProduct)
  }

  async create(
    data: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'totalRentals' | 'averageRating' | 'reviewCount' | 'media'>,
    mediaUrls?: string[],
  ): Promise<Product> {
    const slug = await this.uniqueSlug(data.name, data.vendorId)
    const row = await this.db.product.create({
      data: {
        vendorId:          data.vendorId,
        categoryId:        data.categoryId,
        name:              data.name,
        slug,
        description:       data.description,
        pricePerDay:       data.pricePerDay,
        pricePerWeek:      data.pricePerWeek      ?? undefined,
        pricePerMonth:     data.pricePerMonth     ?? undefined,
        depositAmount:     data.depositAmount,
        condition:         data.condition,
        status:            data.status,
        brand:             data.brand             ?? undefined,
        model:             data.model             ?? undefined,
        district:          data.district,
        division:          data.division,
        address:           data.address           ?? undefined,
        minRentalDays:     data.minRentalDays,
        maxRentalDays:     data.maxRentalDays      ?? undefined,
        deliveryAvailable: data.deliveryAvailable,
        deliveryFee:       data.deliveryFee        ?? undefined,
        deliveryOptions:   (data as any).deliveryOptions ?? [],
        specifications:    data.specifications     ?? undefined,
        tags:              data.tags,
        quantity:          data.quantity          ?? 1,
        isInstantBooking:  data.isInstantBooking,
        ...(mediaUrls?.length && {
          media: {
            create: mediaUrls.map((url, i) => ({
              url,
              sortOrder: i,
              isPrimary: i === 0,
              altText:   null,
            })),
          },
        }),
      },
      include: { media: { orderBy: { sortOrder: 'asc' } } },
    })
    return this.mapProduct(row)
  }

  async update(
    id: ProductId,
    data: Partial<Omit<Product, 'id' | 'createdAt' | 'vendorId'>> & { mediaUrls?: string[] },
  ): Promise<Product> {
    const scalarUpdate = {
      ...(data.name              !== undefined && { name:              data.name }),
      ...(data.description       !== undefined && { description:       data.description }),
      ...(data.categoryId        !== undefined && { categoryId:        data.categoryId }),
      ...(data.pricePerDay       !== undefined && { pricePerDay:       data.pricePerDay }),
      ...(data.pricePerWeek      !== undefined && { pricePerWeek:      data.pricePerWeek  ?? null }),
      ...(data.pricePerMonth     !== undefined && { pricePerMonth:     data.pricePerMonth ?? null }),
      ...(data.depositAmount     !== undefined && { depositAmount:     data.depositAmount }),
      ...(data.condition         !== undefined && { condition:         data.condition }),
      ...(data.status            !== undefined && { status:            data.status }),
      ...(data.brand             !== undefined && { brand:             data.brand    ?? null }),
      ...(data.model             !== undefined && { model:             data.model    ?? null }),
      ...(data.district          !== undefined && { district:          data.district }),
      ...(data.division          !== undefined && { division:          data.division }),
      ...(data.address           !== undefined && { address:           data.address  ?? null }),
      ...(data.minRentalDays     !== undefined && { minRentalDays:     data.minRentalDays }),
      ...(data.maxRentalDays     !== undefined && { maxRentalDays:     data.maxRentalDays ?? null }),
      ...(data.deliveryAvailable !== undefined && { deliveryAvailable: data.deliveryAvailable }),
      ...(data.deliveryFee       !== undefined && { deliveryFee:       data.deliveryFee       ?? null }),
      ...((data as any).deliveryOptions !== undefined && { deliveryOptions: (data as any).deliveryOptions }),
      ...(data.availableFrom     !== undefined && { availableFrom:     data.availableFrom     ?? null }),
      ...(data.availableUntil    !== undefined && { availableUntil:    data.availableUntil    ?? null }),
      ...(data.quantity          !== undefined && { quantity:          data.quantity }),
      ...(data.isInstantBooking  !== undefined && { isInstantBooking:  data.isInstantBooking }),
      ...(data.tags              !== undefined && { tags:              data.tags }),
      ...(data.specifications    !== undefined && { specifications:    data.specifications ?? undefined }),
    }

    if (data.mediaUrls?.length) {
      const [row] = await this.db.$transaction([
        this.db.product.update({
          where: { id },
          data:  {
            ...scalarUpdate,
            media: {
              deleteMany: {},
              create: data.mediaUrls.map((url, i) => ({
                url, sortOrder: i, isPrimary: i === 0, altText: null,
              })),
            },
          },
          include: { media: { orderBy: { sortOrder: 'asc' } } },
        }),
      ])
      return this.mapProduct(row)
    }

    const row = await this.db.product.update({
      where:   { id },
      data:    scalarUpdate,
      include: { media: { orderBy: { sortOrder: 'asc' } } },
    })
    return this.mapProduct(row)
  }

  async softDelete(id: ProductId): Promise<void> {
    await this.db.product.update({
      where: { id },
      data:  { deletedAt: new Date(), status: 'DELETED' },
    })
  }

  async getUnavailableDates(id: ProductId): Promise<Date[]> {
    const [rentals, blocked] = await this.db.$transaction([
      this.db.rental.findMany({
        where:  { productId: id, status: { in: [...LOCKING_RENTAL_STATUSES] } },
        select: { startDate: true, endDate: true },
      }),
      this.db.productBlockedDate.findMany({
        where:  { productId: id },
        select: { date: true },
      }),
    ])

    const dates: Date[] = blocked.map((b) => b.date)

    for (const rental of rentals) {
      const cursor = new Date(rental.startDate)
      while (cursor <= rental.endDate) {
        dates.push(new Date(cursor))
        cursor.setDate(cursor.getDate() + 1)
      }
    }

    return dates
  }

  async isAvailableForRange(id: ProductId, range: DateRange): Promise<boolean> {
    const overlap = await this.db.rental.count({
      where: {
        productId: id,
        status:    { in: [...LOCKING_RENTAL_STATUSES] },
        startDate: { lte: range.endDate },
        endDate:   { gte: range.startDate },
      },
    })
    if (overlap > 0) return false

    const blockedCount = await this.db.productBlockedDate.count({
      where: {
        productId: id,
        date: { gte: range.startDate, lte: range.endDate },
      },
    })
    return blockedCount === 0
  }

  async blockDates(id: ProductId, dates: Date[], reason?: string): Promise<void> {
    await this.db.productBlockedDate.createMany({
      data:            dates.map((date) => ({ productId: id, date, reason })),
      skipDuplicates:  true,
    })
  }

  async unblockDates(id: ProductId, dates: Date[]): Promise<void> {
    await this.db.productBlockedDate.deleteMany({
      where: { productId: id, date: { in: dates } },
    })
  }

  async updateRatingCache(id: ProductId, avg: number, count: number): Promise<void> {
    await this.db.product.update({
      where: { id },
      data:  { averageRating: avg, reviewCount: count },
    })
  }

  async incrementRentalCount(id: ProductId): Promise<void> {
    await this.db.product.update({
      where: { id },
      data:  { totalRentals: { increment: 1 } },
    })
  }

  async findByCategory(
    categoryId: CategoryId,
    page: number,
    limit: number,
  ): Promise<ProductSearchResult> {
    return this.search({ categoryId }, page, limit)
  }

  private async uniqueSlug(name: string, vendorId: VendorId): Promise<string> {
    const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)
    let slug = base
    let attempt = 0

    while (await this.db.product.findFirst({ where: { slug } })) {
      slug = `${base}-${++attempt}`
    }
    return slug
  }

  private mapProduct(row: PrismaProduct): Product {
    return {
      id:               asId<ProductId>(row.id),
      vendorId:         asId<VendorId>(row.vendorId),
      categoryId:       asId<CategoryId>(row.categoryId),
      name:             row.name,
      slug:             row.slug,
      description:      row.description,
      pricePerDay:      Number(row.pricePerDay),
      pricePerWeek:     row.pricePerWeek  ? Number(row.pricePerWeek)  : null,
      pricePerMonth:    row.pricePerMonth ? Number(row.pricePerMonth) : null,
      depositAmount:    Number(row.depositAmount),
      condition:        row.condition as import('@lendora/shared').ProductCondition,
      status:           row.status    as import('@lendora/shared').ProductStatus,
      brand:            row.brand,
      model:            row.model,
      district:         row.district,
      division:         row.division,
      address:          row.address,
      availableFrom:    row.availableFrom,
      availableUntil:   row.availableUntil,
      minRentalDays:    row.minRentalDays,
      maxRentalDays:    row.maxRentalDays,
      deliveryAvailable: row.deliveryAvailable,
      deliveryFee:       row.deliveryFee ? Number(row.deliveryFee) : null,
      deliveryOptions:   (row as any).deliveryOptions ?? [],
      specifications:   row.specifications as Record<string, string> | null,
      tags:             row.tags as string[],
      totalRentals:     row.totalRentals,
      averageRating:    row.averageRating,
      reviewCount:      row.reviewCount,
      quantity:         row.quantity,
      isInstantBooking: row.isInstantBooking,
      media:            row.media.map((m) => ({
        id:        asId<import('@lendora/shared').MediaId>(m.id),
        productId: asId<ProductId>(m.productId),
        url:       m.url,
        altText:   m.altText,
        sortOrder: m.sortOrder,
        isPrimary: m.isPrimary,
      })),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }
  }
}
