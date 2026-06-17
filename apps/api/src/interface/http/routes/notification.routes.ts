import { Router } from 'express'
import type { Request, Response, NextFunction } from 'express'
import { authenticate } from '@/interface/http/middleware/authenticate.middleware.js'
import { getContainer }  from '@/infrastructure/container/container.js'

export const notificationRouter = Router()
notificationRouter.use(authenticate)

// GET /notifications — unread count + latest 30
notificationRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c      = getContainer()
    const userId = req.user!.userId
    const [items, unread] = await Promise.all([
      c.prisma.notification.findMany({
        where:   { userId },
        orderBy: { createdAt: 'desc' },
        take:    30,
      }),
      c.prisma.notification.count({ where: { userId, readAt: null } }),
    ])
    res.json({ success: true, data: { items, unread } })
  } catch (err) { next(err) }
})

// PATCH /notifications/read-all
notificationRouter.patch('/read-all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c = getContainer()
    await c.prisma.notification.updateMany({
      where: { userId: req.user!.userId, readAt: null },
      data:  { readAt: new Date() },
    })
    res.json({ success: true, data: null })
  } catch (err) { next(err) }
})

// PATCH /notifications/:id/read
notificationRouter.patch('/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c = getContainer()
    await c.prisma.notification.updateMany({
      where: { id: req.params['id']!, userId: req.user!.userId },
      data:  { readAt: new Date() },
    })
    res.json({ success: true, data: null })
  } catch (err) { next(err) }
})
