import { Router }              from 'express'
import { z }                   from 'zod'
import { getContainer }        from '@/infrastructure/container/container.js'
import { validateBody, validateParams, validateQuery } from '@/interface/http/middleware/validate.middleware.js'
import { authenticate, authorize }      from '@/interface/http/middleware/authenticate.middleware.js'
import { ApplyVendorUseCase }  from '@/application/use-cases/vendor/apply-vendor.use-case.js'
import type { Request, Response, NextFunction } from 'express'
import { asId } from '@lendora/shared'
import type { UserId, VendorId } from '@lendora/shared'
import { prisma }              from '@/infrastructure/database/prisma.client.js'

const ApplySchema = z.object({
  businessName:        z.string().min(2).max(200),
  businessDescription: z.string().min(20).max(2000).optional(),
  businessAddress:     z.string().optional(),
  district:            z.string().min(2),
  division:            z.string().min(2),
  bkashNumber:         z.string().regex(/^\+880\d{10}$/).optional(),
  nagadNumber:         z.string().regex(/^\+880\d{10}$/).optional(),
  bankAccountName:     z.string().optional(),
  bankAccountNumber:   z.string().optional(),
  bankName:            z.string().optional(),
})

const IdSchema = z.object({ id: z.string().min(1) })

export const vendorRouter = Router()

const ListQuerySchema = z.object({
  page:  z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
})

/* GET /vendors — paginated list of all active vendors */
vendorRouter.get('/', validateQuery(ListQuerySchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = req.query as { page: string; limit: string }
    const p = parseInt(page ?? '1')
    const l = parseInt(limit ?? '20')

    const [rows, total] = await prisma.$transaction([
      prisma.vendorProfile.findMany({
        where:   { status: 'ACTIVE' },
        orderBy: [{ averageRating: 'desc' }, { totalRentals: 'desc' }],
        skip:    (p - 1) * l,
        take:    l,
        include: {
          user:     { select: { name: true, avatarUrl: true } },
          products: {
            where:   { status: 'ACTIVE' },
            take:    3,
            orderBy: { totalRentals: 'desc' },
            select:  { name: true },
          },
          _count: { select: { products: { where: { status: 'ACTIVE' } } } },
        },
      }),
      prisma.vendorProfile.count({ where: { status: 'ACTIVE' } }),
    ])

    res.json({
      success: true,
      data: {
        total, page: p, limit: l,
        items: rows.map((v) => ({
          id:                  v.id,
          businessName:        v.businessName,
          businessDescription: v.businessDescription,
          district:            v.district,
          division:            v.division,
          averageRating:       v.averageRating,
          totalRentals:        v.totalRentals,
          responseTimeMinutes: v.responseTimeMinutes,
          verifiedAt:          v.verifiedAt,
          userName:            v.user.name,
          avatarUrl:           v.user.avatarUrl,
          productCount:        v._count.products,
          topProducts:         v.products.map((p) => p.name),
        })),
      },
    })
  } catch (err) { next(err) }
})

/* GET /vendors/top — top 10 vendors enriched with product data */
vendorRouter.get('/top', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const rows = await prisma.vendorProfile.findMany({
      where:   { status: 'ACTIVE' },
      orderBy: [{ averageRating: 'desc' }, { totalRentals: 'desc' }],
      take:    10,
      include: {
        user:     { select: { name: true, avatarUrl: true } },
        products: {
          where:   { status: 'ACTIVE' },
          take:    3,
          orderBy: { totalRentals: 'desc' },
          select:  { name: true },
        },
        _count: { select: { products: { where: { status: 'ACTIVE' } } } },
      },
    })

    res.json({
      success: true,
      data: rows.map((v) => ({
        id:                  v.id,
        businessName:        v.businessName,
        businessDescription: v.businessDescription,
        district:            v.district,
        division:            v.division,
        averageRating:       v.averageRating,
        totalRentals:        v.totalRentals,
        responseTimeMinutes: v.responseTimeMinutes,
        verifiedAt:          v.verifiedAt,
        userName:            v.user.name,
        avatarUrl:           v.user.avatarUrl,
        productCount:        v._count.products,
        topProducts:         v.products.map((p) => p.name),
      })),
    })
  } catch (err) { next(err) }
})

vendorRouter.get('/me/dashboard', authenticate, authorize('VENDOR'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c      = getContainer()
    const vendor = await c.repos.vendor.findByUserId(asId<UserId>(req.user!.userId))
    if (!vendor) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Vendor profile not found' } }); return }

    const until = new Date()
    const from  = new Date(until.getFullYear(), until.getMonth(), 1)

    const [analytics, products, pendingRentals, confirmedRentals] = await Promise.all([
      c.repos.rental.getVendorAnalytics(vendor.id, from, until),
      c.repos.product.findByVendorId(vendor.id, 1, 5),
      c.repos.rental.findSummaries({ vendorId: vendor.id, status: 'PENDING_CONFIRMATION' as any, page: 1, limit: 10 }),
      c.prisma.rental.findMany({
        where:  { vendorId: vendor.id, confirmedAt: { not: null } },
        select: { createdAt: true, confirmedAt: true },
        orderBy: { confirmedAt: 'desc' },
        take: 50,
      }),
    ])

    let responseTimeMinutes: number | null = null
    if (confirmedRentals.length > 0) {
      const totalMinutes = confirmedRentals.reduce((sum, r) => {
        const diffMs = r.confirmedAt!.getTime() - r.createdAt.getTime()
        return sum + diffMs / 60000
      }, 0)
      responseTimeMinutes = Math.round(totalMinutes / confirmedRentals.length)
    }

    const vendorWithResponseTime = { ...vendor, responseTimeMinutes }
    res.json({ success: true, data: { vendor: vendorWithResponseTime, analytics, products, pendingRentals } })
  } catch (err) { next(err) }
})

const MyProductsQuerySchema = z.object({
  status: z.enum(['PENDING_REVIEW', 'ACTIVE', 'REJECTED']).optional(),
  page:   z.coerce.number().int().positive().default(1),
  limit:  z.coerce.number().int().positive().max(50).default(20),
})

vendorRouter.get('/me/products', authenticate, authorize('VENDOR'), validateQuery(MyProductsQuerySchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c      = getContainer()
    const vendor = await c.repos.vendor.findByUserId(asId<UserId>(req.user!.userId))
    if (!vendor) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Vendor profile not found' } }); return }
    const { page, limit, status } = (req as any).validatedQuery as { page: number; limit: number; status?: string }
    const result = await c.repos.product.findByVendorId(vendor.id, page, limit, status as any)
    res.json({ success: true, data: result })
  } catch (err) { next(err) }
})

vendorRouter.get('/:id', validateParams(IdSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c = getContainer()
    const v = await c.repos.vendor.findById(asId<VendorId>(req.params['id']!))
    if (!v) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Vendor not found' } }); return }
    const user = await c.prisma.user.findUnique({
      where:  { id: v.userId as any },
      select: { name: true, avatarUrl: true },
    })
    res.json({
      success: true,
      data: {
        id:                  v.id,
        businessName:        v.businessName,
        businessDescription: v.businessDescription,
        businessAddress:     v.businessAddress,
        district:            v.district,
        division:            v.division,
        averageRating:       v.averageRating,
        totalRentals:        v.totalRentals,
        responseTimeMinutes: v.responseTimeMinutes,
        verifiedAt:          v.verifiedAt,
        status:              v.status,
        userName:            user?.name ?? '',
        avatarUrl:           user?.avatarUrl ?? null,
      },
    })
  } catch (err) { next(err) }
})

vendorRouter.get('/:id/products', validateParams(IdSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c = getContainer()
    res.json({ success: true, data: await c.repos.product.findByVendorId(asId<VendorId>(req.params['id']!), 1, 50, 'ACTIVE') })
  } catch (err) { next(err) }
})

const UpdateProfileSchema = z.object({
  businessName:        z.string().min(2).max(200).optional(),
  businessDescription: z.string().max(2000).optional(),
  businessAddress:     z.string().max(300).optional(),
  district:            z.string().min(2).optional(),
  division:            z.string().min(2).optional(),
  bkashNumber:         z.string().regex(/^\+880\d{10}$/).optional().or(z.literal('')),
  nagadNumber:         z.string().regex(/^\+880\d{10}$/).optional().or(z.literal('')),
  bankAccountName:     z.string().max(200).optional(),
  bankAccountNumber:   z.string().max(50).optional(),
  bankName:            z.string().max(100).optional(),
})

vendorRouter.patch('/me', authenticate, authorize('VENDOR'), validateBody(UpdateProfileSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c      = getContainer()
    const vendor = await c.repos.vendor.findByUserId(asId<UserId>(req.user!.userId))
    if (!vendor) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Vendor profile not found' } }); return }
    const body = req.body as z.infer<typeof UpdateProfileSchema>
    const updated = await prisma.vendorProfile.update({
      where: { id: vendor.id },
      data: {
        ...(body.businessName        !== undefined && { businessName:        body.businessName }),
        ...(body.businessDescription !== undefined && { businessDescription: body.businessDescription || null }),
        ...(body.businessAddress     !== undefined && { businessAddress:     body.businessAddress     || null }),
        ...(body.district            !== undefined && { district:            body.district }),
        ...(body.division            !== undefined && { division:            body.division }),
        ...(body.bkashNumber         !== undefined && { bkashNumber:         body.bkashNumber         || null }),
        ...(body.nagadNumber         !== undefined && { nagadNumber:         body.nagadNumber         || null }),
        ...(body.bankAccountName     !== undefined && { bankAccountName:     body.bankAccountName     || null }),
        ...(body.bankAccountNumber   !== undefined && { bankAccountNumber:   body.bankAccountNumber   || null }),
        ...(body.bankName            !== undefined && { bankName:            body.bankName             || null }),
      },
    })
    res.json({ success: true, data: updated })
  } catch (err) { next(err) }
})

vendorRouter.post('/apply', authenticate, validateBody(ApplySchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c = getContainer()
    const p = await new ApplyVendorUseCase({ userRepo: c.repos.user, vendorRepo: c.repos.vendor })
      .execute(asId<UserId>(req.user!.userId), req.body)
    res.status(201).json({ success: true, data: p })
  } catch (err) { next(err) }
})
