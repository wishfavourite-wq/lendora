'use client'
import { useState, Suspense }  from 'react'
import Link                    from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm }             from 'react-hook-form'
import { zodResolver }         from '@hookform/resolvers/zod'
import { z }                   from 'zod'
import { Loader2, AlertCircle, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react'
import { api }                 from '@/lib/api'
import { cn }                  from '@/lib/utils'

const schema = z.object({
  password: z
    .string()
    .min(8, 'Minimum 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})
type FormData = z.infer<typeof schema>

function PasswordRule({ met, label }: { met: boolean; label: string }) {
  return (
    <div className={cn('flex items-center gap-1.5 text-xs', met ? 'text-green-600' : 'text-ink-400')}>
      {met ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
      {label}
    </div>
  )
}

function ResetPasswordForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const token        = searchParams.get('token') ?? ''

  const [showPw,      setShowPw]      = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [done,        setDone]        = useState(false)
  const [apiError,    setApiError]    = useState<string | null>(null)

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const pw = watch('password') ?? ''

  const onSubmit = async (data: FormData) => {
    setApiError(null)
    if (!token) {
      setApiError('Reset link is invalid or missing. Please request a new one.')
      return
    }
    try {
      await api.post('/auth/reset-password', { token, password: data.password })
      setDone(true)
      setTimeout(() => router.push('/login'), 3000)
    } catch (err: any) {
      const code = err.response?.data?.error?.code
      if (code === 'INVALID_RESET_TOKEN') {
        setApiError('This reset link has expired or already been used. Please request a new one.')
      } else {
        setApiError(err.response?.data?.error?.message ?? 'Something went wrong. Please try again.')
      }
    }
  }

  if (!token) {
    return (
      <div className="text-center space-y-3">
        <XCircle size={40} className="text-red-400 mx-auto" />
        <h2 className="font-fraunces text-xl font-bold text-ink-900">Invalid reset link</h2>
        <p className="text-sm text-ink-500">This link is missing a token. Please request a new password reset.</p>
        <Link href="/forgot-password" className="inline-block mt-2 text-sm font-medium text-copper hover:underline">
          Request new link
        </Link>
      </div>
    )
  }

  if (done) {
    return (
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-green-50 border border-green-200 flex items-center justify-center">
            <CheckCircle2 size={32} className="text-green-500" />
          </div>
        </div>
        <div>
          <h2 className="font-fraunces text-xl font-bold text-ink-900">Password updated!</h2>
          <p className="text-sm text-ink-500 mt-2">Your password has been changed. Redirecting to sign in…</p>
        </div>
        <Link href="/login" className="inline-block text-sm font-medium text-copper hover:underline">
          Sign in now
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div>
        <h2 className="font-fraunces text-xl font-bold text-ink-900">Set a new password</h2>
        <p className="text-sm text-ink-500 mt-1">Choose a strong password for your account.</p>
      </div>

      {apiError && (
        <div role="alert" className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <div>
            <span>{apiError}</span>
            {apiError.includes('expired') && (
              <div className="mt-1">
                <Link href="/forgot-password" className="text-copper hover:underline font-medium text-xs">
                  Request a new reset link →
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* New password */}
      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-medium text-ink-700">New password</label>
        <div className="relative">
          <input
            id="password"
            type={showPw ? 'text' : 'password'}
            autoComplete="new-password"
            {...register('password')}
            className={cn(
              'w-full px-4 py-2.5 pr-10 rounded-lg border text-sm outline-none transition',
              'focus:ring-2 focus:ring-copper/30 focus:border-copper',
              errors.password ? 'border-red-400 bg-red-50' : 'border-ink-200 bg-white',
            )}
          />
          <button type="button" onClick={() => setShowPw((p) => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
            aria-label={showPw ? 'Hide password' : 'Show password'}>
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {/* Inline rules */}
        {pw && (
          <div className="pt-1 space-y-1">
            <PasswordRule met={pw.length >= 8}       label="At least 8 characters" />
            <PasswordRule met={/[A-Z]/.test(pw)}     label="One uppercase letter" />
            <PasswordRule met={/[0-9]/.test(pw)}     label="One number" />
          </div>
        )}

        {errors.password && (
          <p className="flex items-center gap-1 text-xs text-red-600">
            <AlertCircle size={12} className="flex-shrink-0" />{errors.password.message}
          </p>
        )}
      </div>

      {/* Confirm password */}
      <div className="space-y-1.5">
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-ink-700">Confirm new password</label>
        <div className="relative">
          <input
            id="confirmPassword"
            type={showConfirm ? 'text' : 'password'}
            autoComplete="new-password"
            {...register('confirmPassword')}
            className={cn(
              'w-full px-4 py-2.5 pr-10 rounded-lg border text-sm outline-none transition',
              'focus:ring-2 focus:ring-copper/30 focus:border-copper',
              errors.confirmPassword ? 'border-red-400 bg-red-50' : 'border-ink-200 bg-white',
            )}
          />
          <button type="button" onClick={() => setShowConfirm((p) => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
            aria-label={showConfirm ? 'Hide password' : 'Show password'}>
            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="flex items-center gap-1 text-xs text-red-600">
            <AlertCircle size={12} className="flex-shrink-0" />{errors.confirmPassword.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-copper text-white font-medium rounded-lg hover:bg-copper/90 disabled:opacity-60 transition text-sm"
      >
        {isSubmitting && <Loader2 size={16} className="animate-spin" />}
        Update password
      </button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-50 px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="font-fraunces text-3xl font-bold text-forest tracking-tight">LENDORA</span>
          </Link>
          <p className="mt-2 text-ink-500 text-sm">Reset your password</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-ink-100 p-8">
          <Suspense fallback={<div className="h-40 flex items-center justify-center"><Loader2 size={24} className="animate-spin text-copper" /></div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>

        <p className="text-center mt-6 text-sm">
          <Link href="/login" className="text-copper font-medium hover:underline">
            ← Back
          </Link>
        </p>
      </div>
    </div>
  )
}
