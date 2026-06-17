import type { IRentalRepository }  from '@/application/ports/repositories/rental.repository.port.js'
import type { IReviewRepository }  from '@/application/ports/repositories/review.repository.port.js'
import type { IProductRepository } from '@/application/ports/repositories/product.repository.port.js'
import type { Review, RentalId, UserId } from '@lendora/shared'
import { DomainError }             from '@/domain/errors/index.js'

interface Deps {
  rentalRepo:  IRentalRepository
  reviewRepo:  IReviewRepository
  productRepo: IProductRepository
}

interface CreateReviewInput {
  rentalId: RentalId
  renterId: UserId
  rating:   number
  title?:   string
  body:     string
}

export class CreateReviewUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: CreateReviewInput): Promise<Review> {
    const rental = await this.deps.rentalRepo.findById(input.rentalId)
    if (!rental) throw new DomainError('RENTAL_NOT_FOUND', 'Rental not found', 404)
    if (rental.renterId !== input.renterId) throw new DomainError('FORBIDDEN', 'Not authorized', 403)
    if (rental.status !== 'COMPLETED') {
      throw new DomainError('RENTAL_NOT_COMPLETED', 'You can only review completed rentals', 422)
    }

    const exists = await this.deps.reviewRepo.existsForRental(input.rentalId)
    if (exists) throw new DomainError('REVIEW_EXISTS', 'You have already reviewed this rental', 409)

    const review = await this.deps.reviewRepo.create({
      rentalId:        input.rentalId,
      productId:       rental.productId,
      vendorId:        rental.vendorId,
      reviewerId:      input.renterId,
      rating:          input.rating as 1 | 2 | 3 | 4 | 5,
      title:           input.title ?? null,
      body:            input.body,
      isVerified:      true,
      vendorReply:     null,
      vendorRepliedAt: null,
    })

    const { avg, count } = await this.deps.reviewRepo.getAverageRating(rental.productId)
    await this.deps.productRepo.updateRatingCache(rental.productId, avg, count)

    // Update vendor average rating
    return review
  }
}
