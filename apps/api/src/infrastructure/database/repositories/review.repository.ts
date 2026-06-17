import type { PrismaClient, Prisma } from '@prisma/client'
import type {
  IReviewRepository, FindReviewsOptions,
} from '@/application/ports/repositories/review.repository.port.js'
import type { Review, ReviewId, RentalId, ProductId, UserId, VendorId } from '@lendora/shared'
import { asId } from '@lendora/shared'

type PrismaReview = Prisma.ReviewGetPayload<Record<string, never>>

export class PrismaReviewRepository implements IReviewRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: ReviewId): Promise<Review | null> {
    const row = await this.db.review.findUnique({ where: { id } })
    return row ? this.mapReview(row) : null
  }

  async findByRentalId(rentalId: RentalId): Promise<Review | null> {
    const row = await this.db.review.findUnique({ where: { rentalId } })
    return row ? this.mapReview(row) : null
  }

  async findMany(opts: FindReviewsOptions): Promise<{ items: Review[]; total: number }> {
    const where: Prisma.ReviewWhereInput = {
      ...(opts.productId  && { productId:  opts.productId }),
      ...(opts.vendorId   && { vendorId:   opts.vendorId as string }),
      ...(opts.reviewerId && { reviewerId: opts.reviewerId }),
      ...(opts.minRating  !== undefined && { rating: { gte: opts.minRating } }),
    }

    const page  = opts.page  ?? 1
    const limit = opts.limit ?? 20

    const [rows, total] = await this.db.$transaction([
      this.db.review.findMany({
        where,
        skip:    (page - 1) * limit,
        take:    limit,
        orderBy: { createdAt: 'desc' },
        include: {
          reviewer: { select: { name: true, avatarUrl: true } },
        },
      }),
      this.db.review.count({ where }),
    ])

    return { items: rows.map((r) => this.mapReview(r as PrismaReview)), total }
  }

  async create(data: Omit<Review, 'id' | 'createdAt' | 'helpfulCount'>): Promise<Review> {
    const row = await this.db.review.create({
      data: {
        rentalId:    data.rentalId,
        productId:   data.productId,
        vendorId:    data.vendorId,
        reviewerId:  data.reviewerId,
        rating:      data.rating,
        title:       data.title       ?? undefined,
        body:        data.body,
        isVerified:  true,
        vendorReply: data.vendorReply ?? undefined,
      },
    })
    return this.mapReview(row)
  }

  async addVendorReply(id: ReviewId, reply: string): Promise<Review> {
    const row = await this.db.review.update({
      where: { id },
      data:  { vendorReply: reply, vendorRepliedAt: new Date() },
    })
    return this.mapReview(row)
  }

  async incrementHelpful(id: ReviewId): Promise<void> {
    await this.db.review.update({
      where: { id },
      data:  { helpfulCount: { increment: 1 } },
    })
  }

  async existsForRental(rentalId: RentalId): Promise<boolean> {
    const count = await this.db.review.count({ where: { rentalId } })
    return count > 0
  }

  async getAverageRating(productId: ProductId): Promise<{ avg: number; count: number }> {
    const result = await this.db.review.aggregate({
      _avg:   { rating: true },
      _count: { id: true },
      where:  { productId },
    })
    return {
      avg:   result._avg.rating  ?? 0,
      count: result._count.id,
    }
  }

  private mapReview(row: PrismaReview): Review {
    return {
      id:              asId<ReviewId>(row.id),
      rentalId:        asId<RentalId>(row.rentalId),
      productId:       asId<ProductId>(row.productId),
      vendorId:        asId<VendorId>(row.vendorId),
      reviewerId:      asId<UserId>(row.reviewerId),
      rating:          row.rating as 1 | 2 | 3 | 4 | 5,
      title:           row.title,
      body:            row.body,
      vendorReply:     row.vendorReply,
      vendorRepliedAt: row.vendorRepliedAt,
      isVerified:      row.isVerified as true,
      helpfulCount:    row.helpfulCount,
      createdAt:       row.createdAt,
    }
  }
}
