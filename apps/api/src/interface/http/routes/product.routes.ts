import { Router }              from 'express'
import { z }                   from 'zod'
import { getContainer }        from '@/infrastructure/container/container.js'
import { validateBody, validateQuery, validateParams } from '@/interface/http/middleware/validate.middleware.js'
import { authenticate, authorize } from '@/interface/http/middleware/authenticate.middleware.js'
import { uploadSingle, processUploadedFile, uploadMultiple, processUploadedFiles } from '@/interface/http/middleware/upload.middleware.js'
import { CreateProductUseCase }  from '@/application/use-cases/product/create-product.use-case.js'
import { UpdateProductUseCase }  from '@/application/use-cases/product/update-product.use-case.js'
import { DeleteProductUseCase }  from '@/application/use-cases/product/delete-product.use-case.js'
import type { Request, Response, NextFunction } from 'express'
import { asId } from '@lendora/shared'
import type { ProductId, UserId } from '@lendora/shared'
import { getCourierFees } from '@/utils/courier.js'

const SearchSchema = z.object({
  q:              z.string().optional(),
  categoryId:     z.string().optional(),
  district:       z.string().optional(),
  division:       z.string().optional(),
  minPrice:       z.coerce.number().optional(),
  maxPrice:       z.coerce.number().optional(),
  minRating:      z.coerce.number().min(0).max(5).optional(),
  availableFrom:  z.coerce.date().optional(),
  availableUntil: z.coerce.date().optional(),
  deliveryOnly:   z.coerce.boolean().optional(),
  instantBooking: z.coerce.boolean().optional(),
  page:           z.coerce.number().int().min(1).default(1),
  limit:          z.coerce.number().int().min(1).max(50).default(20),
})

const CreateSchema = z.object({
  name:               z.string().min(3).max(200),
  description:        z.string().min(20).max(5000),
  categoryId:         z.string().min(1),
  subcategoryId:      z.string().min(1).optional(),
  pricePerDay:        z.coerce.number().positive(),
  pricePerWeek:       z.coerce.number().positive().optional(),
  pricePerMonth:      z.coerce.number().positive().optional(),
  depositAmount:      z.coerce.number().nonnegative(),
  condition:          z.enum(['NEW','LIKE_NEW','GOOD','FAIR']),
  brand:              z.string().optional(),
  model:              z.string().optional(),
  district:           z.string().min(2),
  division:           z.string().min(2),
  address:            z.string().optional(),
  minRentalDays:      z.coerce.number().int().min(1).default(1),
  maxRentalDays:      z.coerce.number().int().optional(),
  advanceNoticeDays:  z.coerce.number().int().min(0).default(0),
  deliveryAvailable:  z.coerce.boolean().default(false),
  deliveryFee:        z.coerce.number().nonnegative().optional(),
  deliveryOption:     z.enum(['CUSTOMER_PICKUP','COURIER']).optional(),
  deliveryOptions:    z.array(z.enum(['CUSTOMER_PICKUP','COURIER'])).default([]),
  returnPickupFee:    z.coerce.number().nonnegative().optional(),
  mediaUrls:          z.array(z.string().url()).optional(),
  specifications:     z.record(z.string()).optional(),
  tags:               z.array(z.string()).default([]),
  quantity:           z.coerce.number().int().min(1).default(1),
  availableFrom:      z.coerce.date().optional(),
  availableUntil:     z.coerce.date().optional(),
  isInstantBooking:   z.coerce.boolean().default(false),
})

const UpdateSchema = CreateSchema.partial()
const IdSchema     = z.object({ id: z.string().min(1) })

export const productRouter = Router()

productRouter.get('/courier-fees', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const c = getContainer()
    res.json({ success: true, data: await getCourierFees(c.prisma) })
  } catch (err) { next(err) }
})

productRouter.get('/', validateQuery(SearchSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c      = getContainer()
    const query  = (req as any).validatedQuery as z.infer<typeof SearchSchema>
    const result = await c.repos.product.search({ query: query.q, ...query }, query.page, query.limit)
    res.json({ success: true, data: result })
  } catch (err) { next(err) }
})

productRouter.get('/featured', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const c   = getContainer()
    const key = 'products:featured'
    const cached = await c.cache.get<object>(key)
    if (cached) { res.json({ success: true, data: cached }); return }
    const items = await c.repos.product.findFeatured(12)
    await c.cache.set(key, items, 300)
    res.json({ success: true, data: items })
  } catch (err) { next(err) }
})

productRouter.get('/recent', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const c = getContainer()
    res.json({ success: true, data: await c.repos.product.findRecent(20) })
  } catch (err) { next(err) }
})

productRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c        = getContainer()
    const idOrSlug = req.params['id']!
    // Try ID lookup first (handles both UUID and cuid), then fall back to slug
    let p = await c.repos.product.findById(asId<ProductId>(idOrSlug))
    if (!p) p = await c.repos.product.findBySlug(idOrSlug)
    if (!p) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } }); return }
    res.json({ success: true, data: p })
  } catch (err) { next(err) }
})

productRouter.get('/:id/availability', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c = getContainer()
    const dates = await c.repos.product.getUnavailableDates(asId<ProductId>(req.params['id']!))
    res.json({ success: true, data: { unavailableDates: dates } })
  } catch (err) { next(err) }
})

// POST /products/upload-media — upload a single image and receive a URL back
productRouter.post(
  '/upload-media',
  authenticate, authorize('VENDOR'),
  uploadSingle, processUploadedFile('products'),
  async (req: Request, res: Response) => {
    const url = req.body.uploadedUrl as string
    res.status(201).json({ success: true, data: { url } })
  }
)

productRouter.post(
  '/',
  authenticate, authorize('VENDOR'),
  validateBody(CreateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const c    = getContainer()
      const body = req.body as z.infer<typeof CreateSchema>

      // Build delivery flags from deliveryOptions array
      const { deliveryOptions } = body
      let { deliveryAvailable, deliveryFee } = body
      if (deliveryOptions && deliveryOptions.length > 0) {
        const hasCourier = deliveryOptions.includes('COURIER')
        const hasDelivery = deliveryOptions.some((o) => o !== 'CUSTOMER_PICKUP')
        deliveryAvailable = hasDelivery
        if (hasCourier) {
          const fees = await getCourierFees(c.prisma)
          deliveryFee = fees.forwardFee
        }
      }

      const p = await new CreateProductUseCase({ productRepo: c.repos.product, vendorRepo: c.repos.vendor, cache: c.cache })
        .execute(asId<UserId>(req.user!.userId), {
          ...body,
          deliveryAvailable,
          deliveryFee,
          deliveryOptions: deliveryOptions ?? [],
          status:         'PENDING_REVIEW',
          availableFrom:  body.availableFrom  ?? null,
          availableUntil: body.availableUntil ?? null,
        } as any)
      res.status(201).json({ success: true, data: p })
    } catch (err) { next(err) }
  }
)

productRouter.patch(
  '/:id',
  authenticate, authorize('VENDOR', 'ADMIN'),
  validateParams(IdSchema),
  validateBody(UpdateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const c    = getContainer()
      const body = req.body as z.infer<typeof UpdateSchema>

      // Compute deliveryAvailable from deliveryOptions if provided
      let patchData: Record<string, unknown> = { ...body }
      if (body.deliveryOptions && body.deliveryOptions.length > 0) {
        const hasCourier  = body.deliveryOptions.includes('COURIER')
        const hasDelivery = body.deliveryOptions.some((o) => o !== 'CUSTOMER_PICKUP')
        patchData.deliveryAvailable = hasDelivery
        if (hasCourier && !patchData.deliveryFee) {
          const fees = await getCourierFees(c.prisma)
          patchData.deliveryFee = fees.forwardFee
        }
      }

      const p = await new UpdateProductUseCase({ productRepo: c.repos.product, vendorRepo: c.repos.vendor, cache: c.cache })
        .execute(asId<ProductId>(req.params['id']!), asId<UserId>(req.user!.userId), patchData as any)
      res.json({ success: true, data: p })
    } catch (err) { next(err) }
  }
)

productRouter.delete(
  '/:id',
  authenticate, authorize('VENDOR', 'ADMIN'),
  validateParams(IdSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const c = getContainer()
      await new DeleteProductUseCase({ productRepo: c.repos.product, vendorRepo: c.repos.vendor, rentalRepo: c.repos.rental, cache: c.cache })
        .execute(asId<ProductId>(req.params['id']!), asId<UserId>(req.user!.userId), req.user!.role as 'VENDOR' | 'ADMIN')
      res.status(204).send()
    } catch (err) { next(err) }
  }
)
