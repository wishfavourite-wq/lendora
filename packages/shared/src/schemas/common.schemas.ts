import { z } from 'zod'

/** Reusable Zod primitives */

export const BDPhoneSchema = z
  .string()
  .regex(/^(\+880|880|0)1[3-9]\d{8}$/, 'Invalid Bangladeshi phone number')

export const BDTAmountSchema = z
  .number()
  .int('Amount must be a whole number (BDT paisa not supported)')
  .nonnegative('Amount cannot be negative')

export const SlugSchema = z
  .string()
  .min(2)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens')

export const DateStringSchema = z
  .string()
  .datetime({ offset: true, message: 'Must be an ISO 8601 date-time string' })
  .transform((s) => new Date(s))

export const PaginationQuerySchema = z.object({
  page:     z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy:   z.string().optional(),
  sortDir:  z.enum(['asc', 'desc']).default('desc'),
})

export const DateRangeSchema = z
  .object({
    startDate: DateStringSchema,
    endDate:   DateStringSchema,
  })
  .refine((r) => r.endDate > r.startDate, {
    message: 'End date must be after start date',
    path:    ['endDate'],
  })

export const FileUploadSchema = z.object({
  fieldname:    z.string(),
  originalname: z.string(),
  mimetype:     z.string(),
  size:         z.number().max(10 * 1024 * 1024, 'File must be under 10 MB'),
  path:         z.string(),
})

export type PaginationQueryInput = z.input<typeof PaginationQuerySchema>
export type PaginationQuery      = z.output<typeof PaginationQuerySchema>
