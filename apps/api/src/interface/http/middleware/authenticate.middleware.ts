import type { Request, Response, NextFunction } from 'express'
import type { UserRole } from '@lendora/shared'
import { getContainer }  from '@/infrastructure/container/container.js'
import { DomainError }   from '@/domain/errors/index.js'

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string
        role:   UserRole
        email:  string
      }
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return next(new DomainError('UNAUTHORIZED', 'Missing or malformed authorization header', 401))
  }

  const token     = header.slice(7)
  const container = getContainer()

  container.tokenService.verifyAccessToken(token)
    .then((payload) => {
      if (!payload) return next(new DomainError('UNAUTHORIZED', 'Invalid or expired access token', 401))
      req.user = { userId: payload.sub, role: payload.role, email: payload.email }
      next()
    })
    .catch((err: unknown) => {
      const name = err instanceof Error ? err.name : ''
      if (name === 'TokenExpiredError' || name === 'JsonWebTokenError' || name === 'NotBeforeError') {
        return next(new DomainError('UNAUTHORIZED', 'Access token expired or invalid', 401))
      }
      next(err)
    })
}

export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(new DomainError('UNAUTHORIZED', 'Not authenticated', 401))
    if (!roles.includes(req.user.role)) {
      return next(new DomainError('FORBIDDEN', 'Insufficient permissions', 403))
    }
    next()
  }
}
