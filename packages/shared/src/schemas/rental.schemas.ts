import { z } from 'zod'
import { CancellationReason, ReturnCondition } from '../enums/rental.enum.js'
import { PaymentMethod } from '../enums/payment.enum.js'
import { DisputeType } from '../enums/dispute.enum.js'
import { BDTAmountSchema } from './common.schemas.js'

export const CreateRentalSchema = z
  .object({
    productId:       z.string().cuid(),
    startDate:       z.coerce.date(),
    endDate:         z.coerce.date(),
    paymentMethod:   z.nativeEnum(PaymentMethod),
    deliveryAddress: z.string().max(300).optional(),
    pickupAddress:   z.string().max(300).optional(),
    renterNotes:     z.string().max(500).optional(),
  })
  .refine((d) => d.endDate > d.startDate, {
    message: 'End date must be after start date',
    path:    ['endDate'],
  })
  .refine((d) => d.startDate >= new Date(new Date().setHours(0, 0, 0, 0)), {
    message: 'Start date cannot be in the past',
    path:    ['startDate'],
  })

export const CancelRentalSchema = z.object({
  reason: z.nativeEnum(CancellationReason),
  note:   z.string().max(500).optional(),
})

export const InitiateReturnSchema = z.object({
  condition:           z.nativeEnum(ReturnCondition),
  damageDescription:   z.string().max(1000).optional(),
  damageAmount:        BDTAmountSchema.optional(),
})

export const ConfirmReturnSchema = z.object({
  condition:           z.nativeEnum(ReturnCondition),
  agreed:              z.literal(true, { message: 'Vendor must confirm return' }),
  damageDeduction:     BDTAmountSchema.optional(),
})

export const CreateReviewSchema = z.object({
  rentalId: z.string().cuid(),
  rating:   z.number().int().min(1).max(5),
  title:    z.string().max(100).optional(),
  body:     z.string().min(10, 'Review must be at least 10 characters').max(1000),
})

export const VendorReplySchema = z.object({
  reply: z.string().min(5).max(500),
})

export const CreateDisputeSchema = z.object({
  rentalId:    z.string().cuid(),
  type:        z.nativeEnum(DisputeType),
  subject:     z.string().min(5).max(120),
  description: z.string().min(20).max(2000),
})

export const ResolveDisputeSchema = z.object({
  resolution:       z.enum(['FULL_DEPOSIT_RETURNED', 'PARTIAL_DEPOSIT_RETURNED', 'DEPOSIT_FORFEITED', 'MUTUAL_AGREEMENT', 'NO_ACTION']),
  depositDeduction: BDTAmountSchema.optional(),
  note:             z.string().min(5).max(1000),
})

export type CreateRentalInput  = z.infer<typeof CreateRentalSchema>
export type CancelRentalInput  = z.infer<typeof CancelRentalSchema>
export type InitiateReturnInput = z.infer<typeof InitiateReturnSchema>
export type ConfirmReturnInput  = z.infer<typeof ConfirmReturnSchema>
export type CreateReviewInput   = z.infer<typeof CreateReviewSchema>
export type CreateDisputeInput  = z.infer<typeof CreateDisputeSchema>
export type ResolveDisputeInput = z.infer<typeof ResolveDisputeSchema>
