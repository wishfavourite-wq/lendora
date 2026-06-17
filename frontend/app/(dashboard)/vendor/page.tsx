'use client'
import { useState }                from 'react'
import Link                        from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm }                 from 'react-hook-form'
import { zodResolver }             from '@hookform/resolvers/zod'
import { z }                       from 'zod'
import {
  Package, TrendingUp, Star, Clock, BarChart3,
  CheckCircle, AlertTriangle, PlusCircle, Store,
  Loader2, RefreshCw, AlertCircle, ArrowRight,
} from 'lucide-react'
import VendorNavbar      from '@/components/shared/VendorNavbar'
import Footer            from '@/components/home/Footer'
import { useAuthStore }  from '@/store/auth.store'
import { api }           from '@/lib/api'
import { formatBDT, cn } from '@/lib/utils'
import type { RentalSummary }  from '@/lib/hooks/use-rentals'
import type { ProductSummary } from '@/lib/hooks/use-products'
import { useConfirmRental }    from '@/lib/hooks/use-rentals'

// ── Types ─────────────────────────────────────────────────────────────────────

interface VendorDashboardData {
  vendor: {
    businessName:        string
    averageRating:       number
    totalRentals:        number
    totalEarnings:       number
    responseTimeMinutes: number
    status:              string
  }
  analytics: {
    totalRentals:     number
    completedRentals: number
    cancelledRentals: number
    totalRevenue:     number
    topProducts:      Array<{ name: string; rentalCount: number }>
  }
  products:       { items: ProductSummary[]; total: number }
  pendingRentals: { items: RentalSummary[];  total: number }
}

const BD_DIVISIONS = ['Dhaka']

const setupSchema = z.object({
  businessName:        z.string().min(2, 'Business name must be at least 2 characters').max(200),
  division:            z.string().min(1, 'Please select your division'),
  district:            z.string().min(2, 'District must be at least 2 characters').max(100),
  businessDescription: z.string().min(20, 'Description must be at least 20 characters').max(2000).optional().or(z.literal('')),
  bkashNumber:         z.string().regex(/^01[3-9]\d{8}$/, 'Enter a valid BD number e.g. 01XXXXXXXXX').optional().or(z.literal('')),
})
type SetupForm = z.infer<typeof setupSchema>

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon: Icon, accent = false }: {
  label: string; value: string | number; sub?: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  accent?: boolean
}) {
  return (
    <div className={cn('bg-white rounded-2xl border p-5', accent ? 'border-copper/30' : 'border-ink-100')}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-ink-400 font-medium uppercase tracking-wide">{label}</p>
          <p className={cn('font-fraunces text-2xl font-bold mt-1', accent ? 'text-copper' : 'text-ink-900')}>{value}</p>
          {sub && <p className="text-xs text-ink-400 mt-0.5">{sub}</p>}
        </div>
        <div className={cn('p-2 rounded-xl', accent ? 'bg-copper/10' : 'bg-ink-50')}>
          <Icon size={20} className={accent ? 'text-copper' : 'text-ink-400'} />
        </div>
      </div>
    </div>
  )
}

// ── Setup form (shown for new vendors with no profile) ────────────────────────

function VendorSetup({ onDone }: { onDone: () => void }) {
  const [apiError, setApiError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<SetupForm>({
    resolver: zodResolver(setupSchema),
  })

  const mutation = useMutation({
    mutationFn: (body: Record<string, string>) => api.post('/vendors/apply', body).then((r) => r.data),
    onSuccess: () => onDone(),
    onError:   (err: any) => {
      setApiError(err?.response?.data?.error?.message ?? 'Could not save your profile. Please try again.')
    },
  })

  const onSubmit = (data: SetupForm) => {
    setApiError(null)
    const payload: Record<string, string> = {
      businessName: data.businessName,
      division:     data.division,
      district:     data.district,
    }
    if (data.businessDescription) payload.businessDescription = data.businessDescription
    if (data.bkashNumber)         payload.bkashNumber = `+880${data.bkashNumber.replace(/^0/, '')}`
    mutation.mutate(payload)
  }

  const inputClass = (err?: boolean) => cn(
    'w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition',
    'focus:ring-2 focus:ring-copper/30 focus:border-copper',
    err ? 'border-red-400 bg-red-50' : 'border-ink-200 bg-white',
  )

  return (
    <>
      <VendorNavbar />
      <div className="min-h-[80vh] flex items-center justify-center bg-ink-50 px-4 py-12">
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-copper/10 flex items-center justify-center mx-auto mb-4">
              <Store size={28} className="text-copper" />
            </div>
            <h1 className="font-fraunces text-2xl font-bold text-ink-900">Set up your seller account</h1>
            <p className="text-ink-500 text-sm mt-2">
              Tell customers about your business. You can update this anytime.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-ink-100 p-8">
            {apiError && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{apiError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
              {/* Business name */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-ink-700">
                  Business / Shop name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text" placeholder="e.g. Ahmed Electronics Rental"
                  {...register('businessName')}
                  className={inputClass(!!errors.businessName)}
                />
                {errors.businessName && (
                  <p className="flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle size={12} />{errors.businessName.message}
                  </p>
                )}
              </div>

              {/* Division + District */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-ink-700">
                    Division <span className="text-red-500">*</span>
                  </label>
                  <select {...register('division')} className={inputClass(!!errors.division)}>
                    <option value="">Select division</option>
                    {BD_DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  {errors.division && (
                    <p className="flex items-center gap-1 text-xs text-red-600">
                      <AlertCircle size={12} />{errors.division.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-ink-700">
                    District <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text" placeholder="e.g. Mirpur"
                    {...register('district')}
                    className={inputClass(!!errors.district)}
                  />
                  {errors.district && (
                    <p className="flex items-center gap-1 text-xs text-red-600">
                      <AlertCircle size={12} />{errors.district.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-ink-700">
                  About your business <span className="text-ink-400 text-xs font-normal">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Briefly describe what you rent out and why customers should choose you..."
                  {...register('businessDescription')}
                  className={cn(inputClass(!!errors.businessDescription), 'resize-none')}
                />
                {errors.businessDescription && (
                  <p className="flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle size={12} />{errors.businessDescription.message}
                  </p>
                )}
              </div>

              {/* bKash */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-ink-700">
                  bKash number <span className="text-ink-400 text-xs font-normal">(optional — for receiving payments)</span>
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-ink-200 bg-ink-50 text-sm text-ink-500 select-none whitespace-nowrap">
                    BD +880
                  </span>
                  <input
                    type="tel" placeholder="01XXXXXXXXX"
                    {...register('bkashNumber')}
                    className={cn(
                      'flex-1 min-w-0 px-4 py-2.5 rounded-r-xl border text-sm outline-none transition',
                      'focus:ring-2 focus:ring-copper/30 focus:border-copper',
                      errors.bkashNumber ? 'border-red-400 bg-red-50' : 'border-ink-200 bg-white',
                    )}
                  />
                </div>
                {errors.bkashNumber && (
                  <p className="flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle size={12} />{errors.bkashNumber.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={mutation.isPending}
                className="w-full flex items-center justify-center gap-2 py-3 bg-copper text-white font-semibold rounded-xl hover:bg-copper/90 disabled:opacity-60 transition"
              >
                {mutation.isPending
                  ? <><Loader2 size={16} className="animate-spin" /> Setting up…</>
                  : <><ArrowRight size={16} /> Complete setup & go to dashboard</>}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-ink-400 mt-4">
            You can add more details — photos, bank info, payment options — from your dashboard settings.
          </p>
        </div>
      </div>
      <Footer />
    </>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function VendorDashboardPage() {
  const user        = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()

  const { data, isLoading, isError, error } = useQuery<VendorDashboardData>({
    queryKey: ['vendor', 'dashboard'],
    queryFn:  async () => {
      const { data } = await api.get<{ data: VendorDashboardData }>('/vendors/me/dashboard')
      return data.data
    },
    enabled: !!user,
    retry:   (count, err: any) => err?.response?.status === 404 ? false : count < 2,
  })

  const confirmRental = useConfirmRental()

  // ── Loading skeleton ─────────────────────────────────────────────────────
  if (!user || isLoading) {
    return (
      <>
        <VendorNavbar />
        <div className="max-w-6xl mx-auto px-4 py-8 animate-pulse">
          <div className="h-8 w-48 bg-ink-100 rounded-lg mb-2" />
          <div className="h-4 w-32 bg-ink-100 rounded mb-8" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-ink-100 p-5 h-28" />
            ))}
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-ink-100 h-64" />
            <div className="bg-white rounded-2xl border border-ink-100 h-64" />
          </div>
        </div>
      </>
    )
  }

  // ── No vendor profile yet → show setup form ──────────────────────────────
  const isNoProfile = isError && (error as any)?.response?.status === 404
  if (isNoProfile) {
    return (
      <VendorSetup onDone={() => queryClient.invalidateQueries({ queryKey: ['vendor', 'dashboard'] })} />
    )
  }

  // ── Other error ──────────────────────────────────────────────────────────
  if (isError) {
    return (
      <>
        <VendorNavbar />
        <div className="min-h-[60vh] flex items-center justify-center px-4">
          <div className="text-center">
            <AlertTriangle size={40} className="text-amber-400 mx-auto mb-3" />
            <h2 className="font-fraunces text-xl font-bold text-ink-900 mb-2">Could not load dashboard</h2>
            <p className="text-ink-400 text-sm mb-5">There was a problem connecting to the server.</p>
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ['vendor', 'dashboard'] })}
              className="flex items-center gap-2 px-5 py-2.5 bg-copper text-white text-sm font-medium rounded-xl hover:bg-copper/90 transition mx-auto"
            >
              <RefreshCw size={15} /> Try again
            </button>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  if (!data) return null

  // ── Dashboard ────────────────────────────────────────────────────────────
  const { vendor, analytics, products, pendingRentals } = data
  const completionRate = analytics.totalRentals > 0
    ? Math.round((analytics.completedRentals / analytics.totalRentals) * 100)
    : 0

  return (
    <>
      <VendorNavbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h1 className="font-fraunces text-2xl font-bold text-ink-900 truncate">{vendor.businessName}</h1>
            <p className="text-ink-400 text-sm mt-0.5">
              Seller Dashboard ·{' '}
              {vendor.status === 'PENDING_VERIFICATION' ? (
                <span className="text-amber-500 font-medium">Pending review</span>
              ) : vendor.status === 'ACTIVE' ? (
                <span className="text-forest font-medium">Active</span>
              ) : (
                <span className="text-red-500 font-medium">{vendor.status}</span>
              )}
            </p>
          </div>
          <Link
            href="/vendor/products/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-copper text-white text-sm font-medium rounded-xl hover:bg-copper/90 transition flex-shrink-0 self-start"
          >
            <PlusCircle size={16} /> List a product
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="This month revenue" value={formatBDT(analytics.totalRevenue)} icon={TrendingUp} accent />
          <StatCard label="Total rentals" value={analytics.totalRentals} sub={`${completionRate}% completion`} icon={Package} />
          <StatCard label="Average rating" value={vendor.averageRating.toFixed(1)} sub={`${vendor.totalRentals} total rentals`} icon={Star} />
          <StatCard label="Response time" value={vendor.responseTimeMinutes != null ? (vendor.responseTimeMinutes >= 60 ? `${Math.floor(vendor.responseTimeMinutes / 60)}h ${vendor.responseTimeMinutes % 60}m` : `${vendor.responseTimeMinutes}m`) : '—'} sub="Avg. response" icon={Clock} />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Pending rentals */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-ink-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-ink-800 flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-500" />
                Pending confirmation
                {pendingRentals.total > 0 && (
                  <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {pendingRentals.total}
                  </span>
                )}
              </h2>
              <Link href="/rentals" className="text-xs text-copper hover:underline">View all</Link>
            </div>
            {pendingRentals.items.length === 0 ? (
              <div className="text-center py-8 text-ink-400">
                <CheckCircle size={32} className="mx-auto mb-2 text-forest opacity-40" />
                <p className="text-sm">All caught up!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRentals.items.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-100">
                    <div>
                      <p className="text-sm font-medium text-ink-800">{r.productName}</p>
                      <p className="text-xs text-ink-400">{r.renterName} · {formatBDT(r.totalAmount)}</p>
                    </div>
                    <button
                      onClick={() => confirmRental.mutate({ id: r.id })}
                      disabled={confirmRental.isPending}
                      className="text-xs font-medium px-3 py-1.5 bg-forest text-white rounded-lg hover:bg-forest/90 disabled:opacity-50 transition"
                    >
                      Confirm
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top products */}
          <div className="bg-white rounded-2xl border border-ink-100 p-6">
            <h2 className="font-semibold text-ink-800 flex items-center gap-2 mb-4">
              <BarChart3 size={16} className="text-copper" />
              Top products
            </h2>
            {analytics.topProducts.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-ink-400 mb-3">No rental data yet</p>
                <Link href="/vendor/products/new" className="text-xs text-copper hover:underline">
                  List your first product →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {analytics.topProducts.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-3">
                    <span className="w-6 h-6 flex-shrink-0 rounded-full bg-ink-100 text-ink-500 text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-ink-700 truncate">{p.name}</p>
                      <div className="mt-1 h-1.5 bg-ink-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-copper rounded-full"
                          style={{ width: `${Math.round((p.rentalCount / (analytics.topProducts[0]?.rentalCount || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-ink-400 flex-shrink-0">{p.rentalCount}×</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Listings */}
        <div className="mt-6 bg-white rounded-2xl border border-ink-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-ink-800">My listings</h2>
            <Link href="/vendor/products" className="text-xs text-copper hover:underline">
              Manage all {products.total} listings →
            </Link>
          </div>
          {products.items.length === 0 ? (
            <div className="text-center py-8">
              <Package size={32} className="mx-auto mb-3 text-ink-300" />
              <p className="text-sm text-ink-400 mb-4">You have no listings yet.</p>
              <Link
                href="/vendor/products/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-copper text-white text-sm font-medium rounded-xl hover:bg-copper/90 transition"
              >
                <PlusCircle size={15} /> List your first product
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.items.map((p) => (
                <div key={p.id} className="flex gap-3 p-3 rounded-xl border border-ink-100 hover:border-ink-200 transition">
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-ink-100 flex-shrink-0">
                    {p.media[0]
                      ? <img src={p.media[0].url} alt={p.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-xl">📦</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink-800 truncate">{p.name}</p>
                    <p className="text-xs text-ink-400">{formatBDT(p.pricePerDay)}/day</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star size={11} className="text-gold fill-gold" />
                      <span className="text-xs text-ink-500">{p.averageRating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}
