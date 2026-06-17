import { z } from 'zod'
import { ProductCondition, ProductStatus } from '../enums/rental.enum.js'
import { BDTAmountSchema, PaginationQuerySchema } from './common.schemas.js'

// Base object without refinements — allows .partial() for update schema
const CreateProductBaseSchema = z.object({
  categoryId:         z.string().cuid(),
  name:               z.string().min(4, 'Name must be at least 4 characters').max(120),
  description:        z.string().min(20, 'Description must be at least 20 characters').max(2000),
  pricePerDay:        BDTAmountSchema.min(50, 'Minimum price is ৳50/day'),
  pricePerWeek:       BDTAmountSchema.optional(),
  pricePerMonth:      BDTAmountSchema.optional(),
  depositAmount:      BDTAmountSchema,
  condition:          z.nativeEnum(ProductCondition),
  brand:              z.string().max(80).optional(),
  model:              z.string().max(80).optional(),
  district:           z.string().min(2).max(60),
  division:           z.string().min(2).max(60),
  address:            z.string().max(200).optional(),
  minRentalDays:      z.number().int().min(1).default(1),
  maxRentalDays:      z.number().int().min(1).optional(),
  deliveryAvailable:  z.boolean().default(false),
  deliveryFee:        BDTAmountSchema.optional(),
  specifications:     z.record(z.string()).optional(),
  tags:               z.array(z.string().max(30)).max(10).default([]),
  isInstantBooking:   z.boolean().default(false),
})

export const CreateProductSchema = CreateProductBaseSchema
  .refine(
    (d) => !d.deliveryAvailable || d.deliveryFee !== undefined,
    { message: 'Delivery fee is required when delivery is available', path: ['deliveryFee'] }
  )
  .refine(
    (d) => !d.pricePerWeek || d.pricePerWeek < d.pricePerDay * 7,
    { message: 'Weekly price should be less than 7× the daily price', path: ['pricePerWeek'] }
  )

// .partial() must be called on the ZodObject, before refinements are added
export const UpdateProductSchema = CreateProductBaseSchema.partial().extend({
  status: z.nativeEnum(ProductStatus).optional(),
})

export const ProductSearchSchema = PaginationQuerySchema.extend({
  query:          z.string().max(120).optional(),
  categoryId:     z.string().cuid().optional(),
  categorySlug:   z.string().optional(),
  district:       z.string().optional(),
  division:       z.string().optional(),
  minPrice:       z.coerce.number().nonnegative().optional(),
  maxPrice:       z.coerce.number().nonnegative().optional(),
  minRating:      z.coerce.number().min(1).max(5).optional(),
  condition:      z.array(z.nativeEnum(ProductCondition)).optional(),
  deliveryOnly:   z.coerce.boolean().optional(),
  instantBooking: z.coerce.boolean().optional(),
  availableFrom:  z.coerce.date().optional(),
  availableUntil: z.coerce.date().optional(),
}).refine(
  (d) => !d.minPrice || !d.maxPrice || d.maxPrice >= d.minPrice,
  { message: 'maxPrice must be ≥ minPrice', path: ['maxPrice'] }
)

export type CreateProductInput = z.infer<typeof CreateProductSchema>
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>
export type ProductSearchInput = z.infer<typeof ProductSearchSchema>
