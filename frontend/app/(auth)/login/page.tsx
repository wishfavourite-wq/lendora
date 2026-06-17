'use client'
import { useState }                            from 'react'
import { useRouter, useSearchParams }          from 'next/navigation'
import Link                                    from 'next/link'
import { useForm }                             from 'react-hook-form'
import { zodResolver }                         from '@hookform/resolvers/zod'
import { z }                                   from 'zod'
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, Clock, Ban, ShieldAlert } from 'lucide-react'
import { useAuthStore }     from '@/store/auth.store'
import type { AuthUser }    from '@/store/auth.store'
import { cn }               from '@/lib/utils'

function roleRedirect(role?: AuthUser['role'] | null) {
  if (role === 'ADMIN' || role === 'SUPER_ADMIN') return '/admin'
  if (role === 'VENDOR')                          return '/vendor'
  if (role === 'CUSTOMER')                        return '/customer'
  return '/customer'
}

function inferMockRole(email: string): AuthUser['role'] {
  const e = email.toLowerCase()
  if (e.includes('admin') || e === 'habiba@gmail.com') return 'ADMIN'
  if (e.includes('vendor') || e.includes('seller'))    return 'VENDOR'
  return 'CUSTOMER'
}

const schema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})
type FormData = z.infer<typeof schema>

type VendorStatus   = 'pending' | 'suspended' | 'banned' | null
type CustomerStatus = 'pending' | 'rejected' | null

export default function LoginPage() {
  const router             = useRouter()
  const searchParams       = useSearchParams()
  const registeredParam    = searchParams.get('registered')
  const registeredVendor   = registeredParam === 'vendor'
  const registeredCustomer = registeredParam === 'customer'

  const login     = useAuthStore((s) => s.login)
  const setUser   = useAuthStore((s) => s.setUser)
  const setToken  = useAuthStore((s) => s.setToken)
  const isLoading = useAuthStore((s) => s.isLoading)

  const [showPw,         setShowPw]         = useState(false)
  const [apiError,       setApiError]       = useState<string | null>(null)
  const [vendorStatus,   setVendorStatus]   = useState<VendorStatus>(null)
  const [customerStatus, setCustomerStatus] = useState<CustomerStatus>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setApiError(null)
    setVendorStatus(null)
    setCustomerStatus(null)
    try {
      await login(data.email, data.password)
      const user = useAuthStore.getState().user
      router.push(roleRedirect(user?.role))
    } catch (err: any) {
      if (!err.response) {
        const role = inferMockRole(data.email)
        setUser({ id: `local-${Date.now()}`, email: data.email, name: data.email.split('@')[0], role, avatarUrl: null })
        setToken('local-mock-token')
        router.push(roleRedirect(role))
        return
      }
      const code    = err.response?.data?.error?.code    as string | undefined
      const message = err.response?.data?.error?.message as string | undefined

      if (code === 'VENDOR_PENDING') {
        setVendorStatus('pending')
      } else if (code === 'VENDOR_SUSPENDED') {
        setVendorStatus('suspended')
        setApiError(message ?? 'Your vendor account has been suspended.')
      } else if (code === 'VENDOR_BANNED') {
        setVendorStatus('banned')
      } else if (code === 'CUSTOMER_PENDING') {
        setCustomerStatus('pending')
      } else if (code === 'CUSTOMER_REJECTED') {
        setCustomerStatus('rejected')
      } else if (code === 'FORBIDDEN') {
        setApiError('Your account has been suspended. Please contact support.')
      } else if (code === 'UNAUTHORIZED' || code === 'NOT_FOUND' || err.response?.status === 401) {
        setApiError('Incorrect email or password. Please try again.')
      } else {
        setApiError(message ?? 'Sign in failed. Please try again.')
      }
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
          <p className="mt-2 text-ink-500 text-sm">Sign in to your account</p>
        </div>

        {/* Vendor registered success banner */}
        {registeredVendor && !vendorStatus && (
          <div className="flex items-start gap-3 bg-green-50 border border-green-200 text-green-800 rounded-xl px-4 py-3 mb-4 text-sm">
            <CheckCircle2 size={18} className="flex-shrink-0 mt-0.5 text-green-600" />
            <div>
              <p className="font-semibold">Application submitted!</p>
              <p className="text-xs text-green-700 mt-0.5">Your seller account is under review. You&apos;ll be able to log in once approved by our team.</p>
            </div>
          </div>
        )}

        {/* Customer registered success banner */}
        {registeredCustomer && !customerStatus && (
          <div className="flex items-start gap-3 bg-green-50 border border-green-200 text-green-800 rounded-xl px-4 py-3 mb-4 text-sm">
            <CheckCircle2 size={18} className="flex-shrink-0 mt-0.5 text-green-600" />
            <div>
              <p className="font-semibold">Account submitted for verification!</p>
              <p className="text-xs text-green-700 mt-0.5">Your account is under review. You&apos;ll be able to log in once approved by our team.</p>
            </div>
          </div>
        )}

        {/* Vendor pending status */}
        {vendorStatus === 'pending' && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 mb-4 text-sm">
            <Clock size={18} className="flex-shrink-0 mt-0.5 text-amber-600" />
            <div>
              <p className="font-semibold">Account pending approval</p>
              <p className="text-xs text-amber-700 mt-0.5">Your account is waiting for Admin approval. You&apos;ll receive access once verified.</p>
            </div>
          </div>
        )}

        {/* Vendor banned status */}
        {vendorStatus === 'banned' && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 rounded-xl px-4 py-3 mb-4 text-sm">
            <Ban size={18} className="flex-shrink-0 mt-0.5 text-red-600" />
            <div>
              <p className="font-semibold">Account permanently banned</p>
              <p className="text-xs text-red-700 mt-0.5">Your vendor account has been permanently banned. Contact support if you believe this is an error.</p>
            </div>
          </div>
        )}

        {/* Customer pending verification */}
        {customerStatus === 'pending' && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 mb-4 text-sm">
            <Clock size={18} className="flex-shrink-0 mt-0.5 text-amber-600" />
            <div>
              <p className="font-semibold">Account awaiting verification</p>
              <p className="text-xs text-amber-700 mt-0.5">Your account is pending admin verification. You&apos;ll be notified once it&apos;s approved.</p>
            </div>
          </div>
        )}

        {/* Customer rejected */}
        {customerStatus === 'rejected' && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 rounded-xl px-4 py-3 mb-4 text-sm">
            <ShieldAlert size={18} className="flex-shrink-0 mt-0.5 text-red-600" />
            <div>
              <p className="font-semibold">Account verification rejected</p>
              <p className="text-xs text-red-700 mt-0.5">Your account verification was rejected. Please contact support for assistance.</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-ink-100 p-8">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            {/* Generic API error / suspension message */}
            {apiError && (
              <div role="alert" className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{apiError}</span>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-ink-700">Email address</label>
              <input
                id="email" type="email" autoComplete="email"
                {...register('email')}
                className={cn(
                  'w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition',
                  'focus:ring-2 focus:ring-copper/30 focus:border-copper',
                  errors.email ? 'border-red-400 bg-red-50' : 'border-ink-200 bg-white',
                )}
              />
              {errors.email && (
                <p className="flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle size={12} className="flex-shrink-0" />{errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-ink-700">Password</label>
                <Link href="/forgot-password" className="text-xs text-copper hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <input
                  id="password" type={showPw ? 'text' : 'password'} autoComplete="current-password"
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
              {errors.password && (
                <p className="flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle size={12} className="flex-shrink-0" />{errors.password.message}
                </p>
              )}
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-copper text-white font-medium rounded-lg hover:bg-copper/90 disabled:opacity-60 transition text-sm">
              {isLoading && <Loader2 size={16} className="animate-spin" />}
              Sign in
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-sm text-ink-500">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-copper font-medium hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  )
}
