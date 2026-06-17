'use client'
import { useState, useRef }            from 'react'
import { useRouter }                   from 'next/navigation'
import { useForm, Controller }         from 'react-hook-form'
import { zodResolver }                 from '@hookform/resolvers/zod'
import { z }                           from 'zod'
import { useMutation, useQuery }       from '@tanstack/react-query'
import { toast }                       from 'sonner'
import {
  Loader2, UploadCloud, X, Check, ChevronRight, ChevronLeft,
  Package, MapPin, Camera, DollarSign, Calendar,
} from 'lucide-react'
import VendorNavbar  from '@/components/shared/VendorNavbar'
import { api }       from '@/lib/api'
import { cn }        from '@/lib/utils'

// ── Shared helpers ─────────────────────────────────────────────────────────────

const BD_DIVISIONS = ['Dhaka']

const CONDITIONS = [
  { value: 'NEW',      label: 'New' },
  { value: 'LIKE_NEW', label: 'Like new' },
  { value: 'GOOD',     label: 'Good' },
  { value: 'FAIR',     label: 'Fair' },
]

function Field({
  label, error, hint, required, children,
}: {
  label: string; error?: string; hint?: string; required?: boolean; children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-ink-700">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint  && !error && <p className="text-xs text-ink-400">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

const inputCls = (err?: string) =>
  cn('w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 transition bg-white',
    err ? 'border-red-300 focus:ring-red-200' : 'border-ink-200 focus:ring-copper/30 focus:border-copper')

// ── Zod schemas ────────────────────────────────────────────────────────────────

const optNum = (min = 0) =>
  z.preprocess((v) => (v === '' || v == null ? undefined : v), z.coerce.number().min(min).optional())

const Step1Schema = z.object({
  name:        z.string().min(5, 'At least 5 characters').max(120),
  description: z.string().min(30, 'At least 30 characters').max(5000),
  categoryId:  z.string().min(1, 'Select a category'),
  condition:   z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR']),
  brand:       z.string().max(80).optional(),
  model:       z.string().max(80).optional(),
  tags:        z.string().optional(),
})

const Step2Schema = z.object({
  division: z.string().min(1, 'Select a division'),
  district: z.string().min(2, 'Required'),
  address:  z.string().min(5, 'Required').max(200),
})

const Step3Schema = z.object({
  mediaUrls: z.array(z.string()).min(1, 'Upload at least one photo').max(10),
})

const DELIVERY_VALUES = ['CUSTOMER_PICKUP', 'COURIER'] as const
type DeliveryValue = typeof DELIVERY_VALUES[number]

const Step4Schema = z.object({
  pricePerDay:     z.coerce.number().min(50, 'Minimum ৳50/day'),
  pricePerWeek:    optNum(0),
  pricePerMonth:   optNum(0),
  depositAmount:   z.coerce.number().min(0, 'Required'),
  deliveryOptions: z.array(z.enum(DELIVERY_VALUES)).default(['CUSTOMER_PICKUP']),
  deliveryFee:     optNum(0),
  returnPickupFee: optNum(0),
  minRentalDays:   z.coerce.number().int().min(1).default(1),
  maxRentalDays:   z.preprocess((v) => (v === '' || v == null ? undefined : v), z.coerce.number().int().min(1).optional()),
  quantity:        z.coerce.number().int().min(1).default(1),
})

const Step5Schema = z.object({
  availableFrom:  z.string().optional(),
  availableUntil: z.string().optional(),
})
  .refine(
    (d) => !d.availableFrom || !d.availableUntil || d.availableFrom <= d.availableUntil,
    { message: '"Available until" must be after "Available from"', path: ['availableUntil'] },
  )

type Step1 = z.infer<typeof Step1Schema>
type Step2 = z.infer<typeof Step2Schema>
type Step3 = z.infer<typeof Step3Schema>
type Step4 = z.infer<typeof Step4Schema> & { deliveryOptions: DeliveryValue[] }
type Step5 = z.infer<typeof Step5Schema>

const STEPS = [
  { label: 'Details',      icon: Package },
  { label: 'Location',     icon: MapPin },
  { label: 'Photos',       icon: Camera },
  { label: 'Pricing',      icon: DollarSign },
  { label: 'Availability', icon: Calendar },
] as const

// ── Step 1: Details ────────────────────────────────────────────────────────────

function StepDetails({ onNext, defaults }: { onNext: (v: Step1) => void; defaults?: Partial<Step1> }) {
  const { register, handleSubmit, control, formState: { errors } } = useForm<Step1>({
    resolver: zodResolver(Step1Schema), defaultValues: defaults,
  })

  type CategoryGroup = { id: string; name: string; emoji: string; children: { id: string; name: string; emoji: string }[] }
  const { data: categories } = useQuery<CategoryGroup[]>({
    queryKey: ['categories', 'grouped'],
    queryFn:  async () => {
      const { data } = await api.get<{ data: CategoryGroup[] }>('/categories?withChildren=true')
      return data.data
    },
  })

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5">
      <Field label="Product name" required error={errors.name?.message}>
        <input {...register('name')} placeholder="e.g. Canon EOS 5D Mark IV Camera" className={inputCls(errors.name?.message)} />
      </Field>

      <Field label="Description" required error={errors.description?.message} hint="Include what's in the box, usage notes, and limitations">
        <textarea {...register('description')} rows={5} placeholder="Describe your item in detail…" className={cn(inputCls(errors.description?.message), 'resize-none')} />
      </Field>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Category" required error={errors.categoryId?.message}>
          <Controller name="categoryId" control={control} render={({ field }) => (
            <select {...field} className={inputCls(errors.categoryId?.message)}>
              <option value="">Select a category</option>
              {categories?.map((group) => (
                <option key={group.id} value={group.id}>{group.emoji} {group.name}</option>
              ))}
            </select>
          )} />
        </Field>
        <Field label="Condition" required error={errors.condition?.message}>
          <Controller name="condition" control={control} render={({ field }) => (
            <div className="flex flex-wrap gap-2 pt-0.5">
              {CONDITIONS.map((c) => (
                <button type="button" key={c.value} onClick={() => field.onChange(c.value)}
                  className={cn('px-3 py-1.5 text-sm rounded-lg border transition',
                    field.value === c.value
                      ? 'border-copper bg-copper/10 text-copper font-medium'
                      : 'border-ink-200 text-ink-600 hover:border-ink-300')}>
                  {c.label}
                </button>
              ))}
            </div>
          )} />
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Brand (optional)" error={errors.brand?.message}>
          <input {...register('brand')} placeholder="e.g. Canon" className={inputCls(errors.brand?.message)} />
        </Field>
        <Field label="Model (optional)" error={errors.model?.message}>
          <input {...register('model')} placeholder="e.g. EOS 5D Mark IV" className={inputCls(errors.model?.message)} />
        </Field>
      </div>

      <Field label="Tags (optional)" error={errors.tags?.message} hint="Comma-separated keywords to help renters find your item">
        <input {...register('tags')} placeholder="camera, photography, DSLR, wedding" className={inputCls(errors.tags?.message)} />
      </Field>

      <div className="flex justify-end pt-2">
        <button type="submit" className="flex items-center gap-2 px-6 py-2.5 bg-copper text-white text-sm font-medium rounded-xl hover:bg-copper/90 transition">
          Continue <ChevronRight size={16} />
        </button>
      </div>
    </form>
  )
}

// ── Step 2: Location ───────────────────────────────────────────────────────────

function StepLocation({ onNext, onBack, defaults }: { onNext: (v: Step2) => void; onBack: () => void; defaults?: Partial<Step2> }) {
  const { register, handleSubmit, control, formState: { errors } } = useForm<Step2>({
    resolver: zodResolver(Step2Schema), defaultValues: defaults,
  })

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Division" required error={errors.division?.message}>
          <Controller name="division" control={control} render={({ field }) => (
            <select {...field} className={inputCls(errors.division?.message)}>
              <option value="">Select division</option>
              {BD_DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          )} />
        </Field>
        <Field label="District / Area" required error={errors.district?.message}>
          <input {...register('district')} placeholder="e.g. Mirpur, Gulshan, Dhanmondi" className={inputCls(errors.district?.message)} />
        </Field>
      </div>

      <Field label="Pickup address" required error={errors.address?.message} hint="Exact address shown only after booking is confirmed">
        <input {...register('address')} placeholder="Road / building / landmark" className={inputCls(errors.address?.message)} />
      </Field>

      <div className="flex justify-between pt-2">
        <button type="button" onClick={onBack} className="flex items-center gap-2 px-5 py-2.5 text-sm text-ink-600 border border-ink-200 rounded-xl hover:bg-ink-50 transition">
          <ChevronLeft size={16} /> Back
        </button>
        <button type="submit" className="flex items-center gap-2 px-6 py-2.5 bg-copper text-white text-sm font-medium rounded-xl hover:bg-copper/90 transition">
          Continue <ChevronRight size={16} />
        </button>
      </div>
    </form>
  )
}

// ── Step 3: Photos ─────────────────────────────────────────────────────────────

function StepPhotos({ onNext, onBack, defaults }: { onNext: (v: Step3) => void; onBack: () => void; defaults?: Partial<Step3> }) {
  const { handleSubmit, setValue, watch, formState: { errors } } = useForm<Step3>({
    resolver: zodResolver(Step3Schema),
    defaultValues: { mediaUrls: defaults?.mediaUrls ?? [] },
  })
  const mediaUrls = watch('mediaUrls')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement | null>(null)

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true)
    try {
      const added: string[] = []
      for (const file of Array.from(files)) {
        const fd = new FormData()
        fd.append('file', file)
        const { data } = await api.post<{ data: { url: string } }>('/products/upload-media', fd, {
          headers: { 'Content-Type': undefined },
        })
        added.push(data.data.url)
      }
      setValue('mediaUrls', [...mediaUrls, ...added].slice(0, 10), { shouldValidate: true })
    } catch {
      toast.error('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const remove = (url: string) =>
    setValue('mediaUrls', mediaUrls.filter((u) => u !== url), { shouldValidate: true })

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5">
      <div>
        <p className="text-sm font-medium text-ink-700 mb-1">Product photos <span className="text-ink-400 font-normal">(up to 10)</span></p>
        <p className="text-xs text-ink-400 mb-4">First photo is the cover image. Good lighting and multiple angles help you rent faster.</p>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {mediaUrls.map((url, i) => (
            <div key={url} className="relative aspect-square rounded-xl overflow-hidden bg-ink-50 group">
              <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
              {i === 0 && (
                <span className="absolute top-1.5 left-1.5 text-[10px] font-semibold bg-copper text-white px-1.5 py-0.5 rounded">COVER</span>
              )}
              <button type="button" onClick={() => remove(url)}
                className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 text-white rounded-full items-center justify-center hidden group-hover:flex hover:bg-black/80 transition">
                <X size={12} />
              </button>
            </div>
          ))}
          {mediaUrls.length < 10 && (
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
              className="aspect-square rounded-xl border-2 border-dashed border-ink-200 hover:border-copper/50 flex flex-col items-center justify-center gap-2 text-ink-400 hover:text-copper transition disabled:opacity-50">
              {uploading ? <Loader2 size={20} className="animate-spin" /> : <UploadCloud size={20} />}
              <span className="text-xs">Add photo</span>
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => handleFiles(e.target.files)} />
        {errors.mediaUrls && <p className="text-xs text-red-500 mt-2">{errors.mediaUrls.message}</p>}
      </div>

      <div className="flex justify-between pt-2">
        <button type="button" onClick={onBack} className="flex items-center gap-2 px-5 py-2.5 text-sm text-ink-600 border border-ink-200 rounded-xl hover:bg-ink-50 transition">
          <ChevronLeft size={16} /> Back
        </button>
        <button type="submit" className="flex items-center gap-2 px-6 py-2.5 bg-copper text-white text-sm font-medium rounded-xl hover:bg-copper/90 transition">
          Continue <ChevronRight size={16} />
        </button>
      </div>
    </form>
  )
}

const DELIVERY_OPTIONS: { value: DeliveryValue; title: string; description: string }[] = [
  {
    value:       'CUSTOMER_PICKUP',
    title:       'Customer Pickup',
    description: 'Renter picks up the item from your location. No delivery charge.',
  },
  {
    value:       'COURIER',
    title:       'Courier Service',
    description: 'Item shipped via courier. Global courier charge applies.',
  },
]

// ── Step 4: Pricing ────────────────────────────────────────────────────────────

function StepPricing({ onNext, onBack, defaults }: { onNext: (v: Step4) => void; onBack: () => void; defaults?: Partial<Step4> }) {
  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<Step4>({
    resolver: zodResolver(Step4Schema),
    defaultValues: { minRentalDays: 1, quantity: 1, deliveryOptions: ['CUSTOMER_PICKUP'], ...defaults },
  })
  const deliveryOptions = watch('deliveryOptions') ?? []
  const hasCourier      = deliveryOptions.includes('COURIER')

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      {/* Rental price */}
      <div>
        <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-3">Rental Price</p>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Per day (৳)" required error={errors.pricePerDay?.message}>
            <input type="number" {...register('pricePerDay')} placeholder="500" className={inputCls(errors.pricePerDay?.message)} />
          </Field>
          <Field label="Per week (৳)" error={errors.pricePerWeek?.message} hint="Optional discount">
            <input type="number" {...register('pricePerWeek')} placeholder="3000" className={inputCls(errors.pricePerWeek?.message)} />
          </Field>
          <Field label="Per month (৳)" error={errors.pricePerMonth?.message} hint="Optional discount">
            <input type="number" {...register('pricePerMonth')} placeholder="10000" className={inputCls(errors.pricePerMonth?.message)} />
          </Field>
        </div>
      </div>

      {/* Deposit */}
      <Field label="Security deposit (৳)" required error={errors.depositAmount?.message} hint="Held during rental, refunded after safe return">
        <input type="number" min={0} {...register('depositAmount')} placeholder="2000" className={inputCls(errors.depositAmount?.message)} />
      </Field>

      {/* Delivery options (multi-select) */}
      <div>
        <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-1">Delivery Options</p>
        <p className="text-xs text-ink-400 mb-3">Select all methods your item supports. Renters will choose one at checkout.</p>
        <Controller name="deliveryOptions" control={control} render={({ field }) => (
          <div className="grid sm:grid-cols-3 gap-3">
            {DELIVERY_OPTIONS.map((opt) => {
              const checked = (field.value ?? []).includes(opt.value)
              const toggle  = () => {
                const current = field.value ?? []
                field.onChange(
                  checked
                    ? current.filter((v) => v !== opt.value)
                    : [...current, opt.value]
                )
              }
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={toggle}
                  className={cn(
                    'text-left p-4 rounded-xl border-2 transition',
                    checked ? 'border-copper bg-copper/5' : 'border-ink-200 hover:border-ink-300',
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className={cn('text-sm font-semibold', checked ? 'text-copper' : 'text-ink-700')}>
                      {opt.title}
                    </div>
                    <div className={cn(
                      'w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0',
                      checked ? 'border-copper bg-copper' : 'border-ink-300',
                    )}>
                      {checked && <Check size={10} className="text-white" />}
                    </div>
                  </div>
                  <div className="text-xs text-ink-400 leading-snug">{opt.description}</div>
                </button>
              )
            })}
          </div>
        )} />

        {hasCourier && (
          <p className="mt-3 text-xs text-ink-400 bg-ink-50 rounded-lg px-4 py-2.5">
            A global courier charge (forward + return) will be applied at checkout.
          </p>
        )}
      </div>

      {/* Rental limits */}
      <div>
        <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-3">Rental Limits</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Minimum rental days" error={errors.minRentalDays?.message}>
            <input type="number" {...register('minRentalDays')} className={inputCls(errors.minRentalDays?.message)} />
          </Field>
          <Field label="Maximum rental days" error={errors.maxRentalDays?.message} hint="Leave blank for no limit">
            <input type="number" {...register('maxRentalDays')} placeholder="No limit" className={inputCls(errors.maxRentalDays?.message)} />
          </Field>
        </div>
      </div>

      {/* Quantity */}
      <Field label="Available units" required error={errors.quantity?.message} hint="How many identical units can be rented simultaneously">
        <input type="number" min={1} {...register('quantity')} className={cn(inputCls(errors.quantity?.message), 'max-w-[160px]')} />
      </Field>

      <div className="flex justify-between pt-2">
        <button type="button" onClick={onBack} className="flex items-center gap-2 px-5 py-2.5 text-sm text-ink-600 border border-ink-200 rounded-xl hover:bg-ink-50 transition">
          <ChevronLeft size={16} /> Back
        </button>
        <button type="submit" className="flex items-center gap-2 px-6 py-2.5 bg-copper text-white text-sm font-medium rounded-xl hover:bg-copper/90 transition">
          Continue <ChevronRight size={16} />
        </button>
      </div>
    </form>
  )
}

// ── Step 5: Availability ───────────────────────────────────────────────────────

function StepAvailability({
  onSubmit, onBack, isSubmitting, defaults,
}: {
  onSubmit: (v: Step5) => void
  onBack: () => void
  isSubmitting: boolean
  defaults?: Partial<Step5>
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<Step5>({
    resolver: zodResolver(Step5Schema), defaultValues: defaults,
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-ink-50 rounded-xl p-4 text-sm text-ink-500 mb-2">
        Set when your item is available for booking. Leave both blank to make it always available.
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Available from" error={errors.availableFrom?.message} hint="Earliest date renters can start a booking">
          <input type="date" {...register('availableFrom')} className={inputCls(errors.availableFrom?.message)} />
        </Field>
        <Field label="Available until" error={errors.availableUntil?.message} hint="Latest date renters can end a booking">
          <input type="date" {...register('availableUntil')} className={inputCls(errors.availableUntil?.message)} />
        </Field>
      </div>

      <div className="flex justify-between pt-2">
        <button type="button" onClick={onBack} disabled={isSubmitting}
          className="flex items-center gap-2 px-5 py-2.5 text-sm text-ink-600 border border-ink-200 rounded-xl hover:bg-ink-50 transition disabled:opacity-40">
          <ChevronLeft size={16} /> Back
        </button>
        <button type="submit" disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-2.5 bg-copper text-white text-sm font-semibold rounded-xl hover:bg-copper/90 transition disabled:opacity-50">
          {isSubmitting
            ? <><Loader2 size={15} className="animate-spin" /> Publishing…</>
            : <><Check size={15} /> Publish listing</>}
        </button>
      </div>
    </form>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

type AllData = Partial<Step1 & Step2 & Step3 & Step4 & Step5> & { deliveryFee?: number; returnPickupFee?: number }

export default function NewProductPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [data, setData] = useState<AllData>({})

  const merge = (partial: AllData) => setData((prev) => ({ ...prev, ...partial }))

  const createProduct = useMutation({
    mutationFn: async (payload: AllData) => {
      const deliveryOptions = (payload as any).deliveryOptions ?? ['CUSTOMER_PICKUP']
      const body = {
        name:            payload.name,
        description:     payload.description,
        categoryId:      payload.categoryId,
        condition:       payload.condition,
        brand:           payload.brand    || undefined,
        model:           payload.model    || undefined,
        tags:            payload.tags
          ? payload.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
          : [],
        district:        payload.district,
        division:        payload.division,
        address:         payload.address,
        mediaUrls:       payload.mediaUrls,
        pricePerDay:     payload.pricePerDay,
        pricePerWeek:    payload.pricePerWeek   || undefined,
        pricePerMonth:   payload.pricePerMonth  || undefined,
        depositAmount:   payload.depositAmount,
        deliveryOptions,
        minRentalDays:   payload.minRentalDays   ?? 1,
        maxRentalDays:   payload.maxRentalDays   || undefined,
        quantity:        payload.quantity        ?? 1,
        availableFrom:   payload.availableFrom   || undefined,
        availableUntil:  payload.availableUntil  || undefined,
      }
      return api.post('/products', body).then((r) => r.data)
    },
    onSuccess: () => {
      toast.success('Listing submitted! Awaiting admin approval.')
      router.push('/vendor/products')
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message ?? 'Failed to publish. Please try again.'
      toast.error(msg)
    },
  })

  return (
    <>
      <VendorNavbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-fraunces text-3xl font-bold text-ink-900">List a product</h1>
          <p className="text-ink-400 text-sm mt-1">Fill in the details to publish your rental listing.</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center mb-8">
          {STEPS.map(({ label, icon: Icon }, i) => (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition',
                  i < step   ? 'bg-forest text-white' :
                  i === step ? 'bg-copper text-white ring-4 ring-copper/20' :
                               'bg-ink-100 text-ink-400',
                )}>
                  {i < step ? <Check size={14} /> : <Icon size={14} />}
                </div>
                <span className={cn('text-[10px] whitespace-nowrap hidden sm:block',
                  i === step ? 'text-copper font-semibold' : 'text-ink-400')}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn('flex-1 h-0.5 mx-2 mb-5 transition', i < step ? 'bg-forest/40' : 'bg-ink-100')} />
              )}
            </div>
          ))}
        </div>

        {/* Step panels */}
        <div className="bg-white rounded-2xl border border-ink-100 p-6 sm:p-8">
          {step === 0 && (
            <StepDetails defaults={data} onNext={(v) => { merge(v); setStep(1) }} />
          )}
          {step === 1 && (
            <StepLocation defaults={data} onBack={() => setStep(0)} onNext={(v) => { merge(v); setStep(2) }} />
          )}
          {step === 2 && (
            <StepPhotos defaults={data} onBack={() => setStep(1)} onNext={(v) => { merge(v); setStep(3) }} />
          )}
          {step === 3 && (
            <StepPricing defaults={data} onBack={() => setStep(2)} onNext={(v) => { merge(v); setStep(4) }} />
          )}
          {step === 4 && (
            <StepAvailability
              defaults={data}
              onBack={() => setStep(3)}
              isSubmitting={createProduct.isPending}
              onSubmit={(v) => {
                const final = { ...data, ...v }
                merge(v)
                createProduct.mutate(final)
              }}
            />
          )}
        </div>
      </div>
    </>
  )
}
