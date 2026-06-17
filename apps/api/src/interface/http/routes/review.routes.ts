import { Router }          from 'express'
import { z }               from 'zod'
import type { Request, Response, NextFunction } from 'express'
import { getContainer }    from '@/infrastructure/container/container.js'
import { authenticate, authorize } from '@/interface/http/middleware/authenticate.middleware.js'
import { validateBody, validateParams, validateQuery } from '@/interface/http/middleware/validate.middleware.js'
import { CreateReviewUseCase } from '@/application/use-cases/review/create-review.use-case.js'
import { asId }            from '@lendora/shared'
import type { RentalId, ReviewId, UserId } from '@lendora/shared'

const IdSchema        = z.object({ id: z.string() })
const RentalIdSchema  = z.object({ rentalId: z.string() })

const CreateReviewSchema = z.object({
  rentalId: z.string(),
  rating:   z.number().int().min(1).max(5),
  title:    z.string().max(100).optional(),
  body:     z.string().min(1).max(1000),
})

const ReplySchema = z.object({
  reply: z.string().min(1).max(1000),
})

const VendorFeedbackSchema = z.object({
  rentalId: z.string(),
  rating:   z.number().int().min(1).max(5),
  comment:  z.string().max(1000).optional(),
})

const ListQuerySchema = z.object({
  page:  z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
})

export const reviewRouter = Router()

/* GET /reviews/featured
 * Returns up to 4 recent high-rating reviews + live platform trust stats.
 */
reviewRouter.get('/featured', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const c = getContainer()
    const [reviews, ratingAgg, depositsReturned, totalCompleted] = await Promise.all([
      c.prisma.review.findMany({
        where:   { rating: { gte: 4 } },
        orderBy: { createdAt: 'desc' },
        take:    4,
        include: {
          reviewer: { select: { name: true } },
          product:  { select: { name: true } },
        },
      }),
      c.prisma.review.aggregate({
        _avg:   { rating: true },
        _count: { id: true },
      }),
      c.prisma.rental.count({ where: { status: 'COMPLETED', depositStatus: 'FULLY_REFUNDED' } }),
      c.prisma.rental.count({ where: { status: 'COMPLETED' } }),
    ])

    const now = Date.now()
    res.json({
      success: true,
      data: {
        reviews: reviews.map((r) => ({
          id:              r.id,
          rating:          r.rating,
          body:            r.body,
          daysAgo:         Math.max(0, Math.floor((now - r.createdAt.getTime()) / 86_400_000)),
          productName:     r.product.name,
          reviewerName:    r.reviewer.name,
          reviewerInitial: r.reviewer.name.charAt(0).toUpperCase(),
        })),
        stats: {
          averageRating:     ratingAgg._avg.rating ? Math.round(ratingAgg._avg.rating * 10) / 10 : null,
          totalReviews:      ratingAgg._count.id,
          depositReturnRate: totalCompleted > 0 ? Math.round((depositsReturned / totalCompleted) * 100) : null,
        },
      },
    })
  } catch (err) { next(err) }
})

/* GET /reviews/rental/:rentalId — review for a specific rental */
reviewRouter.get('/rental/:rentalId', authenticate, validateParams(RentalIdSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c      = getContainer()
    const review = await c.repos.review.findByRentalId(asId<RentalId>(req.params['rentalId']!))
    if (!review) { res.json({ success: true, data: null }); return }

    // Enrich with reviewer name
    const reviewer = await c.prisma.user.findUnique({
      where:  { id: review.reviewerId },
      select: { name: true, avatarUrl: true },
    })
    res.json({ success: true, data: { ...review, reviewerName: reviewer?.name ?? null, reviewerAvatar: reviewer?.avatarUrl ?? null } })
  } catch (err) { next(err) }
})

/* GET /reviews/vendor-feedback/rental/:rentalId — vendor feedback for a rental */
reviewRouter.get('/vendor-feedback/rental/:rentalId', authenticate, validateParams(RentalIdSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c        = getContainer()
    const feedback = await c.prisma.vendorFeedback.findUnique({ where: { rentalId: req.params['rentalId']! } })
    res.json({ success: true, data: feedback ?? null })
  } catch (err) { next(err) }
})

/* GET /reviews/product/:productId — paginated reviews for a product */
reviewRouter.get('/product/:id', validateParams(IdSchema), validateQuery(ListQuerySchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c     = getContainer()
    const query = (req as any).validatedQuery as z.infer<typeof ListQuerySchema>

    const [rows, total] = await Promise.all([
      c.prisma.review.findMany({
        where:   { productId: req.params['id']! },
        orderBy: { createdAt: 'desc' },
        skip:    (query.page - 1) * query.limit,
        take:    query.limit,
        include: { reviewer: { select: { name: true, avatarUrl: true } } },
      }),
      c.prisma.review.count({ where: { productId: req.params['id']! } }),
    ])

    res.json({
      success: true,
      data: {
        items: rows.map((r) => ({
          id:              r.id,
          rating:          r.rating,
          title:           r.title,
          body:            r.body,
          vendorReply:     r.vendorReply,
          vendorRepliedAt: r.vendorRepliedAt,
          helpfulCount:    r.helpfulCount,
          createdAt:       r.createdAt,
          reviewerName:    r.reviewer.name,
          reviewerAvatar:  r.reviewer.avatarUrl,
        })),
        total,
      },
    })
  } catch (err) { next(err) }
})

/* POST /reviews — customer submits review */
reviewRouter.post('/', authenticate, authorize('CUSTOMER'), validateBody(CreateReviewSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c    = getContainer()
    const body = req.body as z.infer<typeof CreateReviewSchema>

    const review = await new CreateReviewUseCase({
      rentalRepo:  c.repos.rental,
      reviewRepo:  c.repos.review,
      productRepo: c.repos.product,
    }).execute({
      rentalId: asId<RentalId>(body.rentalId),
      renterId: asId<UserId>(req.user!.userId),
      rating:   body.rating,
      title:    body.title,
      body:     body.body,
    })

    // Update vendor profile average rating
    const vendorAvg = await c.prisma.review.aggregate({
      where: { vendorId: review.vendorId },
      _avg:  { rating: true },
    })
    await c.prisma.vendorProfile.update({
      where: { id: review.vendorId },
      data:  { averageRating: vendorAvg._avg.rating ?? 0 },
    })

    res.status(201).json({ success: true, data: review })
  } catch (err) { next(err) }
})

/* POST /reviews/:id/reply — vendor replies to a review */
reviewRouter.post('/:id/reply', authenticate, authorize('VENDOR'), validateParams(IdSchema), validateBody(ReplySchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c      = getContainer()
    const review = await c.repos.review.findById(asId<ReviewId>(req.params['id']!))
    if (!review) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Review not found' } }); return }

    const vendor = await c.repos.vendor.findByUserId(asId<UserId>(req.user!.userId))
    if (!vendor || vendor.id !== review.vendorId) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Not your review to reply to' } }); return
    }

    const updated = await c.repos.review.addVendorReply(review.id, req.body.reply)
    res.json({ success: true, data: updated })
  } catch (err) { next(err) }
})

/* POST /reviews/vendor-feedback — vendor rates a customer */
reviewRouter.post('/vendor-feedback', authenticate, authorize('VENDOR'), validateBody(VendorFeedbackSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c    = getContainer()
    const body = req.body as z.infer<typeof VendorFeedbackSchema>

    const rental = await c.repos.rental.findById(asId<RentalId>(body.rentalId))
    if (!rental) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Rental not found' } }); return }
    if (rental.status !== 'COMPLETED') {
      res.status(422).json({ success: false, error: { code: 'RENTAL_NOT_COMPLETED', message: 'Rental must be completed to leave feedback' } }); return
    }

    const vendor = await c.repos.vendor.findByUserId(asId<UserId>(req.user!.userId))
    if (!vendor || vendor.id !== rental.vendorId) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Not your rental' } }); return
    }

    const existing = await c.prisma.vendorFeedback.findUnique({ where: { rentalId: body.rentalId } })
    if (existing) {
      res.status(409).json({ success: false, error: { code: 'FEEDBACK_EXISTS', message: 'You have already left feedback for this rental' } }); return
    }

    const feedback = await c.prisma.vendorFeedback.create({
      data: {
        rentalId:   body.rentalId,
        vendorId:   vendor.id,
        customerId: rental.renterId,
        rating:     body.rating,
        comment:    body.comment ?? undefined,
      },
    })

    res.status(201).json({ success: true, data: feedback })
  } catch (err) { next(err) }
})
