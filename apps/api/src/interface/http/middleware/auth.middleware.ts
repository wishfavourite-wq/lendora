import type { Request, Response, NextFunction } from 'express'
import type { JwtPayload, UserId } from '@lendora/shared'
import { UserRole } from '@lendora/shared'
import { UnauthorizedError, ForbiddenError } from '@/domain/errors/index.js'
import { getContainer } from '@/infrastructure/container/container.js'

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

/** Validates Bearer token and attaches decoded payload to req.user */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  try {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) throw new UnauthorizedError()

    const token = header.slice(7)
    const { tokenService } = getContainer()

    tokenService.verifyAccessToken(token)
      .then((payload) => { req.user = payload; next() })
      .catch(() => next(new UnauthorizedError('Access token is invalid or expired')))
  } catch (err) {
    next(err)
  }
}

/** Restricts route to specific roles. Must be used after requireAuth. */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) { next(new UnauthorizedError()); return }
    if (!roles.includes(req.user.role as UserRole)) {
      next(new ForbiddenError(`Required role: ${roles.join(' or ')}`))
      return
    }
    next()
  }
}

export const requireVendor = requireRole(UserRole.VENDOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
export const requireAdmin  = requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN)
