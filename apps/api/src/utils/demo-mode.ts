import type { PrismaClient } from '@prisma/client'

export const DEMO_MODE_KEY    = 'demo_mode'
export const DEMO_MS_PER_DAY  = 60 * 1000  // 1 real minute = 1 rental day

export async function isDemoModeEnabled(prisma: PrismaClient): Promise<boolean> {
  const row = await prisma.systemSetting.findUnique({ where: { key: DEMO_MODE_KEY } })
  return row?.value === 'true'
}

type RentalAnchor = {
  startedAt:   Date | null
  confirmedAt: Date | null
  createdAt:   Date
  totalDays:   number
}

/**
 * In demo mode the rental's due time is:
 *   (startedAt ?? confirmedAt ?? createdAt) + totalDays * 60 seconds
 *
 * The clock starts from when the item was physically in the customer's hands
 * (startedAt), falling back to earlier confirmation timestamps if not set.
 */
export function getDemoDueDate(rental: RentalAnchor): Date {
  const anchor = rental.startedAt ?? rental.confirmedAt ?? rental.createdAt
  return new Date(anchor.getTime() + rental.totalDays * DEMO_MS_PER_DAY)
}

/** Each full real minute past the due time counts as one late day. */
export function getDemoLateDays(msLate: number): number {
  return msLate > 0 ? Math.ceil(msLate / DEMO_MS_PER_DAY) : 0
}
