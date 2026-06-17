import type { Review, ReviewId, RentalId, ProductId, UserId } from '@lendora/shared'

export interface FindReviewsOptions {
  productId?:  ProductId
  vendorId?:   string
  reviewerId?: UserId
  minRating?:  number
  page?:       number
  limit?:      number
}

export interface IReviewRepository {
  findById(id: ReviewId): Promise<Review | null>
  findByRentalId(rentalId: RentalId): Promise<Review | null>
  findMany(opts: FindReviewsOptions): Promise<{ items: Review[]; total: number }>

  create(data: Omit<Review, 'id' | 'createdAt' | 'helpfulCount'>): Promise<Review>
  addVendorReply(id: ReviewId, reply: string): Promise<Review>
  incrementHelpful(id: ReviewId): Promise<void>

  existsForRental(rentalId: RentalId): Promise<boolean>
  getAverageRating(productId: ProductId): Promise<{ avg: number; count: number }>
}
