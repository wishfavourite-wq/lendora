import { z } from 'zod'
import { BDPhoneSchema } from './common.schemas.js'

export const RegisterSchema = z.object({
  name:     z.string().min(2, 'Name must be at least 2 characters').max(80),
  email:    z.string().email('Invalid email address').toLowerCase(),
  phone:    BDPhoneSchema.optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
  role:     z.enum(['RENTER', 'VENDOR']).default('RENTER').optional(),
})

export const LoginSchema = z.object({
  email:    z.string().email().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
})

export const ForgotPasswordSchema = z.object({
  email: z.string().email().toLowerCase(),
})

export const ResetPasswordSchema = z
  .object({
    token:           z.string().min(1),
    password:        RegisterSchema.shape.password,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path:    ['confirmPassword'],
  })

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword:     RegisterSchema.shape.password,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path:    ['confirmPassword'],
  })

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
})

export const VerifyEmailSchema = z.object({
  token: z.string().min(1),
})

export type RegisterInput       = z.infer<typeof RegisterSchema>
export type LoginInput          = z.infer<typeof LoginSchema>
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>
export type ResetPasswordInput  = z.infer<typeof ResetPasswordSchema>
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>
