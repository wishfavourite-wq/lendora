import { prisma }                 from '@/infrastructure/database/prisma.client.js'
import { logger }                 from '@/infrastructure/logger/logger.js'
import { isDemoModeEnabled }      from '@/utils/demo-mode.js'
import { checkAllOverdueRentals } from '@/utils/late-fee.js'

/**
 * Starts a 60-second interval that sweeps all ACTIVE/OVERDUE rentals and
 * applies demo-mode late fees whenever the admin has demo mode enabled.
 *
 * In normal mode the interval is a no-op, so it is safe to always register it.
 */
export function startDemoCron(): void {
  setInterval(async () => {
    try {
      const demo = await isDemoModeEnabled(prisma)
      if (!demo) return
      await checkAllOverdueRentals(prisma, true)
    } catch (err) {
      logger.error('Demo cron error', { err })
    }
  }, 60_000)

  logger.info('Demo-mode cron registered (60 s interval)')
}
