'use client'
import { useState }                            from 'react'
import { useRouter, useSearchParams }           from 'next/navigation'
import Link                                     from 'next/link'
import { useForm, type SubmitHandler }          from 'react-hook-form'
import { zodResolver }                          from '@hookform/resolvers/zod'
import { z }                                    from 'zod'
import {
  Eye, EyeOff, Loader2, AlertCircle, CheckCircle2,
  User, CreditCard, Store,
  ChevronRight, ChevronLeft, Camera,
} from 'lucide-react'
import { cn }   from '@/lib/utils'
import { api }  from '@/lib/api'

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────

const DHAKA_AREAS = [
  'Mirpur', 'Uttara', 'Gulshan', 'Banani', 'Dhanmondi',
  'Mohammadpur', 'Motijheel', 'Tejgaon', 'Badda', 'Rampura',
  'Khilgaon', 'Lalbagh', 'Hazaribagh', 'Wari', 'Sutrapur',
  'Pallabi', 'Kafrul', 'Cantonment', 'Demra', 'Jatrabari',
  'Savar', 'Ashulia', 'Keraniganj', 'Gazipur', 'Tongi',
  'Narayanganj', 'Rupganj',
]

function FieldWrapper({ id, label, required, error, hint, children }: {
  id: string; label: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-ink-700">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-ink-400">{hint}</p>}
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-600">
          <AlertCircle size={12} className="flex-shrink-0" />{error}
        </p>
      )}
    </div>
  )
}

function inputCls(hasError: boolean) {
  return cn(
    'w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition',
    'focus:ring-2 focus:ring-copper/30 focus:border-copper',
    hasError ? 'border-red-400 bg-red-50' : 'border-ink-200 bg-white',
  )
}

function PhoneInput({ id, register, error, placeholder = '01XXXXXXXXX' }: {
  id: string; register: any; error?: string; placeholder?: string
}) {
  return (
    <div className="flex">
      <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-ink-200 bg-ink-50 text-sm text-ink-500 select-none whitespace-nowrap">
        BD +880
      </span>
      <input id={id} type="tel" placeholder={placeholder} {...register}
        className={cn('flex-1 min-w-0 px-4 py-2.5 rounded-r-lg border text-sm outline-none transition',
          'focus:ring-2 focus:ring-copper/30 focus:border-copper',
          error ? 'border-red-400 bg-red-50' : 'border-ink-200 bg-white')} />
    </div>
  )
}

function StepBar({ steps, current }: { steps: { label: string; icon: React.ElementType }[]; current: number }) {
  return (
    <div className="flex items-center justify-between mb-8 px-2">
      {steps.map((s, i) => {
        const Icon = s.icon
        const done   = current > i + 1
        const active = current === i + 1
        return (
          <div key={s.label} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1">
              <div className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center transition-all',
                done   ? 'bg-forest text-white' :
                active ? 'bg-copper text-white ring-4 ring-copper/20' :
                         'bg-ink-100 text-ink-400',
              )}>
                {done ? <CheckCircle2 size={18} /> : <Icon size={16} />}
              </div>
              <span className={cn('text-[10px] font-medium hidden sm:block',
                active ? 'text-copper' : done ? 'text-forest' : 'text-ink-400')}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn('flex-1 h-0.5 mx-2 rounded transition-all', current > i + 1 ? 'bg-forest' : 'bg-ink-200')} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER REGISTRATION — 2-step form
// ─────────────────────────────────────────────────────────────────────────────

const CUSTOMER_STEPS = [
  { label: 'Personal', icon: User },
  { label: 'Payment',  icon: CreditCard },
]

const cStep1Schema = z.object({
  name:     z.string().min(2, 'Name must be at least 2 characters'),
  email:    z.string().email('Enter a valid email address'),
  phone:    z.string().regex(/^01[3-9]\d{8}$/, 'Enter a valid BD number e.g. 01XXXXXXXXX'),
  password: z.string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Must include an uppercase letter')
    .regex(/[0-9]/, 'Must include a number')
    .regex(/[^A-Za-z0-9]/, 'Must include a special character'),
  address:  z.string().min(5, 'Enter your full address').max(300),
})

const cStep2Schema = z.object({
  bkashNumber: z.string().regex(/^01[3-9]\d{8}$/, 'Enter a valid bKash number e.g. 01XXXXXXXXX').optional().or(z.literal('')),
})

type CStep1 = z.infer<typeof cStep1Schema>
type CStep2 = z.infer<typeof cStep2Schema>

function CustomerRegisterForm({ onSwitchToVendor }: { onSwitchToVendor: () => void }) {
  const router = useRouter()
  const [step, setStep]         = useState(1)
  const [submitting, setSubmit] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [showPw, setShowPw]     = useState(false)
  const [step1Data, setStep1Data] = useState<Partial<CStep1>>({})
  const [profileFile, setProfileFile] = useState<File | null>(null)

  const form1 = useForm<CStep1>({ resolver: zodResolver(cStep1Schema), defaultValues: step1Data as CStep1 })
  const form2 = useForm<CStep2>({ resolver: zodResolver(cStep2Schema) })

  const handleStep1: SubmitHandler<CStep1> = (data) => { setStep1Data(data); setStep(2) }

  const handleStep2: SubmitHandler<CStep2> = async (data) => {
    setApiError(null); setSubmit(true)
    try {
      const fd = new FormData()
      fd.append('name',     step1Data.name     ?? '')
      fd.append('email',    step1Data.email    ?? '')
      fd.append('phone',    `+880${(step1Data.phone ?? '').replace(/^0/, '')}`)
      fd.append('password', step1Data.password ?? '')
      fd.append('address',  step1Data.address  ?? '')
      if (profileFile) fd.append('profilePicture', profileFile)
      if (data.bkashNumber) fd.append('bkashNumber', `+880${data.bkashNumber.replace(/^0/, '')}`)

      await api.post('/auth/register/customer', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      router.push('/login?registered=customer')
    } catch (err: any) {
      const msg = err.response?.data?.error?.message ?? err.response?.data?.error?.details ?? 'Registration failed. Please try again.'
      setApiError(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setSubmit(false)
    }
  }

  return (
    <>
      {/* Role toggle */}
      <div className="flex rounded-lg border border-ink-200 p-1 mb-6">
        <button type="button"
          className="flex-1 text-center py-2 rounded-md text-sm font-medium bg-copper text-white shadow-sm transition">
          Customer / Renter
        </button>
        <button type="button" onClick={onSwitchToVendor}
          className="flex-1 text-center py-2 rounded-md text-sm font-medium text-ink-500 hover:text-ink-700 transition">
          Seller / Vendor
        </button>
      </div>

      <StepBar steps={CUSTOMER_STEPS} current={step} />

      {apiError && (
        <div role="alert" className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" /><span>{apiError}</span>
        </div>
      )}

      {/* ── STEP 1: Personal Info ── */}
      {step === 1 && (
        <form onSubmit={form1.handleSubmit(handleStep1)} noValidate className="space-y-4">
          <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-4">Personal Information</p>

          {/* Profile Picture */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-ink-700">
              Profile Picture <span className="text-ink-400 text-xs">(optional)</span>
            </label>
            <label className="flex items-center gap-4 cursor-pointer">
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-ink-300 hover:border-copper transition overflow-hidden flex items-center justify-center bg-ink-50">
                {profileFile
                  ? <img src={URL.createObjectURL(profileFile)} alt="profile" className="w-full h-full object-cover" />
                  : <Camera size={20} className="text-ink-300" />}
              </div>
              <div>
                <p className="text-sm font-medium text-copper hover:underline">Upload photo</p>
                <p className="text-xs text-ink-400">JPG, PNG or WebP, max 10 MB</p>
              </div>
              <input type="file" accept="image/*" className="sr-only"
                onChange={(e) => { const f = e.target.files?.[0] ?? null; setProfileFile(f) }} />
            </label>
          </div>

          <FieldWrapper id="c-name" label="Full Name" required error={form1.formState.errors.name?.message}>
            <input id="c-name" type="text" autoComplete="name" placeholder="Your full name"
              {...form1.register('name')} className={inputCls(!!form1.formState.errors.name)} />
          </FieldWrapper>

          <FieldWrapper id="c-email" label="Email Address" required error={form1.formState.errors.email?.message}>
            <input id="c-email" type="email" autoComplete="email" placeholder="you@example.com"
              {...form1.register('email')} className={inputCls(!!form1.formState.errors.email)} />
          </FieldWrapper>

          <FieldWrapper id="c-phone" label="Phone Number" required error={form1.formState.errors.phone?.message}>
            <PhoneInput id="c-phone" register={form1.register('phone')} error={form1.formState.errors.phone?.message} />
          </FieldWrapper>

          <FieldWrapper id="c-address" label="Address" required error={form1.formState.errors.address?.message}>
            <input id="c-address" type="text" placeholder="House/Road, Area, City"
              {...form1.register('address')} className={inputCls(!!form1.formState.errors.address)} />
          </FieldWrapper>

          <FieldWrapper id="c-password" label="Password" required error={form1.formState.errors.password?.message}
            hint="Min 8 chars, 1 uppercase, 1 number, 1 special character">
            <div className="relative">
              <input id="c-password" type={showPw ? 'text' : 'password'} autoComplete="new-password"
                placeholder="Create a strong password"
                {...form1.register('password')} className={cn(inputCls(!!form1.formState.errors.password), 'pr-10')} />
              <button type="button" onClick={() => setShowPw((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
                aria-label={showPw ? 'Hide password' : 'Show password'}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </FieldWrapper>

          <button type="submit"
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-copper text-white font-medium rounded-lg hover:bg-copper/90 transition text-sm mt-2">
            Continue <ChevronRight size={16} />
          </button>
        </form>
      )}

      {/* ── STEP 2: Payment ── */}
      {step === 2 && (
        <form onSubmit={form2.handleSubmit(handleStep2)} noValidate className="space-y-5">
          <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-1">Payment Details</p>
          <p className="text-xs text-ink-500 mb-4">Add your bKash number for deposit refunds and payments.</p>

          <FieldWrapper id="c-bkash" label="bKash Number" error={form2.formState.errors.bkashNumber?.message}
            hint="Used for deposit refunds. You can update it later.">
            <PhoneInput id="c-bkash" register={form2.register('bkashNumber')} error={form2.formState.errors.bkashNumber?.message} />
          </FieldWrapper>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 space-y-1">
            <p className="font-semibold">Almost there!</p>
            <p className="text-xs text-amber-700">After submitting, your account will be reviewed. You&apos;ll be able to log in once approved by our team.</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setStep(1)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-ink-200 text-ink-700 font-medium rounded-lg hover:bg-ink-50 transition text-sm">
              <ChevronLeft size={16} /> Back
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-copper text-white font-semibold rounded-lg hover:bg-copper/90 disabled:opacity-60 transition text-sm">
              {submitting ? <><Loader2 size={16} className="animate-spin" />Submitting…</> : 'Create Account'}
            </button>
          </div>
        </form>
      )}
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// VENDOR REGISTRATION — 3-step form
// ─────────────────────────────────────────────────────────────────────────────

const VENDOR_STEPS = [
  { label: 'Personal', icon: User },
  { label: 'Shop',     icon: Store },
  { label: 'Payment',  icon: CreditCard },
]

const vStep1Schema = z.object({
  name:     z.string().min(2, 'Name must be at least 2 characters'),
  email:    z.string().email('Enter a valid email address'),
  phone:    z.string().regex(/^01[3-9]\d{8}$/, 'Enter a valid BD number e.g. 01XXXXXXXXX'),
  password: z.string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Must include an uppercase letter')
    .regex(/[0-9]/, 'Must include a number')
    .regex(/[^A-Za-z0-9]/, 'Must include a special character'),
  address:  z.string().min(5, 'Enter your full address').max(300),
})

const vStep2Schema = z.object({
  businessName:        z.string().min(2, 'Shop name must be at least 2 characters').max(120),
  businessDescription: z.string().max(2000).optional().or(z.literal('')),
  businessAddress:     z.string().max(300).optional().or(z.literal('')),
  district:            z.string().min(1, 'Select your area'),
})

const vStep3Schema = z.object({
  bkashNumber: z.string().regex(/^01[3-9]\d{8}$/, 'Enter a valid bKash number e.g. 01XXXXXXXXX').optional().or(z.literal('')),
})

type VStep1 = z.infer<typeof vStep1Schema>
type VStep2 = z.infer<typeof vStep2Schema>
type VStep3 = z.infer<typeof vStep3Schema>

function VendorRegisterForm({ onSwitchToCustomer }: { onSwitchToCustomer: () => void }) {
  const router = useRouter()
  const [step, setStep]         = useState(1)
  const [submitting, setSubmit] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [showPw, setShowPw]     = useState(false)
  const [step1Data, setStep1Data] = useState<Partial<VStep1>>({})
  const [step2Data, setStep2Data] = useState<Partial<VStep2>>({})
  const [profileFile, setProfileFile] = useState<File | null>(null)

  const form1 = useForm<VStep1>({ resolver: zodResolver(vStep1Schema), defaultValues: step1Data as VStep1 })
  const form2 = useForm<VStep2>({ resolver: zodResolver(vStep2Schema), defaultValues: step2Data as VStep2 })
  const form3 = useForm<VStep3>({ resolver: zodResolver(vStep3Schema) })

  const handleStep1: SubmitHandler<VStep1> = (data) => { setStep1Data(data); setStep(2) }
  const handleStep2: SubmitHandler<VStep2> = (data) => { setStep2Data(data); setStep(3) }

  const handleStep3: SubmitHandler<VStep3> = async (data) => {
    setApiError(null); setSubmit(true)
    try {
      const fd = new FormData()
      fd.append('name',     step1Data.name     ?? '')
      fd.append('email',    step1Data.email    ?? '')
      fd.append('phone',    `+880${(step1Data.phone ?? '').replace(/^0/, '')}`)
      fd.append('password', step1Data.password ?? '')
      fd.append('address',  step1Data.address  ?? '')
      if (profileFile) fd.append('profilePicture', profileFile)
      fd.append('businessName', step2Data.businessName ?? '')
      if (step2Data.businessDescription?.trim()) fd.append('businessDescription', step2Data.businessDescription)
      if (step2Data.businessAddress?.trim())     fd.append('businessAddress',     step2Data.businessAddress)
      fd.append('division', 'Dhaka')
      fd.append('district', step2Data.district ?? '')
      if (data.bkashNumber) fd.append('bkashNumber', `+880${data.bkashNumber.replace(/^0/, '')}`)

      await api.post('/auth/register/vendor', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      router.push('/login?registered=vendor')
    } catch (err: any) {
      const msg = err.response?.data?.error?.message ?? err.response?.data?.error?.details ?? 'Registration failed. Please try again.'
      setApiError(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setSubmit(false)
    }
  }

  return (
    <>
      {/* Role toggle */}
      <div className="flex rounded-lg border border-ink-200 p-1 mb-6">
        <button type="button" onClick={onSwitchToCustomer}
          className="flex-1 text-center py-2 rounded-md text-sm font-medium text-ink-500 hover:text-ink-700 transition">
          Customer / Renter
        </button>
        <button type="button"
          className="flex-1 text-center py-2 rounded-md text-sm font-medium bg-copper text-white shadow-sm transition">
          Seller / Vendor
        </button>
      </div>

      <StepBar steps={VENDOR_STEPS} current={step} />

      {apiError && (
        <div role="alert" className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" /><span>{apiError}</span>
        </div>
      )}

      {/* ── STEP 1: Personal Info ── */}
      {step === 1 && (
        <form onSubmit={form1.handleSubmit(handleStep1)} noValidate className="space-y-4">
          <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-4">Personal Information</p>

          {/* Profile Picture */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-ink-700">
              Profile Picture <span className="text-ink-400 text-xs">(optional)</span>
            </label>
            <label className="flex items-center gap-4 cursor-pointer">
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-ink-300 hover:border-copper transition overflow-hidden flex items-center justify-center bg-ink-50">
                {profileFile
                  ? <img src={URL.createObjectURL(profileFile)} alt="profile" className="w-full h-full object-cover" />
                  : <Camera size={20} className="text-ink-300" />}
              </div>
              <div>
                <p className="text-sm font-medium text-copper hover:underline">Upload photo</p>
                <p className="text-xs text-ink-400">JPG, PNG or WebP, max 10 MB</p>
              </div>
              <input type="file" accept="image/*" className="sr-only"
                onChange={(e) => { const f = e.target.files?.[0] ?? null; setProfileFile(f) }} />
            </label>
          </div>

          <FieldWrapper id="v-name" label="Full Name" required error={form1.formState.errors.name?.message}>
            <input id="v-name" type="text" autoComplete="name" placeholder="Your full name"
              {...form1.register('name')} className={inputCls(!!form1.formState.errors.name)} />
          </FieldWrapper>

          <FieldWrapper id="v-email" label="Email Address" required error={form1.formState.errors.email?.message}>
            <input id="v-email" type="email" autoComplete="email" placeholder="you@example.com"
              {...form1.register('email')} className={inputCls(!!form1.formState.errors.email)} />
          </FieldWrapper>

          <FieldWrapper id="v-phone" label="Phone Number" required error={form1.formState.errors.phone?.message}>
            <PhoneInput id="v-phone" register={form1.register('phone')} error={form1.formState.errors.phone?.message} />
          </FieldWrapper>

          <FieldWrapper id="v-address" label="Address" required error={form1.formState.errors.address?.message}>
            <input id="v-address" type="text" placeholder="House/Road, Area, City"
              {...form1.register('address')} className={inputCls(!!form1.formState.errors.address)} />
          </FieldWrapper>

          <FieldWrapper id="v-password" label="Password" required error={form1.formState.errors.password?.message}
            hint="Min 8 chars, 1 uppercase, 1 number, 1 special character">
            <div className="relative">
              <input id="v-password" type={showPw ? 'text' : 'password'} autoComplete="new-password"
                placeholder="Create a strong password"
                {...form1.register('password')} className={cn(inputCls(!!form1.formState.errors.password), 'pr-10')} />
              <button type="button" onClick={() => setShowPw((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
                aria-label={showPw ? 'Hide password' : 'Show password'}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </FieldWrapper>

          <button type="submit"
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-copper text-white font-medium rounded-lg hover:bg-copper/90 transition text-sm mt-2">
            Continue <ChevronRight size={16} />
          </button>
        </form>
      )}

      {/* ── STEP 2: Shop Info ── */}
      {step === 2 && (
        <form onSubmit={form2.handleSubmit(handleStep2)} noValidate className="space-y-4">
          <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-4">Shop Information</p>

          <FieldWrapper id="v-bname" label="Shop Name" required error={form2.formState.errors.businessName?.message}>
            <input id="v-bname" type="text" placeholder="Your shop / business name"
              {...form2.register('businessName')} className={inputCls(!!form2.formState.errors.businessName)} />
          </FieldWrapper>

          <FieldWrapper id="v-bdesc" label="Shop Description" error={form2.formState.errors.businessDescription?.message}
            hint="What do you rent out? Help customers find you.">
            <textarea id="v-bdesc" rows={3} placeholder="Describe what you offer… (optional)"
              {...form2.register('businessDescription')}
              className={cn(inputCls(!!form2.formState.errors.businessDescription), 'resize-none')} />
          </FieldWrapper>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-ink-700">Division</label>
              <div className={cn(inputCls(false), 'text-ink-500 bg-ink-50 cursor-not-allowed select-none')}>
                Dhaka
              </div>
            </div>
            <FieldWrapper id="v-district" label="Area" required error={form2.formState.errors.district?.message}>
              <select id="v-district" {...form2.register('district')} className={inputCls(!!form2.formState.errors.district)}>
                <option value="">Select area</option>
                {DHAKA_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </FieldWrapper>
          </div>

          <FieldWrapper id="v-baddr" label="Shop Address" error={form2.formState.errors.businessAddress?.message}
            hint="Street, road or pickup point (optional)">
            <input id="v-baddr" type="text" placeholder="e.g. House 12, Road 4, Mirpur-10 (optional)"
              {...form2.register('businessAddress')} className={inputCls(!!form2.formState.errors.businessAddress)} />
          </FieldWrapper>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setStep(1)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-ink-200 text-ink-700 font-medium rounded-lg hover:bg-ink-50 transition text-sm">
              <ChevronLeft size={16} /> Back
            </button>
            <button type="submit"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-copper text-white font-medium rounded-lg hover:bg-copper/90 transition text-sm">
              Continue <ChevronRight size={16} />
            </button>
          </div>
        </form>
      )}

      {/* ── STEP 3: Payment ── */}
      {step === 3 && (
        <form onSubmit={form3.handleSubmit(handleStep3)} noValidate className="space-y-5">
          <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-1">Payment Details</p>
          <p className="text-xs text-ink-500 mb-4">Add your bKash number to receive payouts when customers rent your items.</p>

          <FieldWrapper id="v-bkash" label="bKash Number" error={form3.formState.errors.bkashNumber?.message}
            hint="Payouts will be sent to this number. You can update it later.">
            <PhoneInput id="v-bkash" register={form3.register('bkashNumber')} error={form3.formState.errors.bkashNumber?.message} />
          </FieldWrapper>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <p className="font-semibold">Almost there!</p>
            <p className="text-xs text-amber-700 mt-0.5">After submitting, your account will be reviewed. You&apos;ll be able to log in once approved.</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setStep(2)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-ink-200 text-ink-700 font-medium rounded-lg hover:bg-ink-50 transition text-sm">
              <ChevronLeft size={16} /> Back
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-copper text-white font-semibold rounded-lg hover:bg-copper/90 disabled:opacity-60 transition text-sm">
              {submitting ? <><Loader2 size={16} className="animate-spin" />Submitting…</> : 'Submit Application'}
            </button>
          </div>
        </form>
      )}
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Page shell
// ─────────────────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const searchParams  = useSearchParams()
  const [isVendor, setIsVendor] = useState(searchParams.get('role') === 'VENDOR')

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="font-fraunces text-3xl font-bold text-forest tracking-tight">LENDORA</span>
          </Link>
          <p className="mt-2 text-ink-500 text-sm">
            {isVendor ? 'Apply to become a seller' : 'Create your account'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-ink-100 p-8">
          {isVendor ? (
            <VendorRegisterForm onSwitchToCustomer={() => setIsVendor(false)} />
          ) : (
            <CustomerRegisterForm onSwitchToVendor={() => setIsVendor(true)} />
          )}
        </div>

        <p className="text-center mt-6 text-sm text-ink-500">
          Already have an account?{' '}
          <Link href="/login" className="text-copper font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
