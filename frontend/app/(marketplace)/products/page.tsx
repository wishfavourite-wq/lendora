'use client'
import { useState, Suspense }     from 'react'
import { useSearchParams }        from 'next/navigation'
import { useRouter }              from 'next/navigation'
import Link                       from 'next/link'
import { useQuery }               from '@tanstack/react-query'
import { Search, SlidersHorizontal, X, Star, MapPin, ShieldCheck, Loader2, ChevronDown, Calendar, Package2, UserRound, Truck } from 'lucide-react'
import Navbar                     from '@/components/shared/Navbar'
import Footer                     from '@/components/home/Footer'
import { SkeletonCard }           from '@/components/ui/SkeletonCard'
import { useProductSearch }       from '@/lib/hooks/use-products'
import type { ProductSummary }    from '@/lib/hooks/use-products'
import { formatBDT, cn }          from '@/lib/utils'
import { useAuthStore }           from '@/store/auth.store'
import { api }                    from '@/lib/api'

function fmtShortDate(d: string | null | undefined): string | null {
  if (!d) return null
  const date = new Date(d)
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

const DELIVERY_META: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  CUSTOMER_PICKUP: {
    label: 'Pickup',
    icon:  <UserRound size={9} />,
    cls:   'bg-blue-50 text-blue-600',
  },
  COURIER: {
    label: 'Courier',
    icon:  <Package2 size={9} />,
    cls:   'bg-amber-50 text-amber-700',
  },
}

type CategoryGroup = { id: string; name: string; emoji: string; children: { id: string; name: string; emoji: string }[] }

function useCategories() {
  return useQuery<CategoryGroup[]>({
    queryKey: ['categories', 'grouped'],
    queryFn:  async () => {
      const { data } = await api.get<{ data: CategoryGroup[] }>('/categories?withChildren=true')
      return data.data
    },
    staleTime: 5 * 60_000,
  })
}

function ApiProductCard({ product }: { product: ProductSummary }) {
  const [imgErr, setImgErr] = useState(false)
  const router = useRouter()
  const user   = useAuthStore((s) => s.user)
  const image  = product.media.find((m) => m.isPrimary)?.url ?? product.media[0]?.url

  // Resolve delivery options (same fallback logic as detail/checkout pages)
  const deliveryOpts: string[] =
    Array.isArray(product.deliveryOptions) && product.deliveryOptions.length > 0
      ? product.deliveryOptions
      : product.deliveryAvailable
        ? ['CUSTOMER_PICKUP', 'COURIER']
        : ['CUSTOMER_PICKUP']

  const fromDate = fmtShortDate(product.availableFrom)
  const toDate   = fmtShortDate(product.availableUntil)
  const hasDateRange = !!(fromDate || toDate)

  const rentalRange = product.maxRentalDays
    ? `Max ${product.maxRentalDays} day${product.maxRentalDays !== 1 ? 's' : ''}`
    : `Min ${product.minRentalDays ?? 1} day${(product.minRentalDays ?? 1) !== 1 ? 's' : ''}`

  const dest = user ? `/products/${product.slug}` : `/register?role=RENTER`

  return (
    <Link href={dest}
      className="group bg-white dark:bg-surface-base rounded-3xl border border-ink-100 dark:border-surface-raised
                 hover:border-copper/30 hover:shadow-md transition flex flex-col overflow-hidden">
      <div className="aspect-[4/3] relative overflow-hidden bg-ink-100">
        {image && !imgErr
          ? <img src={image} alt={product.name} onError={() => setImgErr(true)} className={`w-full h-full object-cover group-hover:scale-105 transition duration-500 ${!product.isAvailableNow ? 'brightness-75' : ''}`} />
          : <div className="w-full h-full flex items-center justify-center text-4xl opacity-30">📦</div>
        }
        {!product.isAvailableNow && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-black/70 text-white text-xs font-bold px-3 py-1.5 rounded-full tracking-wide uppercase">
              Rented Out
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2 p-4 flex-1">
        <h3 className="font-semibold text-sm text-ink-900 dark:text-ink-100 leading-snug line-clamp-2 group-hover:text-copper transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1" aria-label={`Rated ${product.averageRating.toFixed(1)}`}>
            <Star size={12} className="fill-gold stroke-gold" />
            <span className="font-semibold text-ink-700 dark:text-ink-300">{product.averageRating.toFixed(1)}</span>
            <span className="text-ink-400">({product.reviewCount})</span>
          </div>
          <div className="flex items-center gap-1 text-ink-400">
            <MapPin size={11} />
            <span>{product.district}</span>
          </div>
        </div>

        {/* Rental period + available dates */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-ink-500">
          <span>{rentalRange}</span>
          {hasDateRange && (
            <>
              <span className="text-ink-200">·</span>
              <span className="flex items-center gap-0.5">
                <Calendar size={9} className="flex-shrink-0" />
                {fromDate ?? 'Now'} – {toDate ?? 'Ongoing'}
              </span>
            </>
          )}
        </div>

        {/* Delivery option badges */}
        <div className="flex flex-wrap gap-1">
          {deliveryOpts.map((opt) => {
            const meta = DELIVERY_META[opt]
            if (!meta) return null
            return (
              <span
                key={opt}
                className={cn('flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded-full', meta.cls)}
              >
                {meta.icon}
                {meta.label}
              </span>
            )
          })}
        </div>

        {/* Seller info */}
        {product.vendorId && (
          <div
            role="link"
            tabIndex={0}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push(`/vendors/${product.vendorId}`) }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); router.push(`/vendors/${product.vendorId}`) } }}
            className="flex items-center gap-1.5 text-[10px] text-ink-400 hover:text-copper transition-colors cursor-pointer select-none"
          >
            {product.vendorAvatarUrl ? (
              <img src={product.vendorAvatarUrl} alt={product.vendorName}
                className="w-4 h-4 rounded-full object-cover flex-shrink-0 border border-ink-100" />
            ) : (
              <div className="w-4 h-4 rounded-full bg-copper/10 text-copper text-[8px] font-bold flex items-center justify-center flex-shrink-0">
                {product.vendorName?.charAt(0)?.toUpperCase() ?? '?'}
              </div>
            )}
            <span className="truncate">{product.vendorName}</span>
          </div>
        )}

        <div className="flex-1" />
        <div className="flex items-end justify-between pt-2 border-t border-ink-100 dark:border-surface-raised">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-bold text-copper">{formatBDT(product.pricePerDay)}</span>
              <span className="text-xs text-ink-400">/ day</span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <ShieldCheck size={10} className="text-forest" />
              <span className="text-[10px] text-ink-400">{formatBDT(product.depositAmount)} deposit</span>
            </div>
          </div>
          {product.isAvailableNow ? (
            <span
              onClick={(e) => { e.preventDefault(); router.push(dest) }}
              className="bg-copper text-white text-xs font-medium px-4 py-2 rounded-xl hover:bg-copper/90 transition cursor-pointer"
            >
              Rent
            </span>
          ) : (
            <span className="bg-ink-100 text-ink-400 text-xs font-medium px-3 py-2 rounded-xl cursor-not-allowed">
              Rented Out
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

const filterSelectCls = `w-full text-sm border border-ink-200 dark:border-surface-raised dark:bg-surface-raised
  dark:text-ink-100 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-copper/30`

const filterInputCls = `w-full text-sm border border-ink-200 dark:border-surface-raised dark:bg-surface-raised
  dark:text-ink-100 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-copper/30`

function ProductsContent() {
  const searchParams = useSearchParams()
  const [q,          setQ]          = useState(searchParams.get('q')          ?? '')
  const [categoryId, setCategoryId] = useState(searchParams.get('categoryId') ?? '')
  const [district,   setDistrict]   = useState(searchParams.get('district')   ?? '')
  const [minPrice,   setMinPrice]   = useState<number | undefined>(undefined)
  const [maxPrice,   setMaxPrice]   = useState<number | undefined>(undefined)
  const [showFilters, setShowFilters] = useState(false)

  const { data: categories } = useCategories()

  const { data, isLoading, isFetching } = useProductSearch({
    q:          q          || undefined,
    district:   district   || undefined,
    categoryId: categoryId || undefined,
    minPrice,
    maxPrice,
    limit: 48,
  })

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const hasActiveFilters = !!(categoryId || district || minPrice !== undefined || maxPrice !== undefined)

  const clearFilters = () => {
    setCategoryId(''); setDistrict(''); setMinPrice(undefined); setMaxPrice(undefined)
  }

  // Find label for selected category
  const selectedCategoryLabel = categoryId
    ? categories?.find((g) => g.id === categoryId)?.name
    : null

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">

      {/* Search + filter toggle */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" aria-hidden />
          <input
            type="search"
            placeholder="Search cameras, tents, tools…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-ink-200 dark:border-surface-raised
                       text-sm outline-none focus:ring-2 focus:ring-copper/30 focus:border-copper
                       bg-white dark:bg-surface-base dark:text-ink-100"
            aria-label="Search products"
          />
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition',
            showFilters
              ? 'border-copper bg-copper/5 text-copper'
              : 'border-ink-200 dark:border-surface-raised text-ink-600 dark:text-ink-400 hover:border-copper/50'
          )}
          aria-expanded={showFilters}
        >
          <SlidersHorizontal size={16} />
          Filters
          {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-copper" aria-label="Active filters" />}
          <ChevronDown size={14} className={cn('transition-transform', showFilters && 'rotate-180')} />
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-white dark:bg-surface-base border border-ink-100 dark:border-surface-raised rounded-2xl p-5 mb-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-ink-500 uppercase tracking-wide mb-2">Category</label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={filterSelectCls}>
                <option value="">All categories</option>
                {categories?.map((group) => (
                  <option key={group.id} value={group.id}>{group.emoji} {group.name}</option>
                ))}
              </select>
            </div>

            {/* Location (district within Dhaka) */}
            <div>
              <label className="block text-xs font-semibold text-ink-500 uppercase tracking-wide mb-2">
                Location <span className="font-normal text-ink-400 normal-case">(area in Dhaka)</span>
              </label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="e.g. Mirpur, Gulshan, Dhanmondi"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className={cn(filterInputCls, 'pl-8')}
                />
              </div>
            </div>

            {/* Price range */}
            <div>
              <label className="block text-xs font-semibold text-ink-500 uppercase tracking-wide mb-2">Price / day (৳)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number" placeholder="Min" min={0} value={minPrice ?? ''}
                  onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : undefined)}
                  className={cn(filterInputCls, 'w-0 flex-1')}
                />
                <span className="text-ink-400 text-sm flex-shrink-0">—</span>
                <input
                  type="number" placeholder="Max" min={0} value={maxPrice ?? ''}
                  onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : undefined)}
                  className={cn(filterInputCls, 'w-0 flex-1')}
                />
              </div>
            </div>
          </div>

          {/* Clear filters */}
          {hasActiveFilters && (
            <div className="pt-3 border-t border-ink-100 dark:border-surface-raised">
              <button onClick={clearFilters}
                className="flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800 dark:hover:text-ink-200 transition">
                <X size={14} /> Clear all filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {selectedCategoryLabel && (
            <span className="flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full bg-copper/10 text-copper border border-copper/20">
              {selectedCategoryLabel}
              <button onClick={() => setCategoryId('')} className="hover:text-copper/70 transition"><X size={11} /></button>
            </span>
          )}
          {district && (
            <span className="flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              <MapPin size={11} /> {district}
              <button onClick={() => setDistrict('')} className="hover:text-blue-500 transition"><X size={11} /></button>
            </span>
          )}
          {(minPrice !== undefined || maxPrice !== undefined) && (
            <span className="flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full bg-ink-100 text-ink-700 border border-ink-200">
              {minPrice !== undefined ? `৳${minPrice}` : '৳0'} — {maxPrice !== undefined ? `৳${maxPrice}` : '∞'}
              <button onClick={() => { setMinPrice(undefined); setMaxPrice(undefined) }} className="hover:text-ink-500 transition"><X size={11} /></button>
            </span>
          )}
        </div>
      )}

      {/* Results count */}
      <p className="text-sm text-ink-500 mb-5 flex items-center gap-2">
        {isFetching && <Loader2 size={14} className="animate-spin text-copper" />}
        {isLoading ? 'Loading…' : `${total} item${total !== 1 ? 's' : ''} found`}
      </p>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-ink-400">
          <p className="text-lg font-medium">No results found</p>
          <p className="text-sm mt-1">Try different keywords or adjust your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((p) => <ApiProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  )
}

export default function ProductsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
            <div className="h-12 bg-ink-100 rounded-xl mb-6 animate-pulse" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          </div>
        }>
          <ProductsContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
