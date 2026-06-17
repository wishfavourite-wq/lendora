'use client'
import { useState }          from 'react'
import Link                  from 'next/link'
import { useForm }           from 'react-hook-form'
import { zodResolver }       from '@hookform/resolvers/zod'
import { z }                 from 'zod'
import { Loader2, AlertCircle, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { api }               from '@/lib/api'
import { cn }                from '@/lib/utils'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
})
type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [sent,     setSent]     = useState(false)
  const [sentTo,   setSentTo]   = useState('')
  const [apiError, setApiError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setApiError(null)
    try {
      await api.post('/auth/forgot-password', { email: data.email })
      setSentTo(data.email)
      setSent(true)
    } catch (err: any) {
      setApiError(err.response?.data?.error?.message ?? 'Something went wrong. Please try again.')
    }
  }

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

          {sent ? (
            /* ── Success state ── */
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-green-50 border border-green-200 flex items-center justify-center">
                  <CheckCircle2 size={32} className="text-green-500" />
                </div>
              </div>
              <div>
                <h2 className="font-fraunces text-xl font-bold text-ink-900">Check your inbox</h2>
                <p className="text-sm text-ink-500 mt-2">
                  We sent a password reset link to{' '}
                  <span className="font-medium text-ink-800">{sentTo}</span>.
                  It expires in 1 hour.
                </p>
              </div>
              <p className="text-xs text-ink-400">
                Didn&apos;t receive it? Check your spam folder, or{' '}
                <button
                  onClick={() => setSent(false)}
                  className="text-copper hover:underline font-medium"
                >
                  try again
                </button>
                .
              </p>
            </div>
          ) : (
            /* ── Request form ── */
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
              <div>
                <h2 className="font-fraunces text-xl font-bold text-ink-900">Forgot your password?</h2>
                <p className="text-sm text-ink-500 mt-1">
                  Enter your account email and we&apos;ll send you a reset link.
                </p>
              </div>

              {apiError && (
                <div role="alert" className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{apiError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-medium text-ink-700">
                  Email address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    {...register('email')}
                    className={cn(
                      'w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm outline-none transition',
                      'focus:ring-2 focus:ring-copper/30 focus:border-copper',
                      errors.email ? 'border-red-400 bg-red-50' : 'border-ink-200 bg-white',
                    )}
                  />
                </div>
                {errors.email && (
                  <p className="flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle size={12} className="flex-shrink-0" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-copper text-white font-medium rounded-lg hover:bg-copper/90 disabled:opacity-60 transition text-sm"
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                Send reset link
              </button>
            </form>
          )}
        </div>

        <p className="text-center mt-6 text-sm text-ink-500">
          <Link href="/login" className="flex items-center justify-center gap-1.5 text-copper font-medium hover:underline">
            <ArrowLeft size={14} />
            Back
          </Link>
        </p>
      </div>
    </div>
  )
}
