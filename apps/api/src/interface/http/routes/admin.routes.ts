import { Router }              from 'express'
import { z }                   from 'zod'
import { getContainer }        from '@/infrastructure/container/container.js'
import { validateBody, validateQuery, validateParams } from '@/interface/http/middleware/validate.middleware.js'
import { authenticate, authorize }      from '@/interface/http/middleware/authenticate.middleware.js'
import type { Request, Response, NextFunction } from 'express'
import { UserStatus, UserRole, asId } from '@lendora/shared'
import type { VendorId, UserId, DisputeId } from '@lendora/shared'
import { checkAllOverdueRentals } from '@/utils/late-fee.js'
import { notify } from '@/utils/notify.js'
import { getCourierFees, COURIER_FWD_KEY, COURIER_RET_KEY, COURIER_DEFAULT_FWD, COURIER_DEFAULT_RET } from '@/utils/courier.js'
import { DEMO_MODE_KEY } from '@/utils/demo-mode.js'

const IdSchema      = z.object({ id: z.string().min(1) })
const SuspendSchema = z.object({ reason: z.string().min(10).max(500) })
const RejectSchema  = z.object({ reason: z.string().max(500).optional() })
const ResolveSchema = z.object({
  resolution:       z.string().min(10).max(2000),
  depositDeduction: z.number().nonnegative().nullable(),
  note:             z.string().min(5).max(1000),
})
const ResolveDamageClaimSchema = z.object({
  lateDeduction:   z.coerce.number().min(0).default(0),
  damageDeduction: z.coerce.number().min(0).default(0),
})
const ListSchema = z.object({
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

const AdminRentalListSchema = z.object({
  status: z.string().optional(),
  search: z.string().optional(),
  page:   z.coerce.number().int().min(1).default(1),
  limit:  z.coerce.number().int().min(1).max(100).default(20),
})

export const adminRouter = Router()
adminRouter.use(authenticate, authorize('ADMIN', 'SUPER_ADMIN'))

// ── Vendors ───────────────────────────────────────────────────────────────────

adminRouter.get('/vendors/pending', validateQuery(ListSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c     = getContainer()
    const query = (req as any).validatedQuery as z.infer<typeof ListSchema>
    const skip  = (query.page - 1) * query.limit

    type PendingRow = {
      id: string; userId: string; businessName: string; businessDescription: string | null
      businessAddress: string | null; district: string; division: string
      bkashNumber: string | null; nidNumber: string | null
      nidFrontImageUrl: string | null; nidBackImageUrl: string | null
      status: string; createdAt: Date
      userName: string; userEmail: string; userPhone: string | null
      userAvatarUrl: string | null; userAddress: string | null
    }

    const [rows, countResult] = await Promise.all([
      c.prisma.$queryRaw<PendingRow[]>`
        SELECT
          vp.id, vp.userId, vp.businessName, vp.businessDescription,
          vp.businessAddress, vp.district, vp.division,
          vp.bkashNumber, vp.nidNumber, vp.nidFrontImageUrl, vp.nidBackImageUrl,
          vp.status, vp.createdAt,
          u.name AS userName, u.email AS userEmail, u.phone AS userPhone,
          u.avatarUrl AS userAvatarUrl, u.address AS userAddress
        FROM vendor_profiles vp
        INNER JOIN users u ON u.id = vp.userId
        WHERE vp.status = 'PENDING_VERIFICATION'
        ORDER BY vp.createdAt DESC
        LIMIT ${query.limit} OFFSET ${skip}
      `,
      c.prisma.$queryRaw<[{ total: bigint }]>`
        SELECT COUNT(*) AS total
        FROM vendor_profiles vp
        INNER JOIN users u ON u.id = vp.userId
        WHERE vp.status = 'PENDING_VERIFICATION'
      `,
    ])

    res.json({ success: true, data: { items: rows, total: Number(countResult[0]!.total) } })
  } catch (err) { next(err) }
})

adminRouter.get('/vendors/all', validateQuery(ListSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c     = getContainer()
    const query = (req as any).validatedQuery as z.infer<typeof ListSchema>
    res.json({ success: true, data: await c.repos.vendor.findMany({ ...query }) })
  } catch (err) { next(err) }
})

adminRouter.get('/vendors/active', validateQuery(ListSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c     = getContainer()
    const query = (req as any).validatedQuery as z.infer<typeof ListSchema>
    const skip  = (query.page - 1) * query.limit
    const [rows, total] = await Promise.all([
      c.prisma.vendorProfile.findMany({
        where:   { status: 'ACTIVE' },
        include: { user: true },
        orderBy: { createdAt: 'desc' },
        skip, take: query.limit,
      }),
      c.prisma.vendorProfile.count({ where: { status: 'ACTIVE' } }),
    ])
    res.json({ success: true, data: { items: rows.map((r) => ({
      id: r.id, userId: r.userId,
      businessName: r.businessName, district: r.district, division: r.division,
      status: r.status, averageRating: r.averageRating, totalRentals: r.totalRentals,
      totalEarnings: Number(r.totalEarnings), createdAt: r.createdAt,
      userName: r.user.name, userEmail: r.user.email,
    })), total } })
  } catch (err) { next(err) }
})

adminRouter.get('/vendors/suspended', validateQuery(ListSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c     = getContainer()
    const query = (req as any).validatedQuery as z.infer<typeof ListSchema>
    const skip  = (query.page - 1) * query.limit
    const [rows, total] = await Promise.all([
      c.prisma.vendorProfile.findMany({
        where:   { status: { in: ['SUSPENDED', 'BANNED'] } },
        include: { user: true },
        orderBy: { createdAt: 'desc' },
        skip, take: query.limit,
      }),
      c.prisma.vendorProfile.count({ where: { status: { in: ['SUSPENDED', 'BANNED'] } } }),
    ])
    res.json({ success: true, data: { items: rows.map((r) => ({
      id: r.id, userId: r.userId,
      businessName: r.businessName, district: r.district, division: r.division,
      status: r.status, suspensionReason: r.suspensionReason, createdAt: r.createdAt,
      userName: r.user.name, userEmail: r.user.email,
    })), total } })
  } catch (err) { next(err) }
})

adminRouter.get('/vendors/:id', validateParams(IdSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c      = getContainer()
    const vendor = await c.prisma.vendorProfile.findUnique({
      where:   { id: req.params['id']! },
      include: { user: true },
    })
    if (!vendor) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Vendor not found' } }); return }
    res.json({ success: true, data: {
      id:                  vendor.id,
      userId:              vendor.userId,
      businessName:        vendor.businessName,
      businessDescription: vendor.businessDescription,
      businessAddress:     vendor.businessAddress,
      district:            vendor.district,
      division:            vendor.division,
      bkashNumber:         vendor.bkashNumber,
      nidNumber:           vendor.nidNumber,
      nidFrontImageUrl:    vendor.nidFrontImageUrl,
      nidBackImageUrl:     vendor.nidBackImageUrl,
      status:              vendor.status,
      suspensionReason:    vendor.suspensionReason,
      verifiedAt:          vendor.verifiedAt,
      totalRentals:        vendor.totalRentals,
      totalEarnings:       Number(vendor.totalEarnings),
      averageRating:       vendor.averageRating,
      createdAt:           vendor.createdAt,
      userName:            vendor.user.name,
      userEmail:           vendor.user.email,
      userPhone:           vendor.user.phone,
      userAddress:         vendor.user.address,
      userAvatarUrl:       vendor.user.avatarUrl,
    } })
  } catch (err) { next(err) }
})

adminRouter.post('/vendors/:id/approve', validateParams(IdSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c = getContainer()
    const result = await c.repos.vendor.approve(asId<VendorId>(req.params['id']!), asId<UserId>(req.user!.userId))
    // Notify vendor their account was approved
    const vp = await c.prisma.vendorProfile.findUnique({ where: { id: req.params['id']! }, select: { userId: true } })
    if (vp) await notify(c.prisma, vp.userId, 'VENDOR_APPROVED', 'Vendor Account Approved!', 'Congratulations! Your vendor account has been approved. You can now start listing products.', { vendorId: req.params['id']! })
    res.json({ success: true, data: result })
  } catch (err) { next(err) }
})

adminRouter.post('/vendors/:id/reject', validateParams(IdSchema), validateBody(RejectSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c = getContainer()
    const vpRej = await c.prisma.vendorProfile.findUnique({ where: { id: req.params['id']! }, select: { userId: true } })
    await c.prisma.vendorProfile.update({
      where: { id: req.params['id']! },
      data:  { status: 'SUSPENDED', suspensionReason: req.body.reason ?? null, suspendedAt: new Date() },
    })
    if (vpRej) await notify(c.prisma, vpRej.userId, 'VENDOR_SUSPENDED', 'Vendor Application Rejected', 'Unfortunately your vendor application was not approved. Please contact support for more details.', { vendorId: req.params['id']! })
    res.json({ success: true, data: null })
  } catch (err) { next(err) }
})

adminRouter.post('/vendors/:id/suspend', validateParams(IdSchema), validateBody(SuspendSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c = getContainer()
    res.json({ success: true, data: await c.repos.vendor.suspend(asId<VendorId>(req.params['id']!), req.body.reason) })
  } catch (err) { next(err) }
})

adminRouter.delete('/vendors/:id', validateParams(IdSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c      = getContainer()
    const vendor = await c.repos.vendor.findById(asId<VendorId>(req.params['id']!))
    if (!vendor) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Vendor not found' } }); return }
    await c.repos.user.delete(asId<UserId>(vendor.userId))
    res.json({ success: true, data: null })
  } catch (err) { next(err) }
})

// ── Customers ─────────────────────────────────────────────────────────────────

function mapCustomerRow(u: any) {
  return {
    id:               u.id,
    name:             u.name,
    email:            u.email,
    phone:            u.phone            ?? null,
    address:          u.address          ?? null,
    avatarUrl:        u.avatarUrl        ?? null,
    nidNumber:        u.nidNumber        ?? null,
    nidFrontImageUrl: u.nidFrontImageUrl ?? null,
    nidBackImageUrl:  u.nidBackImageUrl  ?? null,
    bkashNumber:      u.bkashNumber      ?? null,
    status:           u.status,
    createdAt:        u.createdAt,
  }
}

async function customerListHandler(
  status: string,
  req: Request, res: Response, next: NextFunction,
) {
  try {
    const c     = getContainer()
    const query = (req as any).validatedQuery as z.infer<typeof ListSchema>
    const skip  = (query.page - 1) * query.limit
    const where = { status, role: 'CUSTOMER' } as const

    const [rows, total] = await Promise.all([
      c.prisma.user.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: query.limit }),
      c.prisma.user.count({ where }),
    ])
    res.json({ success: true, data: { items: rows.map(mapCustomerRow), total } })
  } catch (err) { next(err) }
}

adminRouter.get('/customers/pending',  validateQuery(ListSchema), (req, res, next) => customerListHandler('PENDING_VERIFICATION', req, res, next))
adminRouter.get('/customers/approved', validateQuery(ListSchema), (req, res, next) => customerListHandler('ACTIVE',               req, res, next))
adminRouter.get('/customers/declined', validateQuery(ListSchema), (req, res, next) => customerListHandler('SUSPENDED',            req, res, next))

adminRouter.get('/customers/:id', validateParams(IdSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c    = getContainer()
    const user = await c.prisma.user.findUnique({ where: { id: req.params['id']! } })
    if (!user) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Customer not found' } }); return }
    res.json({
      success: true,
      data: {
        id:               user.id,
        name:             user.name,
        email:            user.email,
        phone:            user.phone,
        address:          user.address,
        avatarUrl:        user.avatarUrl,
        nidNumber:        user.nidNumber,
        nidFrontImageUrl: user.nidFrontImageUrl,
        nidBackImageUrl:  user.nidBackImageUrl,
        bkashNumber:      user.bkashNumber,
        status:           user.status,
        role:             user.role,
        createdAt:        user.createdAt,
        emailVerifiedAt:  user.emailVerifiedAt,
        lastLoginAt:      user.lastLoginAt,
      },
    })
  } catch (err) { next(err) }
})

adminRouter.post('/customers/:id/approve', validateParams(IdSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c = getContainer()
    await c.repos.user.update(asId<UserId>(req.params['id']!), { status: UserStatus.ACTIVE })
    res.json({ success: true, data: null })
  } catch (err) { next(err) }
})

adminRouter.post('/customers/:id/reject', validateParams(IdSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c = getContainer()
    await c.repos.user.update(asId<UserId>(req.params['id']!), { status: UserStatus.SUSPENDED })
    res.json({ success: true, data: null })
  } catch (err) { next(err) }
})

adminRouter.delete('/customers/:id', validateParams(IdSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c = getContainer()
    await c.repos.user.delete(asId<UserId>(req.params['id']!))
    res.json({ success: true, data: null })
  } catch (err) { next(err) }
})

// ── Disputes ──────────────────────────────────────────────────────────────────

adminRouter.get('/disputes', validateQuery(ListSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c     = getContainer()
    const query = (req as any).validatedQuery as z.infer<typeof ListSchema>
    res.json({ success: true, data: await c.repos.dispute.findMany(query) })
  } catch (err) { next(err) }
})

adminRouter.post('/disputes/:id/resolve', validateParams(IdSchema), validateBody(ResolveSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c = getContainer()
    const d = await c.repos.dispute.resolve(asId<DisputeId>(req.params['id']!), { ...req.body, resolvedById: asId<UserId>(req.user!.userId) })
    res.json({ success: true, data: d })
  } catch (err) { next(err) }
})

// ── Stats ─────────────────────────────────────────────────────────────────────

adminRouter.get('/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const c = getContainer()

    // Recompute overdue status + late fees (best-effort, don't block stats on failure)
    checkAllOverdueRentals(c.prisma).catch(() => {})

    const safe = async <T>(fn: () => Promise<T>, fallback: T): Promise<T> => {
      try { return await fn() } catch { return fallback }
    }

    const [
      totalUsers, totalVendors, activeCustomers, totalProducts, openDisputes,
      pendingVendors, pendingCustomers, pendingProducts,
      totalRentals, activeRentals, pendingRentals, commissionAgg,
    ] = await Promise.all([
      safe(() => c.prisma.user.count(), 0),
      safe(() => c.prisma.vendorProfile.count({ where: { status: 'ACTIVE' as any } }), 0),
      safe(() => c.prisma.user.count({ where: { role: 'CUSTOMER' as any, status: 'ACTIVE' as any } }), 0),
      safe(() => c.prisma.product.count({ where: { status: 'ACTIVE' as any, deletedAt: null } }), 0),
      safe(() => c.prisma.dispute.count({ where: { status: 'OPEN' as any } }), 0),
      safe(() => c.prisma.vendorProfile.count({ where: { status: 'PENDING_VERIFICATION' as any } }), 0),
      safe(() => c.prisma.user.count({ where: { role: 'CUSTOMER' as any, status: 'PENDING_VERIFICATION' as any } }), 0),
      safe(() => c.prisma.product.count({ where: { status: 'PENDING_REVIEW' as any, deletedAt: null } }), 0),
      safe(() => c.prisma.rental.count(), 0),
      safe(() => c.prisma.rental.count({ where: { status: 'ACTIVE' as any } }), 0),
      safe(() => c.prisma.rental.count({ where: { status: 'PENDING_CONFIRMATION' as any } }), 0),
      safe(() => c.prisma.rental.aggregate({ where: { status: 'COMPLETED' as any }, _sum: { platformFee: true } }), { _sum: { platformFee: null } }),
    ])

    res.json({
      success: true,
      data: {
        totalUsers,
        totalVendors,
        activeCustomers,
        totalProducts,
        openDisputes,
        pendingVendors,
        pendingCustomers,
        pendingProducts,
        totalRentals,
        activeRentals,
        pendingRentals,
        totalCommission: Number((commissionAgg as any)._sum?.platformFee ?? 0),
      },
    })
  } catch (err) { next(err) }
})

// ── Courier Settings ──────────────────────────────────────────────────────────

adminRouter.get('/settings/courier', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const c = getContainer()
    res.json({ success: true, data: await getCourierFees(c.prisma) })
  } catch (err) { next(err) }
})

adminRouter.put('/settings/courier', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { forwardFee, returnFee } = req.body as { forwardFee: number; returnFee: number }
    const c = getContainer()
    await Promise.all([
      c.prisma.systemSetting.upsert({ where: { key: COURIER_FWD_KEY }, update: { value: String(forwardFee) }, create: { key: COURIER_FWD_KEY, value: String(forwardFee) } }),
      c.prisma.systemSetting.upsert({ where: { key: COURIER_RET_KEY }, update: { value: String(returnFee)  }, create: { key: COURIER_RET_KEY,  value: String(returnFee)  } }),
    ])
    res.json({ success: true, data: { forwardFee, returnFee } })
  } catch (err) { next(err) }
})

// ── Categories ────────────────────────────────────────────────────────────────

const CategoryBodySchema = z.object({
  name:        z.string().min(1).max(60),
  emoji:       z.string().min(1).max(10),
  description: z.string().max(500).optional(),
  sortOrder:   z.coerce.number().int().default(0),
})

adminRouter.get('/categories', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const c    = getContainer()
    const rows = await c.prisma.category.findMany({
      where:   { parentId: null },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count:   { select: { products: { where: { status: 'ACTIVE' as any, deletedAt: null } } } },
        children: {
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          include: { _count: { select: { products: { where: { status: 'ACTIVE' as any, deletedAt: null } } } } },
        },
      },
    })
    res.json({
      success: true,
      data: rows.map((r) => ({
        id:           r.id,
        name:         r.name,
        slug:         r.slug,
        emoji:        r.emoji,
        description:  r.description,
        isActive:     r.isActive,
        sortOrder:    r.sortOrder,
        listingCount: r._count.products + r.children.reduce((sum, ch) => sum + ch._count.products, 0),
        createdAt:    r.createdAt,
        children:     [],
      })),
    })
  } catch (err) { next(err) }
})

adminRouter.post('/categories', validateBody(CategoryBodySchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c    = getContainer()
    const body = req.body as z.infer<typeof CategoryBodySchema>
    const slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const row  = await c.prisma.category.create({
      data: { name: body.name, slug, emoji: body.emoji, description: body.description, sortOrder: body.sortOrder, isActive: true },
    })
    res.status(201).json({ success: true, data: { id: row.id, name: row.name, slug: row.slug, emoji: row.emoji, isActive: row.isActive, sortOrder: row.sortOrder, listingCount: 0, createdAt: row.createdAt } })
  } catch (err) { next(err) }
})

adminRouter.patch('/categories/:id', validateParams(IdSchema), validateBody(CategoryBodySchema.partial()), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c    = getContainer()
    const body = req.body as Partial<z.infer<typeof CategoryBodySchema>>
    await c.prisma.category.update({
      where: { id: req.params['id']! },
      data:  {
        ...(body.name  !== undefined && { name: body.name, slug: body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }),
        ...(body.emoji !== undefined && { emoji: body.emoji }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.sortOrder   !== undefined && { sortOrder: body.sortOrder }),
      },
    })
    res.json({ success: true, data: null })
  } catch (err) { next(err) }
})

adminRouter.post('/categories/:id/toggle', validateParams(IdSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c   = getContainer()
    const cat = await c.prisma.category.findUnique({ where: { id: req.params['id']! } })
    if (!cat) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Category not found' } }); return }
    await c.prisma.category.update({ where: { id: req.params['id']! }, data: { isActive: !cat.isActive } })
    res.json({ success: true, data: { isActive: !cat.isActive } })
  } catch (err) { next(err) }
})

adminRouter.delete('/categories/:id', validateParams(IdSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c = getContainer()
    await c.prisma.category.delete({ where: { id: req.params['id']! } })
    res.json({ success: true, data: null })
  } catch (err) { next(err) }
})

// ── Product Approval ──────────────────────────────────────────────────────────

const ProductListSchema = z.object({
  status: z.enum(['PENDING_REVIEW', 'ACTIVE', 'REJECTED', 'INACTIVE']).optional(),
  search: z.string().optional(),
  page:   z.coerce.number().int().min(1).default(1),
  limit:  z.coerce.number().int().min(1).max(100).default(20),
})

adminRouter.get('/products', validateQuery(ProductListSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c     = getContainer()
    const query = (req as any).validatedQuery as z.infer<typeof ProductListSchema>
    const skip  = (query.page - 1) * query.limit
    const where: any = { deletedAt: null }
    if (query.status) {
      where.status = query.status
    } else {
      where.status = { in: ['PENDING_REVIEW', 'ACTIVE', 'REJECTED'] }
    }
    if (query.search) {
      where.OR = [
        { name:   { contains: query.search } },
        { vendor: { businessName: { contains: query.search } } },
      ]
    }

    const [rows, total] = await Promise.all([
      c.prisma.product.findMany({
        where,
        include: {
          vendor:   { select: { id: true, businessName: true, user: { select: { email: true } } } },
          category: { select: { name: true } },
          media:    { orderBy: { sortOrder: 'asc' }, take: 1 },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
      }),
      c.prisma.product.count({ where }),
    ])

    const items = rows.map((p) => ({
      id:           p.id,
      name:         p.name,
      slug:         p.slug,
      status:       p.status,
      condition:    p.condition,
      pricePerDay:  Number(p.pricePerDay),
      district:     p.district,
      division:     p.division,
      vendorId:     p.vendorId,
      vendorName:   p.vendor.businessName,
      vendorEmail:  p.vendor.user.email,
      categoryName: p.category.name,
      imageUrl:     p.media[0]?.url ?? null,
      createdAt:    p.createdAt,
    }))

    res.json({ success: true, data: { items, total } })
  } catch (err) { next(err) }
})

adminRouter.post('/products/:id/approve', validateParams(IdSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c       = getContainer()
    const product = await c.prisma.product.findUnique({ where: { id: req.params['id']! }, include: { vendor: { select: { userId: true } } } })
    if (!product) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } }); return }
    await c.prisma.product.update({ where: { id: req.params['id']! }, data: { status: 'ACTIVE' as any } })
    await notify(c.prisma, product.vendor.userId, 'VENDOR_APPROVED', 'Product Approved!', `Your product "${product.name}" has been approved and is now live on the marketplace.`, { productId: product.id })
    res.json({ success: true, data: null })
  } catch (err) { next(err) }
})

adminRouter.post('/products/:id/reject', validateParams(IdSchema), validateBody(RejectSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c       = getContainer()
    const product = await c.prisma.product.findUnique({ where: { id: req.params['id']! }, include: { vendor: { select: { userId: true } } } })
    if (!product) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } }); return }
    await c.prisma.product.update({ where: { id: req.params['id']! }, data: { status: 'REJECTED' as any } })
    await notify(c.prisma, product.vendor.userId, 'VENDOR_SUSPENDED', 'Product Rejected', `Your product "${product.name}" was not approved. Please review our listing guidelines and resubmit.`, { productId: product.id })
    res.json({ success: true, data: null })
  } catch (err) { next(err) }
})

// ── Rentals ───────────────────────────────────────────────────────────────────

adminRouter.get('/rentals', validateQuery(AdminRentalListSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c     = getContainer()
    const query = (req as any).validatedQuery as z.infer<typeof AdminRentalListSchema>
    const skip  = (query.page - 1) * query.limit

    // Recompute overdue status + late fees before listing
    await checkAllOverdueRentals(c.prisma)

    const where: any = {}
    if (query.status) {
      const parts = query.status.split(',').map((s) => s.trim()).filter(Boolean)
      where.status = parts.length > 1 ? { in: parts } : parts[0]
    }
    if (query.search) {
      const q = query.search
      where.OR = [
        { renter:  { name:         { contains: q } } },
        { vendor:  { businessName: { contains: q } } },
        { product: { name:         { contains: q } } },
      ]
    }

    const [rows, total] = await Promise.all([
      c.prisma.rental.findMany({
        where,
        include: {
          renter:  { select: { name: true, email: true } },
          vendor:  { select: { businessName: true } },
          product: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
      }),
      c.prisma.rental.count({ where }),
    ])

    const items = rows.map((r) => ({
      id:               r.id,
      renterName:       r.renter.name,
      renterEmail:      r.renter.email,
      vendorName:       r.vendor.businessName,
      productName:      r.product.name,
      status:           r.status,
      startDate:        r.startDate,
      endDate:          r.endDate,
      totalDays:        r.totalDays,
      pricePerDay:      Number(r.pricePerDay),
      rentalFee:        Number(r.rentalFee),
      platformFee:      Number(r.platformFee),
      depositAmount:    Number(r.depositAmount),
      depositStatus:    r.depositStatus,
      totalAmount:      Number(r.totalAmount),
      lateDays:         r.lateDays,
      lateFeeAmount:    Number(r.lateFeeAmount),
      depositRemaining: Number(r.depositAmount) - Number(r.lateFeeAmount),
      createdAt:        r.createdAt,
    }))

    res.json({ success: true, data: { items, total } })
  } catch (err) { next(err) }
})

// PATCH /admin/rentals/:id/late-fee — admin manually overrides the accrued late fee
const AdjustLateFeeSchema = z.object({
  lateFeeAmount: z.coerce.number().min(0),
  note:          z.string().max(300).optional(),
})

adminRouter.patch('/rentals/:id/late-fee', validateParams(IdSchema), validateBody(AdjustLateFeeSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c      = getContainer()
    const rental = await c.prisma.rental.findUnique({ where: { id: req.params['id']! } })
    if (!rental) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Rental not found' } }); return }

    const depositAmount = Number(rental.depositAmount)
    const previousFee   = Number(rental.lateFeeAmount)
    const newFee         = Math.min(req.body.lateFeeAmount, depositAmount)
    const delta           = newFee - previousFee

    await c.prisma.rental.update({ where: { id: rental.id }, data: { lateFeeAmount: newFee } })

    await c.prisma.lateFeeTransaction.create({
      data: {
        rentalId:         rental.id,
        lateDays:         rental.lateDays,
        dailyRate:        Number(rental.pricePerDay),
        amount:           delta,
        totalLateFee:     newFee,
        depositRemaining: depositAmount - newFee,
      },
    })

    // Adjust the vendor's wallet by the same delta (positive = credit more, negative = claw back)
    if (delta !== 0) {
      await c.prisma.vendorProfile.update({
        where: { id: rental.vendorId },
        data:  { totalEarnings: { increment: delta } },
      })
    }

    await notify(
      c.prisma, rental.renterId, 'LATE_FEE_WARNING',
      'Late Fee Adjusted',
      `An admin has adjusted your late fee to ৳${newFee}.${req.body.note ? ` Note: ${req.body.note}` : ''}`,
      { rentalId: rental.id, lateFeeAmount: newFee },
    )

    res.json({ success: true, data: { lateFeeAmount: newFee, depositRemaining: depositAmount - newFee } })
  } catch (err) { next(err) }
})

// ── Payments ──────────────────────────────────────────────────────────────────

adminRouter.get('/payments', validateQuery(ListSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c     = getContainer()
    const query = (req as any).validatedQuery as z.infer<typeof ListSchema>
    const skip  = (query.page - 1) * query.limit

    const [rows, total] = await Promise.all([
      c.prisma.payment.findMany({
        include: {
          payer:  { select: { name: true } },
          rental: { include: { vendor: { select: { businessName: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
      }),
      c.prisma.payment.count(),
    ])

    const items = rows.map((p) => ({
      id:        p.id,
      rentalId:  p.rentalId,
      payerName: p.payer.name,
      vendorName: p.rental.vendor.businessName,
      type:      p.type,
      amount:    Number(p.amount),
      method:    p.method,
      status:    p.status,
      reference: p.externalReference,
      createdAt: p.createdAt,
    }))

    res.json({ success: true, data: { items, total } })
  } catch (err) { next(err) }
})

// ── Returns ───────────────────────────────────────────────────────────────────

adminRouter.get('/returns', validateQuery(ListSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c     = getContainer()
    const query = (req as any).validatedQuery as z.infer<typeof ListSchema>
    const skip  = (query.page - 1) * query.limit

    const [rows, total] = await Promise.all([
      c.prisma.returnRecord.findMany({
        include: {
          rental: {
            include: {
              renter:  { select: { name: true } },
              vendor:  { select: { businessName: true } },
              product: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
      }),
      c.prisma.returnRecord.count(),
    ])

    const items = rows.map((r) => ({
      id:                r.id,
      rentalId:          r.rentalId,
      renterName:        r.rental.renter.name,
      vendorName:        r.rental.vendor.businessName,
      productName:       r.rental.product.name,
      condition:         r.condition,
      damageDescription: r.damageDescription,
      damageAmount:      Number(r.damageAmount ?? 0),
      depositDeduction:  Number(r.depositDeduction),
      depositRefund:     Number(r.depositRefund),
      depositPaid:       Number(r.rental.depositAmount),
      depositStatus:     r.rental.depositStatus,
      createdAt:         r.createdAt,
    }))

    res.json({ success: true, data: { items, total } })
  } catch (err) { next(err) }
})

// ── Deposits (refund tracking) ────────────────────────────────────────────────

adminRouter.get('/deposits', validateQuery(ListSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c     = getContainer()
    const query = (req as any).validatedQuery as z.infer<typeof ListSchema>
    const skip  = (query.page - 1) * query.limit

    const where = { depositStatus: { not: 'HELD' as any } }

    const [rows, total] = await Promise.all([
      c.prisma.rental.findMany({
        where,
        include: {
          renter:       { select: { name: true } },
          vendor:       { select: { businessName: true } },
          product:      { select: { name: true } },
          returnRecord: { select: { depositDeduction: true, depositRefund: true, condition: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: query.limit,
      }),
      c.prisma.rental.count({ where }),
    ])

    const items = rows.map((r) => ({
      id:               r.id,
      renterName:       r.renter.name,
      vendorName:       r.vendor.businessName,
      productName:      r.product.name,
      depositAmount:    Number(r.depositAmount),
      depositStatus:    r.depositStatus,
      depositDeduction: r.returnRecord ? Number(r.returnRecord.depositDeduction) : 0,
      depositRefund:    r.returnRecord ? Number(r.returnRecord.depositRefund) : Number(r.depositAmount),
      condition:        r.returnRecord?.condition ?? null,
      rentalStatus:     r.status,
      updatedAt:        r.updatedAt,
    }))

    res.json({ success: true, data: { items, total } })
  } catch (err) { next(err) }
})

// ── Commissions ───────────────────────────────────────────────────────────────

adminRouter.get('/commissions', validateQuery(ListSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c     = getContainer()
    const query = (req as any).validatedQuery as z.infer<typeof ListSchema>
    const skip  = (query.page - 1) * query.limit

    const where = { status: 'COMPLETED' as any }

    const [rows, total, aggregate] = await Promise.all([
      c.prisma.rental.findMany({
        where,
        include: {
          vendor:  { select: { businessName: true } },
          product: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
      }),
      c.prisma.rental.count({ where }),
      c.prisma.rental.aggregate({ where, _sum: { platformFee: true } }),
    ])

    const items = rows.map((r) => ({
      id:              r.id,
      vendorName:      r.vendor.businessName,
      productName:     r.product.name,
      rentalFee:       Number(r.rentalFee),
      platformFeeRate: Number(r.platformFeeRate),
      platformFee:     Number(r.platformFee),
      status:          r.status,
      createdAt:       r.createdAt,
    }))

    res.json({
      success: true,
      data: { items, total, totalCommission: Number(aggregate._sum.platformFee ?? 0) },
    })
  } catch (err) { next(err) }
})

// ── Damage claims (admin review queue) ────────────────────────────────────────

adminRouter.get('/damage-claims', validateQuery(ListSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c     = getContainer()
    const query = (req as any).validatedQuery as z.infer<typeof ListSchema>
    const skip  = (query.page - 1) * query.limit

    const where = { adminReviewRequired: true, rental: { status: 'RETURN_RECEIVED' as any } }

    const [rows, total] = await Promise.all([
      c.prisma.returnRecord.findMany({
        where,
        include: {
          evidence: { select: { id: true, fileUrl: true, type: true, uploadedAt: true } },
          rental: {
            include: {
              renter:  { select: { name: true } },
              vendor:  { select: { id: true, businessName: true } },
              product: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take:  query.limit,
      }),
      c.prisma.returnRecord.count({ where }),
    ])

    const items = rows.map((r) => ({
      id:                      r.id,
      rentalId:                r.rentalId,
      renterName:              r.rental.renter.name,
      vendorName:              r.rental.vendor.businessName,
      vendorProfileId:         r.rental.vendor.id,
      productName:             r.rental.product.name,
      depositAmount:           Number(r.rental.depositAmount),
      pricePerDay:             Number(r.rental.pricePerDay),
      endDate:                 r.rental.endDate,
      lateDays:                r.lateDays             ?? 0,
      latePenalty:             Number(r.latePenalty   ?? 0),
      vendorClaimedDeduction:  Number(r.depositDeduction),
      damageDescription:       r.damageDescription,
      damageAmount:            Number(r.damageAmount  ?? 0),
      condition:               r.condition,
      evidence:                r.evidence.map((e) => ({
        id:         e.id,
        fileUrl:    e.fileUrl,
        type:       e.type,
        uploadedAt: e.uploadedAt,
      })),
      createdAt: r.createdAt,
    }))

    res.json({ success: true, data: { items, total } })
  } catch (err) { next(err) }
})

adminRouter.post('/damage-claims/:id/resolve', validateParams(IdSchema), validateBody(ResolveDamageClaimSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c    = getContainer()
    const rec  = await c.prisma.returnRecord.findUnique({
      where:   { id: req.params['id']! },
      include: { rental: true },
    })
    if (!rec)                    { res.status(404).json({ success: false, error: { code: 'NOT_FOUND',     message: 'Return record not found'   } }); return }
    if (!rec.adminReviewRequired){ res.status(400).json({ success: false, error: { code: 'INVALID_STATE', message: 'Not pending admin review'  } }); return }

    // Late fees are deducted automatically while the rental is overdue (see
    // utils/late-fee.ts) and already transferred to the vendor's wallet by the
    // time this damage claim reaches admin review — rec.depositDeduction
    // already holds that already-paid late amount. Admin here only resolves
    // the damage portion on top of it, to avoid double-deducting/double-paying.
    const depositAmount      = Number(rec.rental.depositAmount)
    const alreadyDeducted    = Number(rec.depositDeduction)
    const damageDeduction    = Number(req.body.damageDeduction) || 0
    const room                = Math.max(0, depositAmount - alreadyDeducted)
    const actualDamageDeduct = Math.min(damageDeduction, room)
    const totalDeduction     = alreadyDeducted + actualDamageDeduct
    const outstandingDue     = Math.max(0, damageDeduction - room)
    const refundAmount       = depositAmount - totalDeduction

    const depositStatus = totalDeduction >= depositAmount ? 'FORFEITED'
      : totalDeduction > 0 ? 'PARTIALLY_REFUNDED'
      : 'FULLY_REFUNDED'

    await c.prisma.returnRecord.update({
      where: { id: rec.id },
      data:  {
        depositDeduction:    totalDeduction,
        depositRefund:       refundAmount,
        damageAmount:        actualDamageDeduct > 0 ? actualDamageDeduct : undefined,
        outstandingDue:      outstandingDue > 0 ? outstandingDue : null,
        adminReviewRequired: false,
      },
    })

    await c.prisma.rental.update({
      where: { id: rec.rentalId },
      data:  { depositStatus: depositStatus as any, status: 'COMPLETED' as any, completedAt: new Date() },
    })

    // Pay the vendor only for the new damage deduction — the late fee portion
    // (if any) was already paid out automatically as it accrued.
    if (actualDamageDeduct > 0) {
      await c.prisma.vendorPayout.create({
        data: {
          vendorId:       rec.rental.vendorId,
          rentalId:       rec.rentalId,
          amount:         actualDamageDeduct,
          method:         'BKASH' as any,
          status:         'COMPLETED',
          transactionRef: `DAMAGE_DEDUCTION_${rec.rentalId.slice(-8).toUpperCase()}`,
          processedAt:    new Date(),
        },
      })
    }

    // Rental earnings payout (net of commission) — always on completion.
    // If a PENDING payout already exists (e.g. created at payment time by an older flow),
    // upgrade it to COMPLETED instead of skipping it.
    const rentalPayoutRef    = `RENTAL_PAYOUT_${rec.rentalId.slice(-8).toUpperCase()}`
    const rentalPayoutRecord = await c.prisma.vendorPayout.findFirst({ where: { transactionRef: rentalPayoutRef } })
    if (!rentalPayoutRecord) {
      await c.prisma.vendorPayout.create({
        data: {
          vendorId:       rec.rental.vendorId,
          rentalId:       rec.rentalId,
          amount:         Number(rec.rental.vendorPayout),
          method:         'BKASH' as any,
          status:         'COMPLETED',
          transactionRef: rentalPayoutRef,
          processedAt:    new Date(),
        },
      })
      await c.prisma.vendorProfile.update({
        where: { id: rec.rental.vendorId },
        data:  { totalEarnings: { increment: rec.rental.vendorPayout } },
      })
    } else if (rentalPayoutRecord.status !== 'COMPLETED') {
      await c.prisma.vendorPayout.update({
        where: { id: rentalPayoutRecord.id },
        data:  { status: 'COMPLETED', amount: Number(rec.rental.vendorPayout), processedAt: new Date() },
      })
      await c.prisma.vendorProfile.update({
        where: { id: rec.rental.vendorId },
        data:  { totalEarnings: { increment: rec.rental.vendorPayout } },
      })
    }

    res.json({ success: true, data: { depositStatus, actualDeduction: totalDeduction, refundAmount, outstandingDue } })
  } catch (err) { next(err) }
})

// ── Analytics ─────────────────────────────────────────────────────────────────

adminRouter.get('/analytics', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const c    = getContainer()
    const year = new Date().getFullYear()
    const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`)

    const [rentals, rootCategories, vendors] = await Promise.all([
      c.prisma.rental.findMany({
        where:  { createdAt: { gte: startOfYear } },
        select: { createdAt: true, rentalFee: true },
      }),
      c.prisma.category.findMany({
        where:    { parentId: null },
        include:  { children: { select: { id: true } } },
      }),
      c.prisma.vendorProfile.findMany({
        where:   { status: 'ACTIVE' },
        select:  { businessName: true, totalRentals: true, totalEarnings: true, averageRating: true },
        orderBy: { totalEarnings: 'desc' },
        take:    5,
      }),
    ])

    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    const monthly = MONTHS.map((month, i) => {
      const monthRentals = rentals.filter((r) => new Date(r.createdAt).getMonth() === i)
      return {
        month,
        rentals: monthRentals.length,
        revenue: monthRentals.reduce((sum, r) => sum + Number(r.rentalFee), 0),
      }
    })

    // Count active products in all subcategories that belong to each root category
    const catCounts = await Promise.all(
      rootCategories.map(async (cat) => {
        const childIds = cat.children.map((c) => c.id)
        const ids = [cat.id, ...childIds]
        const count = await c.prisma.product.count({
          where: { categoryId: { in: ids }, status: 'ACTIVE' },
        })
        return { name: cat.name, count }
      })
    )

    const totalProducts = catCounts.reduce((s, c) => s + c.count, 0)
    const catData = catCounts
      .filter((cat) => cat.count > 0)
      .map((cat) => ({
        name:  cat.name,
        count: cat.count,
        pct:   totalProducts > 0 ? Math.round((cat.count / totalProducts) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    res.json({
      success: true,
      data: {
        monthly,
        categories: catData,
        topVendors: vendors.map((v) => ({
          name:    v.businessName,
          rentals: v.totalRentals,
          revenue: Number(v.totalEarnings),
          rating:  Number(v.averageRating),
        })),
      },
    })
  } catch (err) { next(err) }
})

// ── Reviews ───────────────────────────────────────────────────────────────────

const ReviewListSchema = z.object({
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type:  z.enum(['reviews', 'feedback']).optional(),
})

adminRouter.get('/reviews', validateQuery(ReviewListSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c     = getContainer()
    const query = (req as any).validatedQuery as z.infer<typeof ReviewListSchema>
    const skip  = (query.page - 1) * query.limit

    if (!query.type || query.type === 'reviews') {
      const [rows, total] = await Promise.all([
        c.prisma.review.findMany({
          orderBy: { createdAt: 'desc' },
          skip,
          take: query.limit,
          include: {
            reviewer: { select: { name: true, email: true } },
            product:  { select: { name: true } },
          },
        }),
        c.prisma.review.count(),
      ])

      // Resolve vendor names (vendorId → VendorProfile with no Prisma relation)
      const vendorIds   = [...new Set(rows.map((r) => r.vendorId))]
      const vendorProfs = await c.prisma.vendorProfile.findMany({
        where:  { id: { in: vendorIds } },
        select: { id: true, businessName: true },
      })
      const vendorMap = Object.fromEntries(vendorProfs.map((v) => [v.id, v.businessName]))

      return res.json({
        success: true,
        data: {
          items: rows.map((r) => ({
            id:            r.id,
            type:          'review' as const,
            rentalId:      r.rentalId,
            reviewerName:  r.reviewer.name,
            reviewerEmail: r.reviewer.email,
            productName:   r.product.name,
            vendorName:    vendorMap[r.vendorId] ?? '—',
            rating:        r.rating,
            title:         r.title,
            body:          r.body,
            vendorReply:   r.vendorReply,
            isVerified:    r.isVerified,
            helpfulCount:  r.helpfulCount,
            createdAt:     r.createdAt,
          })),
          total,
        },
      })
    }

    // type === 'feedback'
    const [rows, total] = await Promise.all([
      c.prisma.vendorFeedback.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
        include: {
          vendor:   { select: { businessName: true } },
          customer: { select: { name: true, email: true } },
        },
      }),
      c.prisma.vendorFeedback.count(),
    ])

    res.json({
      success: true,
      data: {
        items: rows.map((r) => ({
          id:            r.id,
          type:          'feedback' as const,
          rentalId:      r.rentalId,
          vendorName:    r.vendor.businessName,
          customerName:  r.customer.name,
          customerEmail: r.customer.email,
          rating:        r.rating,
          comment:       r.comment,
          createdAt:     r.createdAt,
        })),
        total,
      },
    })
  } catch (err) { next(err) }
})

adminRouter.delete('/reviews/:id', validateParams(IdSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c = getContainer()
    await c.prisma.review.delete({ where: { id: req.params['id']! } })
    res.json({ success: true })
  } catch (err) { next(err) }
})

adminRouter.delete('/vendor-feedback/:id', validateParams(IdSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c = getContainer()
    await c.prisma.vendorFeedback.delete({ where: { id: req.params['id']! } })
    res.json({ success: true })
  } catch (err) { next(err) }
})

// ── Demo Mode Settings ────────────────────────────────────────────────────────

adminRouter.get('/settings/demo-mode', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const c   = getContainer()
    const row = await c.prisma.systemSetting.findUnique({ where: { key: DEMO_MODE_KEY } })
    res.json({ success: true, data: { enabled: row?.value === 'true' } })
  } catch (err) { next(err) }
})

adminRouter.put('/settings/demo-mode', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { enabled } = req.body as { enabled: boolean }
    const c = getContainer()
    await c.prisma.systemSetting.upsert({
      where:  { key: DEMO_MODE_KEY },
      update: { value: String(!!enabled) },
      create: { key: DEMO_MODE_KEY, value: String(!!enabled) },
    })
    res.json({ success: true, data: { enabled: !!enabled } })
  } catch (err) { next(err) }
})
