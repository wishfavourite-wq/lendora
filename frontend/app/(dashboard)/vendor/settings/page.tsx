'use client'
import { useEffect }     from 'react'
import { useForm }       from 'react-hook-form'
import { zodResolver }   from '@hookform/resolvers/zod'
import { z }             from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast }         from 'sonner'
import { Loader2, Save, User, Building2, CreditCard } from 'lucide-react'
import VendorNavbar      from '@/components/shared/VendorNavbar'
import { useAuthStore }  from '@/store/auth.store'
import { api }           from '@/lib/api'
import { cn }            from '@/lib/utils'

// ── Schemas ──────────────────────────────────────────────────────────────────

const AccountSchema = z.object({
  name:  z.string().min(2, 'At least 2 characters').max(100),
  phone: z.string().regex(/^\+880\d{10}$/, 'Must be +880XXXXXXXXXX').optional().or(z.literal('')),
})

const BusinessSchema = z.object({
  businessName:        z.string().min(2, 'Required').max(200),
  businessDescription: z.string().max(2000).optional(),
  district:            z.string().min(2, 'Required'),
  division:            z.string().min(2, 'Required'),
  businessAddress:     z.string().max(300).optional(),
})

const PaymentSchema = z.object({
  bkashNumber: z.string().regex(/^\+880\d{10}$/, 'Must be +880XXXXXXXXXX').optional().or(z.literal('')),
})

type AccountForm  = z.infer<typeof AccountSchema>
type BusinessForm = z.infer<typeof BusinessSchema>
type PaymentForm  = z.infer<typeof PaymentSchema>

const BD_DIVISIONS = ['Dhaka']

// ── Helpers ──────────────────────────────────────────────────────────────────

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-ink-100 p-6">
      <div className="flex items-center gap-2 mb-5">
        <Icon size={18} className="text-copper" />
        <h2 className="font-semibold text-ink-800">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink-700 mb-1.5">{label}</label>
      {children}
      {hint  && !error && <p className="text-xs text-ink-400 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

const inputCls = (err?: string) =>
  cn('w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 transition',
    err ? 'border-red-300 focus:ring-red-200' : 'border-ink-200 focus:ring-copper/30')

// ── Sub-forms ─────────────────────────────────────────────────────────────────

function AccountSection({ user }: { user: { name: string; email: string; phone?: string | null } }) {
  const qc = useQueryClient()
  const { setUser } = useAuthStore()
  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<AccountForm>({
    resolver: zodResolver(AccountSchema),
  })

  useEffect(() => {
    reset({ name: user.name, phone: user.phone ?? '' })
  }, [user, reset])

  const save = useMutation({
    mutationFn: (v: AccountForm) => api.patch('/users/me', { name: v.name, phone: v.phone || undefined }).then(r => r.data),
    onSuccess: (res) => {
      setUser({ ...useAuthStore.getState().user!, name: res.data.name })
      qc.invalidateQueries({ queryKey: ['user', 'me'] })
      toast.success('Account updated')
      reset({ name: res.data.name, phone: res.data.phone ?? '' })
    },
    onError: () => toast.error('Failed to update account'),
  })

  return (
    <Section icon={User} title="Account info">
      <form onSubmit={handleSubmit((v) => save.mutate(v))} className="space-y-4">
        <Field label="Full name" error={errors.name?.message}>
          <input {...register('name')} className={inputCls(errors.name?.message)} />
        </Field>
        <Field label="Email" hint="Email cannot be changed">
          <input value={user.email} disabled className="w-full border border-ink-100 rounded-xl px-4 py-2.5 text-sm bg-ink-50 text-ink-400 cursor-not-allowed" />
        </Field>
        <Field label="Phone number" error={errors.phone?.message} hint="Format: +880XXXXXXXXXX">
          <input {...register('phone')} placeholder="+8801XXXXXXXXX" className={inputCls(errors.phone?.message)} />
        </Field>
        <div className="flex justify-end pt-1">
          <button type="submit" disabled={save.isPending || !isDirty}
            className="flex items-center gap-2 px-5 py-2.5 bg-copper text-white text-sm font-medium rounded-xl hover:bg-copper/90 transition disabled:opacity-50">
            {save.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Save size={14} /> Save changes</>}
          </button>
        </div>
      </form>
    </Section>
  )
}

function BusinessSection({ vendor }: { vendor: any }) {
  const qc = useQueryClient()
  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<BusinessForm>({
    resolver: zodResolver(BusinessSchema),
  })

  useEffect(() => {
    reset({
      businessName:        vendor.businessName        ?? '',
      businessDescription: vendor.businessDescription ?? '',
      district:            vendor.district            ?? '',
      division:            vendor.division            ?? '',
      businessAddress:     vendor.businessAddress     ?? '',
    })
  }, [vendor, reset])

  const save = useMutation({
    mutationFn: (v: BusinessForm) => api.patch('/vendors/me', v).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendor', 'dashboard'] })
      toast.success('Business info updated')
      reset(undefined, { keepValues: true })
    },
    onError: () => toast.error('Failed to update business info'),
  })

  return (
    <Section icon={Building2} title="Business info">
      <form onSubmit={handleSubmit((v) => save.mutate(v))} className="space-y-4">
        <Field label="Business name" error={errors.businessName?.message}>
          <input {...register('businessName')} className={inputCls(errors.businessName?.message)} />
        </Field>
        <Field label="Business description" error={errors.businessDescription?.message}>
          <textarea {...register('businessDescription')} rows={3} placeholder="Tell renters about your business…"
            className={cn(inputCls(errors.businessDescription?.message), 'resize-none')} />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Division" error={errors.division?.message}>
            <select {...register('division')} className={inputCls(errors.division?.message)}>
              <option value="">Select division</option>
              {BD_DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="District / Area" error={errors.district?.message}>
            <input {...register('district')} placeholder="e.g. Mirpur, Gulshan" className={inputCls(errors.district?.message)} />
          </Field>
        </div>
        <Field label="Business address (optional)" error={errors.businessAddress?.message}>
          <input {...register('businessAddress')} placeholder="Full address" className={inputCls(errors.businessAddress?.message)} />
        </Field>
        <div className="flex justify-end pt-1">
          <button type="submit" disabled={save.isPending || !isDirty}
            className="flex items-center gap-2 px-5 py-2.5 bg-copper text-white text-sm font-medium rounded-xl hover:bg-copper/90 transition disabled:opacity-50">
            {save.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Save size={14} /> Save changes</>}
          </button>
        </div>
      </form>
    </Section>
  )
}

function PaymentSection({ vendor }: { vendor: any }) {
  const qc = useQueryClient()
  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<PaymentForm>({
    resolver: zodResolver(PaymentSchema),
  })

  useEffect(() => {
    reset({ bkashNumber: vendor.bkashNumber ?? '' })
  }, [vendor, reset])

  const save = useMutation({
    mutationFn: (v: PaymentForm) => api.patch('/vendors/me', v).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendor', 'dashboard'] })
      toast.success('Payment info updated')
      reset(undefined, { keepValues: true })
    },
    onError: () => toast.error('Failed to update payment info'),
  })

  return (
    <Section icon={CreditCard} title="Payout methods">
      <p className="text-sm text-ink-400 mb-5">Add your bKash number to receive earnings.</p>
      <form onSubmit={handleSubmit((v) => save.mutate(v))} className="space-y-4">
        <Field label="bKash number" error={errors.bkashNumber?.message} hint="Format: +880XXXXXXXXXX">
          <input {...register('bkashNumber')} placeholder="+8801XXXXXXXXX" className={inputCls(errors.bkashNumber?.message)} />
        </Field>
        <div className="flex justify-end pt-1">
          <button type="submit" disabled={save.isPending || !isDirty}
            className="flex items-center gap-2 px-5 py-2.5 bg-copper text-white text-sm font-medium rounded-xl hover:bg-copper/90 transition disabled:opacity-50">
            {save.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Save size={14} /> Save changes</>}
          </button>
        </div>
      </form>
    </Section>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function VendorSettingsPage() {
  const user = useAuthStore((s) => s.user)

  const { data: me } = useQuery({
    queryKey: ['user', 'me'],
    queryFn:  async () => {
      const { data } = await api.get<{ data: any }>('/users/me')
      return data.data
    },
    enabled: !!user,
  })

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['vendor', 'dashboard'],
    queryFn:  async () => {
      const { data } = await api.get<{ data: any }>('/vendors/me/dashboard')
      return data.data
    },
    enabled: !!user,
  })

  if (isLoading || !dashboard || !me) {
    return (
      <>
        <VendorNavbar />
        <div className="max-w-2xl mx-auto px-4 py-8 animate-pulse space-y-5">
          <div className="h-8 w-40 bg-ink-100 rounded" />
          <div className="h-4 w-56 bg-ink-100 rounded" />
          <div className="h-48 bg-white rounded-2xl border border-ink-100" />
          <div className="h-40 bg-white rounded-2xl border border-ink-100" />
          <div className="h-32 bg-white rounded-2xl border border-ink-100" />
        </div>
      </>
    )
  }

  return (
    <>
      <VendorNavbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="font-fraunces text-2xl font-bold text-ink-900">Account settings</h1>
          <p className="text-ink-400 text-sm mt-1">Manage your profile, business info, and payout methods.</p>
        </div>

        <div className="space-y-6">
          <AccountSection  user={me} />
          <BusinessSection vendor={dashboard.vendor} />
          <PaymentSection  vendor={dashboard.vendor} />
        </div>
      </div>
    </>
  )
}
