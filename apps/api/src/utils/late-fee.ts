import type { PrismaClient } from '@prisma/client'
import { notify } from './notify.js'
import { isDemoModeEnabled, getDemoDueDate, getDemoLateDays } from './demo-mode.js'

/** Statuses during which a rental's late fee keeps accruing. */
const ACCRUING_STATUSES = ['ACTIVE', 'OVERDUE']

export interface LateFeeCheckResult {
  status:           string
  lateDays:         number
  lateFeeAmount:    number
  depositRemaining: number
}

/**
 * Recomputes the late state of a single rental against "now".
 *
 * Normal mode: due date = endDate at 23:59:59; 1 calendar day = 1 late day.
 * Demo mode  : due date = startedAt/confirmedAt/createdAt + totalDays minutes;
 *              1 real minute past due = 1 late day.
 *
 * Pass demoMode explicitly when calling from a bulk loop to avoid one DB
 * round-trip per rental; omit it and the function fetches the setting itself.
 */
export async function checkAndApplyLateFee(
  prisma:   PrismaClient,
  rentalId: string,
  demoMode?: boolean,
): Promise<LateFeeCheckResult | null> {
  const rental = await prisma.rental.findUnique({ where: { id: rentalId } })
  if (!rental) return null
  if (!ACCRUING_STATUSES.includes(rental.status)) return null

  const isDemo = demoMode ?? await isDemoModeEnabled(prisma)
  const now    = new Date()

  let lateDays: number
  if (isDemo) {
    const dueDate = getDemoDueDate(rental)
    lateDays      = getDemoLateDays(now.getTime() - dueDate.getTime())
  } else {
    const dueDate = new Date(rental.endDate)
    dueDate.setHours(23, 59, 59, 999)
    const msLate = now.getTime() - dueDate.getTime()
    lateDays     = msLate > 0 ? Math.ceil(msLate / (1000 * 60 * 60 * 24)) : 0
  }

  const depositAmount    = Number(rental.depositAmount)
  const previousLateDays = rental.lateDays
  const previousFee      = Number(rental.lateFeeAmount)

  // No longer overdue (e.g. vendor extended the end date) — revert the flag.
  if (lateDays === 0) {
    if (rental.status === 'OVERDUE') {
      await prisma.rental.update({ where: { id: rentalId }, data: { status: 'ACTIVE' } })
    }
    return { status: 'ACTIVE', lateDays: 0, lateFeeAmount: previousFee, depositRemaining: depositAmount - previousFee }
  }

  // Already accounted for today — just make sure the status flag is correct.
  if (lateDays <= previousLateDays) {
    if (rental.status !== 'OVERDUE') {
      await prisma.rental.update({ where: { id: rentalId }, data: { status: 'OVERDUE' } })
    }
    return { status: 'OVERDUE', lateDays: previousLateDays, lateFeeAmount: previousFee, depositRemaining: depositAmount - previousFee }
  }

  // New late day(s) have accrued since the last check.
  const incrementalDays  = lateDays - previousLateDays
  const dailyRate        = Number(rental.pricePerDay)
  const room             = Math.max(0, depositAmount - previousFee)
  const incrementalFee   = Math.min(incrementalDays * dailyRate, room)
  const newTotalFee      = previousFee + incrementalFee
  const depositRemaining = depositAmount - newTotalFee

  await prisma.rental.update({
    where: { id: rentalId },
    data:  { status: 'OVERDUE', lateDays, lateFeeAmount: newTotalFee },
  })

  if (incrementalFee > 0) {
    await prisma.lateFeeTransaction.create({
      data: { rentalId, lateDays, dailyRate, amount: incrementalFee, totalLateFee: newTotalFee, depositRemaining },
    })

    await prisma.payment.create({
      data: {
        rentalId,
        payerId:         rental.renterId,
        type:            'LATE_FEE_DEDUCTION',
        amount:          incrementalFee,
        method:          'CASH',
        status:          'COMPLETED',
        completedAt:     now,
        gatewayResponse: {
          lateDays, dailyRate,
          reason: isDemo ? 'Demo mode late return fee' : 'Automatic late return fee',
        },
      },
    })

    await prisma.vendorProfile.update({
      where: { id: rental.vendorId },
      data:  { totalEarnings: { increment: incrementalFee } },
    })

    const payoutRef      = `LATE_FEE_${rentalId.slice(-8).toUpperCase()}`
    const existingPayout = await prisma.vendorPayout.findFirst({ where: { transactionRef: payoutRef } })
    if (existingPayout) {
      await prisma.vendorPayout.update({
        where: { id: existingPayout.id },
        data:  { amount: { increment: incrementalFee }, processedAt: now },
      })
    } else {
      await prisma.vendorPayout.create({
        data: {
          vendorId: rental.vendorId, rentalId, amount: incrementalFee,
          method: 'BKASH', status: 'COMPLETED', transactionRef: payoutRef, processedAt: now,
        },
      })
    }
  }

  if (!rental.overdueNotifiedAt) {
    await prisma.rental.update({ where: { id: rentalId }, data: { overdueNotifiedAt: now } })
    await notify(
      prisma,
      rental.renterId,
      'LATE_FEE_WARNING',
      'Product Return Overdue',
      isDemo
        ? '[Demo] Your rental period has ended. Late fees are being deducted from your security deposit.'
        : 'Warning! Your rental period has ended. Please return the product immediately. Late fees are being deducted from your security deposit.',
      { rentalId, lateDays, lateFeeAmount: newTotalFee, depositRemaining },
    )
  }

  return { status: 'OVERDUE', lateDays, lateFeeAmount: newTotalFee, depositRemaining }
}

/** Runs the late-fee check across every rental currently ACTIVE or OVERDUE. */
export async function checkAllOverdueRentals(prisma: PrismaClient, demoMode?: boolean): Promise<void> {
  const isDemo = demoMode ?? await isDemoModeEnabled(prisma)
  const candidates = await prisma.rental.findMany({
    where:  { status: { in: ['ACTIVE', 'OVERDUE'] } },
    select: { id: true },
  })
  for (const { id } of candidates) {
    await checkAndApplyLateFee(prisma, id, isDemo)
  }
}
