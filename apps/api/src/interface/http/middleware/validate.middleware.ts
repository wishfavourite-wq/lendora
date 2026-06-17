import type { Request, Response, NextFunction } from 'express'
import type { ZodSchema } from 'zod'

/** Validates req.body against a Zod schema and replaces it with the parsed/transformed output */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body)
    if (!result.success) { next(result.error); return }
    req.body = result.data
    next()
  }
}

/** Validates req.query */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query)
    if (!result.success) { next(result.error); return }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(req as any).validatedQuery = result.data
    next()
  }
}

/** Validates req.params */
export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params)
    if (!result.success) { next(result.error); return }
    next()
  }
}
