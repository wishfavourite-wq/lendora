import { Router }              from 'express'
import { z }                   from 'zod'
import { getContainer }        from '@/infrastructure/container/container.js'
import { validateBody, validateQuery, validateParams } from '@/interface/http/middleware/validate.middleware.js'
import { authenticate, authorize } from '@/interface/http/middleware/authenticate.middleware.js'
import { uploadMultiple, processUploadedFiles } from '@/interface/http/middleware/upload.middleware.js'
import { ConfirmRentalUseCase }  from '@/application/use-cases/rental/confirm-rental.use-case.js'
import { CancelRentalUseCase }   from '@/application/use-cases/rental/cancel-rental.use-case.js'
import { InitiateReturnUseCase } from '@/application/use-cases/rental/initiate-return.use-case.js'
import { ConfirmReturnUseCase }  from '@/application/use-cases/rental/confirm-return.use-case.js'
import type { Request, Response, NextFunction } from 'express'
import { asId } from '@lendora/shared'
import type { RentalId, UserId } from '@lendora/shared'
import { checkAllOverdueRentals, checkAndApplyLateFee } from '@/utils/late-fee.js'
import { notify } from '@/utils/notify.js'
import { getCourierFees } from '@/utils/courier.js'

const CreateSchema = z.object({
  productId:        z.string().min(1),
  startDate:        z.coerce.date(),
  endDate:          z.coerce.date(),
  selectedDelivery: z.enum(['CUSTOMER_PICKUP','COURIER']).optional(),
  deliveryAddress:  z.string().optional(),
  pickupAddress:    z.string().optional(),
  renterNotes:      z.string().max(1000).optional(),
}).refine((d) => d.endDate > d.startDate, { message: 'endDate must be after startDate', path: ['endDate'] })

const CancelSchema = z.object({
  reason: z.enum(['RENTER_REQUESTED','VENDOR_UNAVAILABLE','ITEM_DAMAGED','ITEM_NOT_AS_DESCRIBED','PAYMENT_FAILED','FRAUD_SUSPECTED','ADMIN_ACTION']),
  note:   z.string().max(500).optional(),
})

const ConfirmReturnSchema = z.object({
  condition:         z.enum(['PERFECT','GOOD','MINOR_DAMAGE','MAJOR_DAMAGE','DAMAGED']),
  damageDescription: z.string().max(1000).optional(),
  damageAmount:      z.coerce.number().nonnegative().optional(),
})

const ShipSchema = z.object({
  shipmentMethod:       z.string().min(1).max(60),
  trackingNumber:       z.string().max(100).optional(),
  estimatedDeliveryDate: z.coerce.date().optional(),
})

const InitiateReturnSchema = z.object({
  returnMethod:        z.enum(['SELLER_PICKUP','COURIER_RETURN','CUSTOMER_DROPOFF']),
  returnDate:          z.coerce.date().optional(),
  returnTrackingNumber: z.string().max(100).optional(),
})

const ListSchema = z.object({
  status: z.string().optional(),
  page:   z.coerce.number().int().min(1).default(1),
  limit:  z.coerce.number().int().min(1).max(50).default(20),
})

const IdSchema     = z.object({ id: z.string().min(1) })
const ExtendSchema = z.object({
  newEndDate: z.coerce.date(),
})

export const rentalRouter = Router()
rentalRouter.use(authenticate)

// rentals.vendorId = VendorProfile.id (not User.id). These helpers bridge that gap.
async function resolveVendorProfileId(prisma: ReturnType<typeof getContainer>['prisma'], userId: string) {
  const vp = await prisma.vendorProfile.findFirst({ where: { userId }, select: { id: true } })
  return vp?.id ?? null
}
async function isVendorOfRental(prisma: ReturnType<typeof getContainer>['prisma'], rentalVendorId: string, userId: string) {
  const vp = await prisma.vendorProfile.findFirst({ where: { id: rentalVendorId }, select: { userId: true } })
  return vp?.userId === userId
}

rentalRouter.post('/', validateBody(CreateSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c    = getContainer()
    const body = req.body as z.infer<typeof CreateSchema>
    const r = await c.rental.createRental.execute(asId<UserId>(req.user!.userId), body)

    // If courier delivery selected, attach courier fees to rental record
    if (body.selectedDelivery === 'COURIER') {
      const fees = await getCourierFees(c.prisma)
      await c.prisma.rental.update({
        where: { id: r.id },
        data:  {
          selectedDelivery:  'COURIER',
          courierForwardFee: fees.forwardFee,
          courierReturnFee:  fees.returnFee,
          deliveryFee:       fees.forwardFee,
          totalAmount:       { increment: fees.forwardFee },
        },
      })
    } else if (body.selectedDelivery) {
      await c.prisma.rental.update({
        where: { id: r.id },
        data:  { selectedDelivery: body.selectedDelivery },
      })
    }

    // Notify vendor of new rental request
    const vp = await c.prisma.vendorProfile.findUnique({ where: { id: r.vendorId }, select: { userId: true, businessName: true } })
    if (vp) {
      await notify(c.prisma, vp.userId, 'BOOKING_CONFIRMED', 'New Rental Request', `A customer has requested to rent "${r.productName}". Review and confirm.`, { rentalId: r.id })
    }
    res.status(201).json({ success: true, data: r })
  } catch (err) { next(err) }
})

rentalRouter.get('/', validateQuery(ListSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c     = getContainer()
    const query = (req as any).validatedQuery as z.infer<typeof ListSchema>
    let filterField: string
    let filterValue: string

    // Recompute overdue status + late fees for any ACTIVE/OVERDUE rentals
    await checkAllOverdueRentals(c.prisma)

    if (req.user!.role === 'VENDOR') {
      const vpId = await resolveVendorProfileId(c.prisma, req.user!.userId)
      if (!vpId) { res.json({ success: true, data: { items: [], total: 0 } }); return }
      filterField = 'vendorId'
      filterValue = vpId
    } else {
      filterField = 'renterId'
      filterValue = req.user!.userId
    }

    const statusFilter = query.status
      ? (query.status.includes(',') ? (query.status.split(',') as any[]) : (query.status as any))
      : undefined

    const result = await c.repos.rental.findSummaries({
      [filterField]: asId<UserId>(filterValue),
      status:        statusFilter,
      page:          query.page,
      limit:         query.limit,
    })
    res.json({ success: true, data: result })
  } catch (err) { next(err) }
})

rentalRouter.get('/:id', validateParams(IdSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c = getContainer()
    const rentalId = req.params['id']!
    // Recompute overdue status + late fee before returning the latest state
    await checkAndApplyLateFee(c.prisma, rentalId)
    const [r, returnRecord, extra] = await Promise.all([
      c.repos.rental.findById(asId<RentalId>(rentalId)),
      c.repos.rental.findReturnRecord(asId<RentalId>(rentalId)),
      c.prisma.rental.findUnique({
        where:  { id: rentalId },
        select: {
          selectedDelivery:      true,
          courierForwardFee:     true,
          courierReturnFee:      true,
          returnMethod:          true,
          shipmentMethod:        true,
          trackingNumber:        true,
          estimatedDeliveryDate: true,
          shippedAt:             true,
          deliveredAt:           true,
          returnDate:            true,
          returnTrackingNumber:  true,
        },
      }),
    ])
    if (!r) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Rental not found' } }); return }
    const isRenter = r.renterId === req.user!.userId
    const isVendor = !isRenter && await isVendorOfRental(c.prisma, r.vendorId, req.user!.userId)
    if (!isRenter && !isVendor && req.user!.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Not authorized' } }); return
    }
    const extraMapped = extra ? {
      ...extra,
      courierForwardFee: extra.courierForwardFee ? Number(extra.courierForwardFee) : null,
      courierReturnFee:  extra.courierReturnFee  ? Number(extra.courierReturnFee)  : null,
    } : {}
    res.json({ success: true, data: { ...r, ...extraMapped, returnRecord: returnRecord ?? null } })
  } catch (err) { next(err) }
})

// GET /rentals/:id/renter-info — vendor/admin: basic renter profile for approval decisions
rentalRouter.get('/:id/renter-info', validateParams(IdSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c = getContainer()
    const r = await c.repos.rental.findById(asId<RentalId>(req.params['id']!))
    if (!r) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Rental not found' } }); return }
    const isVendorParty = await isVendorOfRental(c.prisma, r.vendorId, req.user!.userId)
    if (!isVendorParty && req.user!.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Not authorized' } }); return
    }
    const renter = await c.prisma.user.findUnique({
      where:  { id: r.renterId },
      select: { name: true, phone: true, avatarUrl: true, address: true, createdAt: true },
    })
    if (!renter) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Renter not found' } }); return }
    res.json({ success: true, data: renter })
  } catch (err) { next(err) }
})

// GET /rentals/:id/late-fee-history — renter, vendor of the rental, or admin
rentalRouter.get('/:id/late-fee-history', validateParams(IdSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c = getContainer()
    const rentalId = req.params['id']!
    // Recompute first so the history reflects "now" if this rental is currently overdue
    await checkAndApplyLateFee(c.prisma, rentalId)
    const r = await c.repos.rental.findById(asId<RentalId>(rentalId))
    if (!r) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Rental not found' } }); return }
    const isRenter = r.renterId === req.user!.userId
    const isVendor = !isRenter && await isVendorOfRental(c.prisma, r.vendorId, req.user!.userId)
    if (!isRenter && !isVendor && req.user!.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Not authorized' } }); return
    }
    const transactions = await c.prisma.lateFeeTransaction.findMany({
      where:   { rentalId },
      orderBy: { createdAt: 'asc' },
    })
    res.json({
      success: true,
      data: {
        lateDays:         r.lateDays,
        lateFeeAmount:    r.lateFeeAmount,
        depositRemaining: r.depositAmount - r.lateFeeAmount,
        transactions: transactions.map((t) => ({
          id:               t.id,
          lateDays:         t.lateDays,
          dailyRate:        Number(t.dailyRate),
          amount:           Number(t.amount),
          totalLateFee:     Number(t.totalLateFee),
          depositRemaining: Number(t.depositRemaining),
          createdAt:        t.createdAt,
        })),
      },
    })
  } catch (err) { next(err) }
})

rentalRouter.post('/:id/confirm', validateParams(IdSchema), authorize('VENDOR', 'ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c    = getContainer()
    const vpId = req.user!.role === 'VENDOR'
      ? await resolveVendorProfileId(c.prisma, req.user!.userId)
      : req.user!.userId
    if (!vpId) { res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Vendor profile not found' } }); return }
    const r = await new ConfirmRentalUseCase({ rentalRepo: c.repos.rental, eventBus: c.eventBus })
      .execute(asId<RentalId>(req.params['id']!), asId<UserId>(vpId))
    // If vendor provided a pickup and/or return address, save them
    const pickupAddress = req.body?.pickupAddress as string | undefined
    const returnAddress = req.body?.returnAddress as string | undefined
    if (pickupAddress?.trim() || returnAddress?.trim()) {
      await c.prisma.rental.update({
        where: { id: r.id },
        data:  {
          ...(pickupAddress?.trim() && { pickupAddress: pickupAddress.trim() }),
          ...(returnAddress?.trim() && { returnAddress: returnAddress.trim() }),
        },
      })
    }
    // Notify renter their rental was confirmed
    await notify(c.prisma, r.renterId, 'BOOKING_CONFIRMED', 'Rental Confirmed!', `Your rental of "${r.productName}" has been confirmed. Please complete payment to proceed.`, { rentalId: r.id })
    res.json({ success: true, data: { ...r, pickupAddress: pickupAddress?.trim() ?? r.pickupAddress, returnAddress: returnAddress?.trim() ?? r.returnAddress } })
  } catch (err) { next(err) }
})

// PATCH /rentals/:id/pickup-address — vendor sets/updates pickup address after confirmation
rentalRouter.patch('/:id/pickup-address', validateParams(IdSchema), authorize('VENDOR', 'ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c             = getContainer()
    const pickupAddress = (req.body?.pickupAddress as string | undefined)?.trim()
    if (!pickupAddress) { res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'pickupAddress is required' } }); return }
    const rental = await c.prisma.rental.findUnique({ where: { id: req.params['id']! } })
    if (!rental) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Rental not found' } }); return }
    const updated = await c.prisma.rental.update({
      where: { id: req.params['id']! },
      data:  { pickupAddress },
    })
    res.json({ success: true, data: { pickupAddress: updated.pickupAddress } })
  } catch (err) { next(err) }
})

// PATCH /rentals/:id/return-address — vendor sets/updates the address customers should return the item to
rentalRouter.patch('/:id/return-address', validateParams(IdSchema), authorize('VENDOR', 'ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c             = getContainer()
    const returnAddress = (req.body?.returnAddress as string | undefined)?.trim()
    if (!returnAddress) { res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'returnAddress is required' } }); return }
    const rental = await c.prisma.rental.findUnique({ where: { id: req.params['id']! } })
    if (!rental) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Rental not found' } }); return }
    const updated = await c.prisma.rental.update({
      where: { id: req.params['id']! },
      data:  { returnAddress },
    })
    res.json({ success: true, data: { returnAddress: updated.returnAddress } })
  } catch (err) { next(err) }
})

rentalRouter.post('/:id/cancel', validateParams(IdSchema), validateBody(CancelSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c = getContainer()
    const r = await new CancelRentalUseCase({ rentalRepo: c.repos.rental, eventBus: c.eventBus })
      .execute({ rentalId: asId<RentalId>(req.params['id']!), userId: asId<UserId>(req.user!.userId), role: req.user!.role as any, ...req.body })
    res.json({ success: true, data: r })
  } catch (err) { next(err) }
})

// POST /rentals/:id/mark-ready — renter confirms demo payment → READY_FOR_PICKUP
rentalRouter.post('/:id/mark-ready', validateParams(IdSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c = getContainer()
    const r = await c.repos.rental.findById(asId<RentalId>(req.params['id']!))
    if (!r) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Rental not found' } }); return }
    if (r.renterId !== req.user!.userId) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Only the renter can confirm payment' } }); return
    }
    if (r.status !== 'CONFIRMED') {
      res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: 'Rental must be confirmed by seller first' } }); return
    }
    const updated = await c.repos.rental.updateStatus(asId<RentalId>(r.id), 'READY_FOR_PICKUP' as any)

    const shortId = r.id.slice(-8).toUpperCase()

    // Create Payment records for the transaction (rental fee + deposit)
    const rentalPayRef  = `DEMO_RENTAL_${shortId}`
    const depositPayRef = `DEMO_DEPOSIT_${shortId}`
    const [existingRentalPay, existingDepositPay] = await Promise.all([
      c.prisma.payment.findFirst({ where: { externalReference: rentalPayRef } }),
      c.prisma.payment.findFirst({ where: { externalReference: depositPayRef } }),
    ])
    const now = new Date()
    if (!existingRentalPay) {
      await c.prisma.payment.create({
        data: {
          rentalId:          r.id,
          payerId:           r.renterId,
          type:              'RENTAL_PAYMENT' as any,
          amount:            Number(r.rentalFee) + Number(r.deliveryFee),
          method:            'BKASH' as any,
          status:            'COMPLETED',
          externalReference: rentalPayRef,
          completedAt:       now,
        },
      })
    }
    if (!existingDepositPay && Number(r.depositAmount) > 0) {
      await c.prisma.payment.create({
        data: {
          rentalId:          r.id,
          payerId:           r.renterId,
          type:              'DEPOSIT' as any,
          amount:            r.depositAmount,
          method:            'BKASH' as any,
          status:            'COMPLETED',
          externalReference: depositPayRef,
          completedAt:       now,
        },
      })
    }

    // Create a PENDING payout so vendor can see the incoming earnings immediately
    const payoutRef = `RENTAL_PAYOUT_${shortId}`
    const existingPayout = await c.prisma.vendorPayout.findFirst({ where: { transactionRef: payoutRef } })
    if (!existingPayout) {
      await c.prisma.vendorPayout.create({
        data: {
          vendorId:       r.vendorId,
          rentalId:       r.id,
          amount:         r.vendorPayout,
          method:         'BKASH' as any,
          status:         'PENDING',
          transactionRef: payoutRef,
        },
      })
    }

    // Notify vendor that payment was received and item is ready to dispatch
    const vp2 = await c.prisma.vendorProfile.findUnique({ where: { id: r.vendorId }, select: { userId: true } })
    if (vp2) {
      await notify(c.prisma, vp2.userId, 'PAYMENT_RECEIVED', 'Payment Received!', `Payment for "${r.productName}" has been received. Please dispatch the item to the renter.`, { rentalId: r.id })
    }
    res.json({ success: true, data: updated })
  } catch (err) { next(err) }
})

// POST /rentals/:id/dispatch — vendor ships item → SHIPPED (renter confirms receipt → ACTIVE)
rentalRouter.post('/:id/dispatch', validateParams(IdSchema), validateBody(ShipSchema), authorize('VENDOR', 'ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c = getContainer()
    const r = await c.repos.rental.findById(asId<RentalId>(req.params['id']!))
    if (!r) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Rental not found' } }); return }
    const isOwner = req.user!.role === 'ADMIN' || await isVendorOfRental(c.prisma, r.vendorId, req.user!.userId)
    if (!isOwner) { res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Not authorized' } }); return }
    if (r.status !== 'READY_FOR_PICKUP') {
      res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: 'Payment must be confirmed before shipping' } }); return
    }
    const body = req.body as z.infer<typeof ShipSchema>
    const updated = await c.prisma.rental.update({
      where: { id: r.id },
      data: {
        status:               'SHIPPED' as any,
        shipmentMethod:       body.shipmentMethod,
        trackingNumber:       body.trackingNumber ?? null,
        estimatedDeliveryDate: body.estimatedDeliveryDate ?? null,
        shippedAt:            new Date(),
      },
    })
    // Notify renter the item has been shipped
    await notify(c.prisma, r.renterId, 'ITEM_SHIPPED', 'Item Shipped!', `"${r.productName}" has been shipped to you via ${body.shipmentMethod}. Confirm receipt once it arrives.`, { rentalId: r.id })
    res.json({ success: true, data: updated })
  } catch (err) { next(err) }
})

// POST /rentals/:id/confirm-receipt — customer confirms delivery → ACTIVE
rentalRouter.post('/:id/confirm-receipt', validateParams(IdSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c = getContainer()
    const r = await c.repos.rental.findById(asId<RentalId>(req.params['id']!))
    if (!r) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Rental not found' } }); return }
    if (r.renterId !== req.user!.userId) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Only the renter can confirm receipt' } }); return
    }
    if (r.status !== 'SHIPPED') {
      res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: 'Item must be in shipped status' } }); return
    }
    const now = new Date()
    const updated = await c.prisma.rental.update({
      where: { id: r.id },
      data: {
        status:      'ACTIVE' as any,
        startedAt:   now,
        deliveredAt: now,
      },
    })
    // Notify vendor the item has been delivered
    const vp = await c.prisma.vendorProfile.findUnique({ where: { id: r.vendorId }, select: { userId: true } })
    if (vp) {
      await notify(c.prisma, vp.userId, 'ITEM_DELIVERED', 'Item Delivered!', `The renter confirmed receipt of "${r.productName}". The rental period is now active.`, { rentalId: r.id })
    }
    res.json({ success: true, data: updated })
  } catch (err) { next(err) }
})

// POST /rentals/:id/mark-collected — CUSTOMER_PICKUP only: skip SHIPPED, go READY_FOR_PICKUP → ACTIVE
rentalRouter.post('/:id/mark-collected', validateParams(IdSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c = getContainer()
    const r = await c.repos.rental.findById(asId<RentalId>(req.params['id']!))
    if (!r) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Rental not found' } }); return }

    const isRenter = r.renterId === req.user!.userId
    const isOwner  = req.user!.role === 'ADMIN' || await isVendorOfRental(c.prisma, r.vendorId, req.user!.userId)
    if (!isRenter && !isOwner) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Not authorized' } }); return
    }

    const raw = await c.prisma.rental.findUnique({ where: { id: r.id }, select: { selectedDelivery: true } })
    if (raw?.selectedDelivery !== 'CUSTOMER_PICKUP') {
      res.status(400).json({ success: false, error: { code: 'INVALID_DELIVERY', message: 'This action is only for Customer Pickup rentals' } }); return
    }
    if (r.status !== 'READY_FOR_PICKUP') {
      res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: 'Item must be in Ready for Pickup status' } }); return
    }

    const now = new Date()
    const updated = await c.prisma.rental.update({
      where: { id: r.id },
      data: { status: 'ACTIVE' as any, startedAt: now, deliveredAt: now },
    })

    const vp = await c.prisma.vendorProfile.findUnique({ where: { id: r.vendorId }, select: { userId: true } })
    if (isRenter) {
      if (vp) await notify(c.prisma, vp.userId, 'ITEM_DELIVERED', 'Item Collected!', `The customer confirmed they've collected "${r.productName}". The rental period is now active.`, { rentalId: r.id })
    } else {
      await notify(c.prisma, r.renterId, 'ITEM_DELIVERED', 'Item Collected!', `Your rental of "${r.productName}" is now active. Enjoy!`, { rentalId: r.id })
    }

    res.json({ success: true, data: updated })
  } catch (err) { next(err) }
})

// POST /rentals/:id/extend — vendor extends the end date of an ACTIVE rental
rentalRouter.post('/:id/extend', validateParams(IdSchema), validateBody(ExtendSchema), authorize('VENDOR', 'ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c = getContainer()
    const r = await c.repos.rental.findById(asId<RentalId>(req.params['id']!))
    if (!r) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Rental not found' } }); return }

    const isOwner = req.user!.role === 'ADMIN' || await isVendorOfRental(c.prisma, r.vendorId, req.user!.userId)
    if (!isOwner) { res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Not authorized' } }); return }

    if (r.status !== 'ACTIVE' && r.status !== 'OVERDUE') {
      res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: 'Only active rentals can be extended' } }); return
    }

    const newEndDate = req.body.newEndDate as Date
    const currentEnd = new Date(r.endDate)
    if (newEndDate <= currentEnd) {
      res.status(400).json({ success: false, error: { code: 'INVALID_DATE', message: 'New end date must be after current end date' } }); return
    }

    const startDate     = new Date(r.startDate)
    const msPerDay      = 1000 * 60 * 60 * 24
    const newTotalDays  = Math.round((newEndDate.getTime() - startDate.getTime()) / msPerDay)
    const pricePerDay   = Number(r.pricePerDay)
    const newRentalFee  = pricePerDay * newTotalDays
    const feeRate       = Number(r.platformFeeRate)
    const newPlatformFee = newRentalFee * feeRate
    const newVendorPayout = newRentalFee - newPlatformFee
    const newTotalAmount  = newRentalFee + Number(r.depositAmount) + Number(r.deliveryFee)

    const updated = await c.prisma.rental.update({
      where: { id: r.id },
      data:  {
        endDate:      newEndDate,
        totalDays:    newTotalDays,
        rentalFee:    newRentalFee,
        platformFee:  newPlatformFee,
        vendorPayout: newVendorPayout,
        totalAmount:  newTotalAmount,
      },
    })
    res.json({ success: true, data: updated })
  } catch (err) { next(err) }
})

rentalRouter.post('/:id/initiate-return', validateParams(IdSchema), validateBody(InitiateReturnSchema), authorize('CUSTOMER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c = getContainer()
    // Freeze the late fee at the moment the return is initiated — no further accrual after this
    await checkAndApplyLateFee(c.prisma, req.params['id']!)
    const r = await new InitiateReturnUseCase({ rentalRepo: c.repos.rental })
      .execute(asId<RentalId>(req.params['id']!), asId<UserId>(req.user!.userId))
    // Save return method details
    const body = req.body as z.infer<typeof InitiateReturnSchema>
    await c.prisma.rental.update({
      where: { id: r.id },
      data: {
        returnMethod:        body.returnMethod as any,
        returnDate:          body.returnDate ?? null,
        returnTrackingNumber: body.returnTrackingNumber ?? null,
      },
    })
    // Notify vendor a return has been requested
    const vp3 = await c.prisma.vendorProfile.findUnique({ where: { id: r.vendorId }, select: { userId: true } })
    if (vp3) {
      await notify(c.prisma, vp3.userId, 'RETURN_REQUESTED', 'Return Requested', `The renter has requested to return "${r.productName}" via ${body.returnMethod.replace(/_/g, ' ')}. Please inspect and confirm the return.`, { rentalId: r.id })
    }
    res.json({ success: true, data: r })
  } catch (err) { next(err) }
})

rentalRouter.post('/:id/confirm-return',
  validateParams(IdSchema),
  authorize('VENDOR'),
  uploadMultiple,
  processUploadedFiles('damage'),
  validateBody(ConfirmReturnSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const c      = getContainer()
      const vpId = await resolveVendorProfileId(c.prisma, req.user!.userId)
      if (!vpId) { res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Vendor profile not found' } }); return }
      const result = await new ConfirmReturnUseCase({ rentalRepo: c.repos.rental, productRepo: c.repos.product, eventBus: c.eventBus })
        .execute({ rentalId: asId<RentalId>(req.params['id']!), vendorId: asId<UserId>(vpId), ...req.body })

      const urls: string[] = req.body.uploadedUrls ?? []
      if (urls.length > 0) {
        await c.prisma.returnEvidence.createMany({
          data: urls.map((fileUrl) => ({
            returnRecordId: result.returnRecord.id,
            fileUrl,
            type: 'PHOTO',
            uploadedBy:     req.user!.userId,
          })),
        })
      }

      // Deduct non-refundable courier return fee for all courier delivery rentals
      const rentalRaw = await c.prisma.rental.findUnique({
        where:  { id: req.params['id']! },
        select: { selectedDelivery: true, courierReturnFee: true },
      })
      if (rentalRaw?.selectedDelivery === 'COURIER' && rentalRaw.courierReturnFee) {
        const courierDeduction = Number(rentalRaw.courierReturnFee)
        const currentRefund    = result.returnRecord.depositRefund
        const newRefund        = Math.max(0, currentRefund - courierDeduction)
        const newDeduction     = result.returnRecord.depositDeduction + courierDeduction
        await c.prisma.returnRecord.update({
          where: { id: result.returnRecord.id },
          data:  { depositRefund: newRefund, depositDeduction: newDeduction },
        })
        // Patch result in-memory so response is accurate
        ;(result.returnRecord as any).depositRefund    = newRefund
        ;(result.returnRecord as any).depositDeduction = newDeduction
        ;(result as any).depositRefund = newRefund
      }

      // Auto-credit: good-condition returns (even if late) are credited without admin review
      if (!result.returnRecord.adminReviewRequired) {
        const r   = result.rental
        const ref = `RENTAL_PAYOUT_${r.id.slice(-8).toUpperCase()}`
        const existing = await c.prisma.vendorPayout.findFirst({ where: { transactionRef: ref } })
        if (existing && existing.status === 'PENDING') {
          // Upgrade the PENDING payout created at payment time → COMPLETED
          await c.prisma.vendorPayout.update({
            where: { id: existing.id },
            data:  { status: 'COMPLETED', amount: r.vendorPayout, processedAt: new Date() },
          })
          await c.prisma.vendorProfile.update({
            where: { id: r.vendorId },
            data:  { totalEarnings: { increment: r.vendorPayout } },
          })
        } else if (!existing) {
          // No pending payout found — create completed one directly (fallback)
          await c.prisma.vendorPayout.create({
            data: {
              vendorId:       r.vendorId,
              rentalId:       r.id,
              amount:         r.vendorPayout,
              method:         'BKASH' as any,
              status:         'COMPLETED',
              transactionRef: ref,
              processedAt:    new Date(),
            },
          })
          await c.prisma.vendorProfile.update({
            where: { id: r.vendorId },
            data:  { totalEarnings: { increment: r.vendorPayout } },
          })
        }
      }

      // Notify renter return has been confirmed
      await notify(c.prisma, result.rental.renterId, 'RETURN_CONFIRMED', 'Return Confirmed', `Your return of "${result.rental.productName}" has been confirmed. Your deposit will be processed shortly.`, { rentalId: result.rental.id })
      res.json({ success: true, data: result })
    } catch (err) { next(err) }
  }
)
