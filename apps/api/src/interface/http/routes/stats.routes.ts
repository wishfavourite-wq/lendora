import { Router }  from 'express'
import type { Request, Response } from 'express'
import { prisma }  from '@/infrastructure/database/prisma.client.js'
import { DEMO_MODE_KEY } from '@/utils/demo-mode.js'

export const statsRouter = Router()

statsRouter.get('/demo-mode', async (_req: Request, res: Response) => {
  try {
    const row = await prisma.systemSetting.findUnique({ where: { key: DEMO_MODE_KEY } })
    res.json({ success: true, data: { enabled: row?.value === 'true' } })
  } catch {
    res.json({ success: true, data: { enabled: false } })
  }
})

statsRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const [products, vendors, activeRentals, cityRows, todayRentals] = await Promise.all([
      prisma.product.count({ where: { status: 'ACTIVE' } }),
      prisma.vendorProfile.count({ where: { status: 'ACTIVE' } }),
      prisma.rental.count({ where: { status: 'ACTIVE' } }),
      prisma.vendorProfile.findMany({
        select:   { division: true },
        distinct: ['division'],
        where:    { status: 'ACTIVE' },
      }),
      prisma.rental.count({ where: { createdAt: { gte: todayStart } } }),
    ])

    res.json({
      success: true,
      data: {
        products,
        vendors,
        activeRentals,
        cities: cityRows.length,
        todayRentals,
      },
    })
  } catch {
    res.json({ success: true, data: { products: 0, vendors: 0, activeRentals: 0, cities: 0, todayRentals: 0 } })
  }
})
