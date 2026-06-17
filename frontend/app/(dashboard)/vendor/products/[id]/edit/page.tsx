'use client'
import { useState, useRef, useEffect } from 'react'
import { useParams, useRouter }         from 'next/navigation'
import { useForm, Controller }          from 'react-hook-form'
import { zodResolver }                  from '@hookform/resolvers/zod'
import { z }                            from 'zod'
import { useMutation, useQuery }        from '@tanstack/react-query'
import { toast }                        from 'sonner'
import { Loader2, UploadCloud, X, Save, ChevronLeft, Check } from 'lucide-react'
import Link                             from 'next/link'
import VendorNavbar                     from '@/components/shared/VendorNavbar'
import { api }                          from '@/lib/api'
import { cn }                           from '@/lib/utils'

const BD_DIVISIONS = ['Dhaka']
const CONDITIONS = [
  { value: 'NEW',      label: 'New' },
  { value: 'LIKE_NEW', label: 'Like new' },
  { value: 'GOOD',     label: 'Good' },
  { value: 'FAIR',     label: 'Fair' },
]

const optNum = (min = 0) =>
  z.preprocess((v) => (v === '' || v == null ? undefined : v), z.coerce.number().min(min).optional())

const DELIVERY_VALUES_EDIT = ['CUSTOMER_PICKUP', 'COURIER'] as const
type DeliveryValueEdit = typeof DELIVERY_VALUES_EDIT[number]

const DELIVERY_OPTIONS_EDIT: { value: DeliveryValueEdit; title: string; description: string }[] = [
  { value: 'CUSTOMER_PICKUP', title: 'Customer Pickup', description: 'Renter picks up the item from your location.' },
  { value: 'COURIER',         title: 'Courier Service', description: 'Item shipped via courier (global charge applies).' },
]

const EditSchema = z.object({
  name:            z.string().min(5, 'At least 5 characters').max(120),
  description:     z.string().min(30, 'At least 30 characters').max(5000),
  categoryId:      z.string().min(1, 'Select a category'),
  condition:       z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR']),
  brand:           z.string().max(80).optional(),
  model:           z.string().max(80).optional(),
  district:        z.string().min(2, 'Required'),
  division:        z.string().min(2, 'Required'),
  address:         z.string().min(5, 'Required').max(200),
  mediaUrls:       z.array(z.string()).min(1, 'Upload at least one photo').max(10),
  // pricing
  pricePerDay:     z.coerce.number().min(50, 'Minimum ৳50/day'),
  pricePerWeek:    optNum(0),
  pricePerMonth:   optNum(0),
  depositAmount:   z.coerce.number().min(0, 'Required'),
  deliveryOptions: z.array(z.enum(DELIVERY_VALUES_EDIT)).default(['CUSTOMER_PICKUP']),
  deliveryFee:     optNum(0),
  minRentalDays:   z.coerce.number().int().min(1).default(1),
  maxRentalDays:   z.preprocess((v) => (v === '' || v == null ? undefined : v), z.coerce.number().int().min(1).optional()),
  quantity:        z.coerce.number().int().min(1).default(1),
  // availability
  availableFrom:   z.string().optional(),
  availableUntil:  z.string().optional(),
})

type EditForm = z.infer<typeof EditSchema>

function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-ink-700">{label}</label>
      {children}
      {hint  && !error && <p className="text-xs text-ink-400">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

const inputCls = (err?: string) =>
  cn('w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 transition bg-white',
    err ? 'border-red-300 focus:ring-red-200' : 'border-ink-200 focus:ring-copper/30 focus:border-copper')

function toDateInput(v: string | Date | null | undefined): string {
  if (!v) return ''
  const d = typeof v === 'string' ? new Date(v) : v
  if (isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

export default function EditProductPage() {
  const { id }  = useParams<{ id: string }>()
  const router  = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['product', id],
    queryFn:  async () => {
      const { data } = await api.get<{ data: any }>(`/products/${id}`)
      return data.data
    },
    enabled: !!id,
  })

  const { data: categories } = useQuery<{ id: string; name: string; emoji: string }[]>({
    queryKey: ['categories'],
    queryFn:  async () => {
      const { data } = await api.get<{ data: any[] }>('/categories')
      return data.data
    },
  })

  const { register, handleSubmit, control, setValue, watch, reset, formState: { errors } } = useForm<EditForm>({
    resolver: zodResolver(EditSchema),
  })

  const mediaUrls       = watch('mediaUrls') ?? []
  const deliveryOptions = watch('deliveryOptions') ?? []

  useEffect(() => {
    if (!product) return
    reset({
      name:              product.name,
      description:       product.description,
      categoryId:        product.categoryId,
      condition:         product.condition,
      brand:             product.brand         ?? '',
      model:             product.model         ?? '',
      district:          product.district,
      division:          product.division,
      address:           product.address       ?? '',
      mediaUrls:         product.media?.map((m: any) => m.url) ?? [],
      pricePerDay:       product.pricePerDay,
      pricePerWeek:      product.pricePerWeek  ?? undefined,
      pricePerMonth:     product.pricePerMonth ?? undefined,
      depositAmount:   product.depositAmount,
      deliveryOptions: (() => {
        const opts = product.deliveryOptions
        if (Array.isArray(opts) && opts.length > 0) return opts
        if (typeof opts === 'string') { try { const p = JSON.parse(opts); return Array.isArray(p) && p.length > 0 ? p : ['CUSTOMER_PICKUP'] } catch { return ['CUSTOMER_PICKUP'] } }
        return ['CUSTOMER_PICKUP']
      })(),
      deliveryFee:     product.deliveryFee ?? undefined,
      minRentalDays:     product.minRentalDays ?? 1,
      maxRentalDays:     product.maxRentalDays ?? undefined,
      quantity:          product.quantity      ?? 1,
      availableFrom:     toDateInput(product.availableFrom),
      availableUntil:    toDateInput(product.availableUntil),
    })
  }, [product, reset])

  const updateProduct = useMutation({
    mutationFn: (payload: EditForm) => {
      const opts = payload.deliveryOptions ?? ['CUSTOMER_PICKUP']
      const body = {
        ...payload,
        tags:            [],
        deliveryOptions: opts,
        deliveryFee:     undefined,
        availableFrom:   payload.availableFrom  || undefined,
        availableUntil:  payload.availableUntil || undefined,
      }
      return api.patch(`/products/${id}`, body).then((r) => r.data)
    },
    onSuccess: () => {
      toast.success('Listing updated!')
      router.push('/vendor/products')
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message ?? 'Failed to update. Please try again.'
      toast.error(msg)
    },
  })

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

  if (isLoading) {
    return (
      <>
        <VendorNavbar />
        <div className="max-w-2xl mx-auto px-4 py-8 animate-pulse space-y-5">
          <div className="h-5 w-24 bg-ink-100 rounded" />
          <div className="h-8 w-48 bg-ink-100 rounded" />
          <div className="h-56 bg-white rounded-2xl border border-ink-100" />
          <div className="h-40 bg-white rounded-2xl border border-ink-100" />
          <div className="h-32 bg-white rounded-2xl border border-ink-100" />
        </div>
      </>
    )
  }

  if (isError || !product) {
    return (
      <>
        <VendorNavbar />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <p className="text-ink-600">Product not found.</p>
          <Link href="/vendor/products" className="text-copper hover:underline text-sm mt-2 inline-block">← Back</Link>
        </div>
      </>
    )
  }

  return (
    <>
      <VendorNavbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/vendor/products" className="text-ink-400 hover:text-ink-700 transition">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="font-fraunces text-2xl font-bold text-ink-900">Edit listing</h1>
            <p className="text-ink-400 text-sm mt-0.5 truncate max-w-md">{product.name}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit((v) => updateProduct.mutate(v))} className="space-y-6">

          {/* ── Details ── */}
          <Section title="Details">
            <Field label="Product name" error={errors.name?.message}>
              <input {...register('name')} className={inputCls(errors.name?.message)} />
            </Field>
            <Field label="Description" error={errors.description?.message}>
              <textarea {...register('description')} rows={5} className={cn(inputCls(errors.description?.message), 'resize-none')} />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Category" error={errors.categoryId?.message}>
                <Controller name="categoryId" control={control} render={({ field }) => (
                  <select {...field} className={inputCls(errors.categoryId?.message)}>
                    <option value="">Select a category</option>
                    {categories?.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
                  </select>
                )} />
              </Field>
              <Field label="Condition" error={errors.condition?.message}>
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
          </Section>

          {/* ── Location ── */}
          <Section title="Location">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Division" error={errors.division?.message}>
                <Controller name="division" control={control} render={({ field }) => (
                  <select {...field} className={inputCls(errors.division?.message)}>
                    <option value="">Select division</option>
                    {BD_DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                )} />
              </Field>
              <Field label="District / Area" error={errors.district?.message}>
                <input {...register('district')} className={inputCls(errors.district?.message)} />
              </Field>
            </div>
            <Field label="Pickup address" error={errors.address?.message}>
              <input {...register('address')} className={inputCls(errors.address?.message)} />
            </Field>
          </Section>

          {/* ── Photos ── */}
          <Section title="Photos">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {mediaUrls.map((url, i) => (
                <div key={url} className="relative aspect-square rounded-xl overflow-hidden bg-ink-50 group">
                  <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                  {i === 0 && <span className="absolute top-1.5 left-1.5 text-[10px] font-semibold bg-copper text-white px-1.5 py-0.5 rounded">COVER</span>}
                  <button type="button" onClick={() => setValue('mediaUrls', mediaUrls.filter((u) => u !== url), { shouldValidate: true })}
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
            {errors.mediaUrls && <p className="text-xs text-red-500">{errors.mediaUrls.message}</p>}
          </Section>

          {/* ── Pricing ── */}
          <Section title="Pricing">
            <div className="grid sm:grid-cols-3 gap-4">
              <Field label="Per day (৳) *" error={errors.pricePerDay?.message}>
                <input type="number" min={50} step={10} {...register('pricePerDay')} className={inputCls(errors.pricePerDay?.message)} />
              </Field>
              <Field label="Per week (৳)" error={errors.pricePerWeek?.message} hint="Optional">
                <input type="number" min={0} step={10} {...register('pricePerWeek')} placeholder="—" className={inputCls(errors.pricePerWeek?.message)} />
              </Field>
              <Field label="Per month (৳)" error={errors.pricePerMonth?.message} hint="Optional">
                <input type="number" min={0} step={100} {...register('pricePerMonth')} placeholder="—" className={inputCls(errors.pricePerMonth?.message)} />
              </Field>
            </div>

            <Field label="Security deposit (৳) *" error={errors.depositAmount?.message} hint="Held during rental, refunded after safe return">
              <input type="number" min={0} {...register('depositAmount')} className={inputCls(errors.depositAmount?.message)} />
            </Field>

            {/* Delivery options (multi-select) */}
            <div>
              <p className="text-sm font-medium text-ink-700 mb-1">Delivery options</p>
              <p className="text-xs text-ink-400 mb-3">Select all methods your item supports.</p>
              <Controller name="deliveryOptions" control={control} render={({ field }) => (
                <div className="grid sm:grid-cols-3 gap-3">
                  {DELIVERY_OPTIONS_EDIT.map((opt) => {
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
                      <button key={opt.value} type="button" onClick={toggle}
                        className={cn(
                          'text-left p-3 rounded-xl border-2 transition',
                          checked ? 'border-copper bg-copper/5' : 'border-ink-200 hover:border-ink-300',
                        )}>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className={cn('text-sm font-semibold', checked ? 'text-copper' : 'text-ink-700')}>{opt.title}</span>
                          <div className={cn('w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0', checked ? 'border-copper bg-copper' : 'border-ink-300')}>
                            {checked && <Check size={10} className="text-white" />}
                          </div>
                        </div>
                        <div className="text-xs text-ink-400 leading-snug">{opt.description}</div>
                      </button>
                    )
                  })}
                </div>
              )} />
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <Field label="Min rental days" error={errors.minRentalDays?.message}>
                <input type="number" min={1} {...register('minRentalDays')} className={inputCls(errors.minRentalDays?.message)} />
              </Field>
              <Field label="Max rental days" error={errors.maxRentalDays?.message} hint="Blank = no limit">
                <input type="number" min={1} {...register('maxRentalDays')} placeholder="No limit" className={inputCls(errors.maxRentalDays?.message)} />
              </Field>
              <Field label="Available units" error={errors.quantity?.message}>
                <input type="number" min={1} {...register('quantity')} className={inputCls(errors.quantity?.message)} />
              </Field>
            </div>
          </Section>

          {/* ── Availability ── */}
          <Section title="Availability">
            <p className="text-xs text-ink-400 -mt-2">Leave blank to make the listing always available.</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Available from" error={errors.availableFrom?.message}>
                <input type="date" {...register('availableFrom')} className={inputCls(errors.availableFrom?.message)} />
              </Field>
              <Field label="Available until" error={errors.availableUntil?.message}>
                <input type="date" {...register('availableUntil')} className={inputCls(errors.availableUntil?.message)} />
              </Field>
            </div>
          </Section>

          {/* Actions */}
          <div className="flex items-center justify-between pb-6">
            <Link href="/vendor/products" className="px-5 py-2.5 text-sm text-ink-600 border border-ink-200 rounded-xl hover:bg-ink-50 transition">
              Cancel
            </Link>
            <button type="submit" disabled={updateProduct.isPending}
              className="flex items-center gap-2 px-6 py-2.5 bg-copper text-white text-sm font-medium rounded-xl hover:bg-copper/90 transition disabled:opacity-50">
              {updateProduct.isPending
                ? <><Loader2 size={15} className="animate-spin" /> Saving…</>
                : <><Save size={15} /> Save changes</>}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-ink-100 p-6 space-y-5">
      <h2 className="font-semibold text-ink-800">{title}</h2>
      {children}
    </section>
  )
}
