import { Router }              from 'express'
import { z }                   from 'zod'
import { getContainer }        from '@/infrastructure/container/container.js'
import { validateBody }        from '@/interface/http/middleware/validate.middleware.js'
import { authenticate }        from '@/interface/http/middleware/authenticate.middleware.js'
import {
  uploadVendorRegistrationFiles,
  processVendorRegistrationFiles,
} from '@/interface/http/middleware/upload.middleware.js'
import { RefreshTokenUseCase } from '@/application/use-cases/auth/refresh-token.use-case.js'
import { LogoutUseCase }       from '@/application/use-cases/auth/logout.use-case.js'
import { ForgotPasswordUseCase } from '@/application/use-cases/auth/forgot-password.use-case.js'
import { ResetPasswordUseCase }  from '@/application/use-cases/auth/reset-password.use-case.js'
import { RegisterVendorUseCase }   from '@/application/use-cases/auth/register-vendor.use-case.js'
import { RegisterCustomerUseCase } from '@/application/use-cases/auth/register-customer.use-case.js'
import type { Request, Response, NextFunction } from 'express'
import { asId } from '@lendora/shared'
import type { UserId } from '@lendora/shared'

const RegisterSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/, 'Must contain uppercase').regex(/[0-9]/, 'Must contain digit'),
  name:     z.string().min(2).max(100),
  phone:    z.string().regex(/^\+880\d{10}$/).optional(),
  role:     z.enum(['RENTER', 'VENDOR']).default('RENTER'),
})

const LoginSchema = z.object({
  email:    z.string().email().toLowerCase(),
  password: z.string().min(1),
})

const RefreshSchema = z.object({
  refreshToken: z.string().min(1).optional(),
})

const ForgotSchema = z.object({ email: z.string().email() })

const ResetSchema = z.object({
  token:    z.string().min(1),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
})

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure:   process.env['NODE_ENV'] === 'production',
  sameSite: 'lax' as const,
  maxAge:   7 * 24 * 60 * 60 * 1000,
  path:     '/',
}

export const authRouter = Router()

authRouter.post('/register', validateBody(RegisterSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await getContainer().auth.register.execute(req.body)
    res.cookie('refreshToken', result.tokens.refreshToken, COOKIE_OPTIONS)
    res.status(201).json({ success: true, data: { accessToken: result.tokens.accessToken, user: result.user } })
  } catch (err) { next(err) }
})

// Vendor-specific full registration (multipart — includes NID images + profile picture)
const VendorRegisterSchema = z.object({
  name:                z.string().min(2).max(100),
  email:               z.string().email(),
  phone:               z.string().regex(/^\+880\d{10}$/),
  password:            z.string().min(8).regex(/[A-Z]/, 'Must contain uppercase').regex(/[0-9]/, 'Must contain digit'),
  address:             z.string().optional(),
  businessName:        z.string().min(2).max(120),
  businessDescription: z.string().min(10).max(2000).optional().or(z.literal('')),
  businessAddress:     z.string().max(300).optional(),
  division:            z.string().min(2).max(60),
  district:            z.string().min(2).max(60),
  bkashNumber:         z.string().regex(/^\+880\d{10}$/).optional(),
  // URLs set by processVendorRegistrationFiles middleware — not from client
  profilePictureUrl:   z.string().optional(),
  nidFrontImageUrl:    z.string().optional(),
  nidBackImageUrl:     z.string().optional(),
})

authRouter.post(
  '/register/vendor',
  uploadVendorRegistrationFiles,
  processVendorRegistrationFiles(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = VendorRegisterSchema.safeParse(req.body)
      if (!parsed.success) {
        const details: Record<string, string[]> = {}
        for (const issue of parsed.error.issues) {
          const field = issue.path.join('.')
          details[field] = [...(details[field] ?? []), issue.message]
        }
        res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details } })
        return
      }
      const c = getContainer()
      const uc = new RegisterVendorUseCase({ userRepo: c.repos.user, prisma: c.prisma })
      const result = await uc.execute(parsed.data)
      res.status(201).json({ success: true, data: result })
    } catch (err) { next(err) }
  },
)

// Customer full registration (multipart — includes NID images + profile picture)
const CustomerRegisterSchema = z.object({
  name:              z.string().min(2).max(100),
  email:             z.string().email(),
  phone:             z.string().regex(/^\+880\d{10}$/),
  password:          z.string().min(8).regex(/[A-Z]/, 'Must contain uppercase').regex(/[0-9]/, 'Must contain digit'),
  address:           z.string().optional(),
  bkashNumber:       z.string().regex(/^\+880\d{10}$/).optional(),
  profilePictureUrl: z.string().optional(),
  nidFrontImageUrl:  z.string().optional(),
  nidBackImageUrl:   z.string().optional(),
})

authRouter.post(
  '/register/customer',
  uploadVendorRegistrationFiles,
  processVendorRegistrationFiles(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = CustomerRegisterSchema.safeParse(req.body)
      if (!parsed.success) {
        const details: Record<string, string[]> = {}
        for (const issue of parsed.error.issues) {
          const field = issue.path.join('.')
          details[field] = [...(details[field] ?? []), issue.message]
        }
        res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details } })
        return
      }
      const c = getContainer()
      const uc = new RegisterCustomerUseCase({ userRepo: c.repos.user, prisma: c.prisma })
      const result = await uc.execute(parsed.data)
      res.status(201).json({ success: true, data: result })
    } catch (err) { next(err) }
  },
)

authRouter.post('/login', validateBody(LoginSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await getContainer().auth.login.execute(req.body)
    res.cookie('refreshToken', result.tokens.refreshToken, COOKIE_OPTIONS)
    res.json({ success: true, data: { accessToken: result.tokens.accessToken, user: result.user } })
  } catch (err) { next(err) }
})

authRouter.post('/refresh', validateBody(RefreshSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c     = getContainer()
    const token = (req.body.refreshToken as string | undefined) ?? req.cookies?.['refreshToken']
    if (!token) { res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No refresh token' } }); return }

    const result = await new RefreshTokenUseCase({ userRepo: c.repos.user, tokenService: c.tokenService, cache: c.cache })
      .execute({ refreshToken: token })

    res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS)
    res.json({ success: true, data: { accessToken: result.accessToken } })
  } catch (err) { next(err) }
})

authRouter.post('/logout', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c = getContainer()
    await new LogoutUseCase({ userRepo: c.repos.user, cache: c.cache })
      .execute(asId<UserId>(req.user!.userId))
    res.clearCookie('refreshToken', { path: '/' })
    res.json({ success: true, data: null })
  } catch (err) { next(err) }
})

authRouter.post('/forgot-password', validateBody(ForgotSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c = getContainer()
    await new ForgotPasswordUseCase({ userRepo: c.repos.user, emailService: c.emailService })
      .execute(req.body.email as string)
    res.json({ success: true, data: null })
  } catch (err) { next(err) }
})

authRouter.post('/reset-password', validateBody(ResetSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await new ResetPasswordUseCase({ userRepo: getContainer().repos.user }).execute(req.body)
    res.json({ success: true, data: null })
  } catch (err) { next(err) }
})
