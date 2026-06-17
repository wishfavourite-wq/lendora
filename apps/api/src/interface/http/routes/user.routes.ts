import { Router }              from 'express'
import { z }                   from 'zod'
import { getContainer }        from '@/infrastructure/container/container.js'
import { validateBody, validateQuery, validateParams } from '@/interface/http/middleware/validate.middleware.js'
import { authenticate, authorize }      from '@/interface/http/middleware/authenticate.middleware.js'
import { uploadSingle, processUploadedFile } from '@/interface/http/middleware/upload.middleware.js'
import type { Request, Response, NextFunction } from 'express'
import { asId } from '@lendora/shared'
import type { UserId } from '@lendora/shared'

const ListSchema = z.object({
  page:   z.coerce.number().int().min(1).default(1),
  limit:  z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  role:   z.string().optional(),
  status: z.string().optional(),
})

const UpdateProfileSchema = z.object({
  name:   z.string().min(2).max(100).optional(),
  phone:  z.string().regex(/^\+880\d{10}$/).optional(),
})

const IdSchema = z.object({ id: z.string().min(1) })

export const userRouter = Router()

// GET /users — admin only, paginated list
userRouter.get('/', authenticate, authorize('ADMIN'), validateQuery(ListSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c     = getContainer()
    const query = (req as any).validatedQuery as z.infer<typeof ListSchema>
    const result = await c.repos.user.findMany({
      page:   query.page,
      limit:  query.limit,
      search: query.search,
      role:   query.role   as any,
      status: query.status as any,
    })
    res.json({ success: true, data: result })
  } catch (err) { next(err) }
})

// GET /users/me — current user's profile
userRouter.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c    = getContainer()
    const user = await c.repos.user.findById(asId<UserId>(req.user!.userId))
    if (!user) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } }); return }
    res.json({ success: true, data: user })
  } catch (err) { next(err) }
})

// PATCH /users/me — update own profile
userRouter.patch('/me', authenticate, validateBody(UpdateProfileSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c    = getContainer()
    const user = await c.repos.user.update(asId<UserId>(req.user!.userId), req.body)
    res.json({ success: true, data: user })
  } catch (err) { next(err) }
})

// POST /users/me/avatar — upload avatar
userRouter.post('/me/avatar', authenticate, uploadSingle, processUploadedFile('avatars'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c    = getContainer()
    const url  = req.body.uploadedUrl as string
    const user = await c.repos.user.update(asId<UserId>(req.user!.userId), { avatarUrl: url })
    res.json({ success: true, data: user })
  } catch (err) { next(err) }
})

// GET /users/:id — admin can view any user
userRouter.get('/:id', authenticate, authorize('ADMIN'), validateParams(IdSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c    = getContainer()
    const user = await c.repos.user.findById(asId<UserId>(req.params['id']!))
    if (!user) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } }); return }
    res.json({ success: true, data: user })
  } catch (err) { next(err) }
})
