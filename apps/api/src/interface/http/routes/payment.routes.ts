import { Router }              from 'express'
import { z }                   from 'zod'
import { getContainer }        from '@/infrastructure/container/container.js'
import { validateBody, validateParams, validateQuery } from '@/interface/http/middleware/validate.middleware.js'
import { authenticate, authorize } from '@/interface/http/middleware/authenticate.middleware.js'
import type { Request, Response, NextFunction } from 'express'
import { asId }                from '@lendora/shared'
import type { RentalId, UserId, PaymentId } from '@lendora/shared'

const InitiateSchema = z.object({
  rentalId:   z.string().min(1),
  method:     z.enum(['BKASH', 'NAGAD']),
  payerPhone: z.string().regex(/^01[3-9]\d{8}$/).optional(),
})

const ReleaseDepositSchema = z.object({
  deduction: z.number().min(0),
  reason:    z.string().max(500).optional(),
})

const PayoutSchema = z.object({
  rentalId: z.string().min(1),
})

const IdSchema = z.object({ id: z.string().min(1) })

export const paymentRouter = Router()

// ── Initiate payment ─────────────────────────────────────────────────────────

paymentRouter.post(
  '/initiate',
  authenticate,
  validateBody(InitiateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const c      = getContainer()
      const body   = req.body as z.infer<typeof InitiateSchema>
      const result = await c.payment.initiatePayment(body.method).execute({
        rentalId:   asId<RentalId>(body.rentalId),
        userId:     asId<UserId>(req.user!.userId),
        method:     body.method,
        payerPhone: body.payerPhone,
      })
      res.status(201).json({ success: true, data: result })
    } catch (err) { next(err) }
  },
)

// ── bKash callback (GET — browser redirect from bKash) ───────────────────────

paymentRouter.get(
  '/bkash/callback',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const c      = getContainer()
      const params = req.query as Record<string, string>
      const result = await c.payment.handleBkashCallback.execute({ params })

      // Redirect the renter back to the frontend with the outcome
      const frontendUrl = process.env['FRONTEND_URL'] ?? 'http://localhost:3000'
      const path        = result.success
        ? `/rentals/${result.payment.rentalId}?payment=success`
        : `/rentals/${result.payment.rentalId}?payment=failed`
      res.redirect(`${frontendUrl}${path}`)
    } catch (err) { next(err) }
  },
)

// ── Nagad callback (GET — browser redirect from Nagad) ───────────────────────

paymentRouter.get(
  '/nagad/callback',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const c      = getContainer()
      const params = req.query as Record<string, string>
      const result = await c.payment.handleNagadCallback.execute({ params })

      const frontendUrl = process.env['FRONTEND_URL'] ?? 'http://localhost:3000'
      const path        = result.success
        ? `/rentals/${result.payment.rentalId}?payment=success`
        : `/rentals/${result.payment.rentalId}?payment=failed`
      res.redirect(`${frontendUrl}${path}`)
    } catch (err) { next(err) }
  },
)

// ── Get payments for a rental ─────────────────────────────────────────────────

paymentRouter.get(
  '/rental/:id',
  authenticate,
  validateParams(IdSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const c        = getContainer()
      const rentalId = asId<RentalId>(req.params['id']!)
      const rental   = await c.repos.rental.findById(rentalId)

      if (!rental) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Rental not found' } }); return }

      // Renter, vendor, or admin may view payments
      const { userId, role } = req.user!
      const isRenter  = rental.renterId  === userId
      const isVendor  = rental.vendorId  === userId
      const isAdmin   = role === 'ADMIN'
      if (!isRenter && !isVendor && !isAdmin) {
        res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } }); return
      }

      const payments = await c.repos.payment.findPaymentsByRental(rentalId)
      res.json({ success: true, data: payments })
    } catch (err) { next(err) }
  },
)

// ── Release deposit (admin or system) ────────────────────────────────────────

paymentRouter.post(
  '/rental/:id/release-deposit',
  authenticate, authorize('ADMIN'),
  validateParams(IdSchema),
  validateBody(ReleaseDepositSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const c    = getContainer()
      const body = req.body as z.infer<typeof ReleaseDepositSchema>
      const result = await c.payment.releaseDeposit.execute({
        rentalId:  asId<RentalId>(req.params['id']!),
        deduction: body.deduction,
        reason:    body.reason,
      })
      res.json({ success: true, data: result })
    } catch (err) { next(err) }
  },
)

// ── Process vendor payout (admin) ─────────────────────────────────────────────

paymentRouter.post(
  '/payouts/process',
  authenticate, authorize('ADMIN'),
  validateBody(PayoutSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const c    = getContainer()
      const body = req.body as z.infer<typeof PayoutSchema>
      const result = await c.payment.processVendorPayout.execute({
        rentalId: asId<RentalId>(body.rentalId),
      })
      res.status(201).json({ success: true, data: result })
    } catch (err) { next(err) }
  },
)

// ── List payouts (admin or vendor) ────────────────────────────────────────────

paymentRouter.get(
  '/payouts',
  authenticate, authorize('ADMIN', 'VENDOR'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const c       = getContainer()
      const page    = Number(req.query['page']  ?? 1)
      const limit   = Number(req.query['limit'] ?? 20)
      const { userId, role } = req.user!

      let vendorId: string | undefined
      if (role === 'VENDOR') {
        const vendor = await c.repos.vendor.findByUserId(asId<UserId>(userId))
        if (!vendor) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Vendor not found' } }); return }
        vendorId = vendor.id
      }

      const result = await c.repos.payment.findPayouts({ vendorId: vendorId as any, page, limit })

      // Enrich with rental commission info for breakdown display
      const rentalIds = result.items.map((p: any) => p.rentalId)
      const rentals   = rentalIds.length
        ? await c.prisma.rental.findMany({
            where:  { id: { in: rentalIds } },
            select: { id: true, rentalFee: true, platformFee: true, platformFeeRate: true, product: { select: { name: true } } },
          })
        : []
      const rentalMap: Record<string, any> = Object.fromEntries(rentals.map((r) => [r.id, r]))

      const enriched = result.items.map((p: any) => ({
        ...p,
        productName:     rentalMap[p.rentalId]?.product?.name  ?? null,
        rentalFee:       Number(rentalMap[p.rentalId]?.rentalFee      ?? 0),
        platformFee:     Number(rentalMap[p.rentalId]?.platformFee    ?? 0),
        platformFeeRate: Number(rentalMap[p.rentalId]?.platformFeeRate ?? 0),
      }))

      res.json({ success: true, data: { items: enriched, total: result.total } })
    } catch (err) { next(err) }
  },
)

// ── My payment history (renter) ───────────────────────────────────────────────

paymentRouter.get(
  '/my',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const c    = getContainer()
      const page = Number(req.query['page']  ?? 1)
      const limit = Number(req.query['limit'] ?? 20)
      const result = await c.repos.payment.findPayments({
        userId: asId<UserId>(req.user!.userId),
        page,
        limit,
      })
      res.json({ success: true, data: result })
    } catch (err) { next(err) }
  },
)
