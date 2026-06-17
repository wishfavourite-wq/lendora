import { Router }        from 'express'
import { getContainer }  from '@/infrastructure/container/container.js'
import { prisma }        from '@/infrastructure/database/prisma.client.js'
import type { Request, Response, NextFunction } from 'express'

export const categoryRouter = Router()

categoryRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const withChildren = req.query['withChildren'] === 'true'

    if (withChildren) {
      const [roots, children] = await Promise.all([
        prisma.category.findMany({
          where:   { parentId: null, isActive: true },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          select:  { id: true, name: true, slug: true, emoji: true },
        }),
        prisma.category.findMany({
          where:   { parentId: { not: null }, isActive: true },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          select:  { id: true, name: true, slug: true, emoji: true, parentId: true },
        }),
      ])
      const data = roots.map((r) => ({
        id:       r.id,
        name:     r.name,
        slug:     r.slug,
        emoji:    r.emoji,
        children: children
          .filter((c) => c.parentId === r.id)
          .map((c) => ({ id: c.id, name: c.name, slug: c.slug, emoji: c.emoji })),
      }))
      res.json({ success: true, data })
      return
    }

    // Default: flat list with root categories + subcategories (cached)
    const c   = getContainer()
    const key = 'categories:flat:v6'
    const cached = await c.cache.get<object>(key)
    if (cached) { res.json({ success: true, data: cached }); return }

    const [roots, subs] = await Promise.all([
      prisma.category.findMany({
        where:   { parentId: null, isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        select:  {
          id: true, name: true, slug: true, emoji: true,
          _count: { select: { products: { where: { status: 'ACTIVE' } } } },
        },
      }),
      prisma.category.findMany({
        where:   { parentId: { not: null }, isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        select:  {
          id: true, name: true, slug: true, emoji: true, parentId: true,
          _count: { select: { products: { where: { status: 'ACTIVE' } } } },
        },
      }),
    ])

    // Count products directly on root + products in its subcategories
    const rootData = roots.map((r) => ({
      id:           r.id,
      name:         r.name,
      slug:         r.slug,
      emoji:        r.emoji,
      parentId:     null as string | null,
      productCount: r._count.products + subs
        .filter((s) => s.parentId === r.id)
        .reduce((sum, s) => sum + s._count.products, 0),
    }))
    const subData = subs.map((s) => ({ ...s, productCount: s._count.products }))
    const data = [...rootData, ...subData]

    await c.cache.set(key, data, 600)
    res.json({ success: true, data })
  } catch (err) { next(err) }
})

categoryRouter.get('/roots', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const c = getContainer()
    res.json({ success: true, data: await c.repos.category.findRoots() })
  } catch (err) { next(err) }
})

categoryRouter.get('/:slug/children', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c        = getContainer()
    const category = await c.repos.category.findBySlug(req.params['slug']!)
    if (!category) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Category not found' } }); return }
    res.json({ success: true, data: await c.repos.category.findChildren(category.id) })
  } catch (err) { next(err) }
})
