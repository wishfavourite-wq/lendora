import { z } from 'zod'
import { BDPhoneSchema, BDTAmountSchema } from './common.schemas.js'
import { VerificationDocumentType } from '../enums/user.enum.js'

export const CreateVendorProfileSchema = z.object({
  businessName:          z.string().min(3).max(120),
  businessDescription:   z.string().min(20).max(1000).optional(),
  businessAddress:       z.string().min(10).max(300),
  district:              z.string().min(2).max(60),
  division:              z.string().min(2).max(60),
  bkashNumber:           BDPhoneSchema.optional(),
  nagadNumber:           BDPhoneSchema.optional(),
  bankAccountName:       z.string().max(120).optional(),
  bankAccountNumber:     z.string().regex(/^\d{9,17}$/, 'Invalid bank account number').optional(),
  bankName:              z.string().max(80).optional(),
})

export const UpdateVendorProfileSchema = CreateVendorProfileSchema.partial()

export const SubmitVerificationSchema = z.object({
  documentType:   z.nativeEnum(VerificationDocumentType),
  documentNumber: z.string().min(4).max(20),
})

export const VendorPayoutRequestSchema = z.object({
  amount: BDTAmountSchema.min(500, 'Minimum payout is ৳500'),
  method: z.enum(['BKASH', 'NAGAD', 'BANK']),
})

export const UpdateVendorAvailabilitySchema = z.object({
  availableFrom:  z.coerce.date().optional(),
  availableUntil: z.coerce.date().optional(),
  blockedDates:   z.array(z.coerce.date()).max(365).default([]),
})

export const SendMessageSchema = z.object({
  rentalId:      z.string().cuid(),
  body:          z.string().min(1).max(1000),
  attachmentUrl: z.string().url().optional(),
})

export type CreateVendorProfileInput    = z.infer<typeof CreateVendorProfileSchema>
export type UpdateVendorProfileInput    = z.infer<typeof UpdateVendorProfileSchema>
export type SubmitVerificationInput     = z.infer<typeof SubmitVerificationSchema>
export type VendorPayoutRequestInput    = z.infer<typeof VendorPayoutRequestSchema>
