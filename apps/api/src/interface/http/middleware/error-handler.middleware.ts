import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express'
import { ZodError } from 'zod'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library.js'
import { DomainError } from '@/domain/errors/domain.error.js'
import { type ApiErrorResponse, HTTP_STATUS } from '@lendora/shared'
import { logger } from '@/infrastructure/logger/logger.js'

/**
 * Central error handler — converts every error type to a consistent ApiErrorResponse.
 * Must be registered LAST in the Express middleware chain.
 */
export const errorHandler: ErrorRequestHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const requestId = req.headers['x-request-id'] as string | undefined

  // ── Domain errors (intentional, expected) ─────────────────────────────────
  if (err instanceof DomainError) {
    const body: ApiErrorResponse = {
      success: false,
      error: { code: err.code, message: err.message, field: err.field },
      requestId,
    }
    res.status(err.statusHint).json(body)
    return
  }

  // ── Zod validation errors ─────────────────────────────────────────────────
  if (err instanceof ZodError) {
    const details: Record<string, string[]> = {}
    for (const issue of err.issues) {
      const field = issue.path.join('.')
      details[field] = [...(details[field] ?? []), issue.message]
    }
    const body: ApiErrorResponse = {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details },
      requestId,
    }
    res.status(HTTP_STATUS.UNPROCESSABLE).json(body)
    return
  }

  // ── Prisma known errors ───────────────────────────────────────────────────
  if (err instanceof PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const raw    = err.meta?.target
      const target = Array.isArray(raw)
        ? raw.join(', ')
        : typeof raw === 'string'
          ? raw.replace(/_key$/i, '').replace(/^[^_]+_/, '')
          : 'field'
      const body: ApiErrorResponse = {
        success: false,
        error: { code: 'CONFLICT', message: `${target} is already in use` },
        requestId,
      }
      res.status(HTTP_STATUS.CONFLICT).json(body)
      return
    }
    logger.error('Prisma error', { code: err.code, meta: err.meta, path: req.path, requestId })
    const body: ApiErrorResponse = {
      success: false,
      error: { code: 'DATABASE_ERROR', message: 'A database error occurred' },
      requestId,
    }
    res.status(HTTP_STATUS.INTERNAL_ERROR).json(body)
    return
  }

  // ── Unhandled errors (system failures) ────────────────────────────────────
  const message = err instanceof Error ? err.message : String(err)
  logger.error('Unhandled error', { message, stack: err instanceof Error ? err.stack : undefined, path: req.path, method: req.method, requestId })
  const body: ApiErrorResponse = {
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    requestId,
  }
  res.status(HTTP_STATUS.INTERNAL_ERROR).json(body)
}
