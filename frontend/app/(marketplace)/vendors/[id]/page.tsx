'use client'

import { useState, useEffect } from 'react'
import { useParams }           from 'next/navigation'
import Link                    from 'next/link'
import {
  ArrowLeft, Star, MapPin, CheckCircle, Clock, Package,
  ShieldCheck, Calendar, Package2, UserRound, Truck, Loader2,
} from 'lucide-react'
import Navbar  from '@/components/shared/Navbar'
import Footer  from '@/components/home/Footer'
import { api } from '@/lib/api'
import { formatBDT, cn } from '@/lib/utils'
import { formatResponseTime } from '@/lib/hooks/use-top-sellers'

/* ── Types ───────────────────────────────────────────────────────────────── */

interface PublicVendor {
  id:                  string
  businessName:        string
  businessDescription: string | null
  businessAddress:     string | null
  district:            string
  division:            string
  averageRating:       number
  totalRentals:        number
  responseTimeMinutes: number | null
  verifiedAt:          string | null
  status:              string
  userName:            string
  avatarUrl:           string | null
}

interface VendorProduct {
  id:               string
  name:             string
  slug:             string
  pricePerDay:      number
  depositAmount:    number
  averageRating:    number
  reviewCount:      number
  district:         string
  isInstantBooking: boolean
  minRentalDays:    number
  maxRentalDays:    number | null
  availableFrom:    string | null
  availableUntil:   string | null
  deliveryOptions:  string[]
  deliveryAvailable: boolean
  media:            Array<{ url: string; altText: string | null; isPrimary: boolean }>
}

/* ── Delivery badges ─────────────────────────────────────────────────────── */

const DELIVERY_META: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  CUSTOMER_PICKUP: { label: 'Pickup',  icon: <UserRound size={9} />, cls: 'bg-blue-50 text-blue-600' },
  COURIER:         { label: 'Courier', icon: <Package2  size={9} />, cls: 'bg-amber-50 text-amber-700' },
}

function fmtShortDate(d: string | null | undefined): string | null {
  if (!d) return null
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

/* ── Product card ────────────────────────────────────────────────────────── */

function VendorProductCard({ product }: { product: VendorProduct }) {
  const [imgErr, setImgErr] = useState(false)
  const image       = product.media.find((m) => m.isPrimary)?.url ?? product.media[0]?.url
  const fromDate    = fmtShortDate(product.availableFrom)
  const toDate      = fmtShortDate(product.availableUntil)
  const rentalRange = product.maxRentalDays
    ? `Max ${product.maxRentalDays} day${product.maxRentalDays !== 1 ? 's' : ''}`
    : `Min ${product.minRentalDays ?? 1} day${(product.minRentalDays ?? 1) !== 1 ? 's' : ''}`
  const deliveryOpts: string[] =
    Array.isArray(product.deliveryOptions) && product.deliveryOptions.length > 0
      ? product.deliveryOptions
      : product.deliveryAvailable
        ? ['CUSTOMER_PICKUP', 'COURIER']
        : ['CUSTOMER_PICKUP']

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group bg-white dark:bg-surface-base rounded-3xl border border-ink-100 dark:border-surface-raised
                 hover:border-copper/30 hover:shadow-md transition flex flex-col overflow-hidden"
    >
      <div className="aspect-[4/3] relative overflow-hidden bg-ink-100">
        {image && !imgErr
          ? <img src={image} alt={product.name} onError={() => setImgErr(true)} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
          : <div className="w-full h-full flex items-center justify-center text-4xl opacity-30">📦</div>
        }
      </div>
      <div className="flex flex-col gap-2 p-4 flex-1">
        <h3 className="font-semibold text-sm text-ink-900 dark:text-ink-100 leading-snug line-clamp-2 group-hover:text-copper transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <Star size={12} className="fill-gold stroke-gold" />
            <span className="font-semibold text-ink-700 dark:text-ink-300">{product.averageRating.toFixed(1)}</span>
            <span className="text-ink-400">({product.reviewCount})</span>
          </div>
          <div className="flex items-center gap-1 text-ink-400">
            <MapPin size={11} />
            <span>{product.district}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-ink-500">
          <span>{rentalRange}</span>
          {(fromDate || toDate) && (
            <>
              <span className="text-ink-200">·</span>
              <span className="flex items-center gap-0.5">
                <Calendar size={9} className="flex-shrink-0" />
                {fromDate ?? 'Now'} – {toDate ?? 'Ongoing'}
              </span>
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-1">
          {deliveryOpts.map((opt) => {
            const meta = DELIVERY_META[opt]
            if (!meta) return null
            return (
              <span key={opt} className={cn('flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded-full', meta.cls)}>
                {meta.icon}{meta.label}
              </span>
            )
          })}
        </div>

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
          <span className="text-xs font-medium px-4 py-2 h-8 rounded-xl bg-copper text-white group-hover:bg-copper/90 transition flex items-center">
            View
          </span>
        </div>
      </div>
    </Link>
  )
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function VendorProfilePage() {
  const { id } = useParams<{ id: string }>()

  const [vendor,   setVendor]   = useState<PublicVendor | null>(null)
  const [products, setProducts] = useState<VendorProduct[]>([])
  const [loading,  setLoading]  = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([
      api.get<{ data: PublicVendor }>(`/vendors/${id}`),
      api.get<{ data: { items: VendorProduct[] } }>(`/vendors/${id}/products`),
    ])
      .then(([vRes, pRes]) => {
        setVendor(vRes.data.data)
        setProducts(pRes.data.data.items ?? [])
      })
      .catch((err) => {
        if (err?.response?.status === 404) setNotFound(true)
      })
      .finally(() => setLoading(false))
  }, [id])

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-ink-50 dark:bg-surface-bg pt-24 pb-16">
        <div className="container-page">

          <Link href="/vendors" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-copper transition-colors mb-6">
            <ArrowLeft size={14} /> All Vendors
          </Link>

          {loading && (
            <div className="animate-pulse space-y-6">
              <div className="bg-white rounded-2xl p-6 flex items-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-ink-100 flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-6 bg-ink-100 rounded w-1/3" />
                  <div className="h-4 bg-ink-100 rounded w-1/2" />
                  <div className="h-4 bg-ink-100 rounded w-1/4" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-white rounded-2xl" />)}
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => <div key={i} className="h-64 bg-white rounded-2xl" />)}
              </div>
            </div>
          )}

          {!loading && notFound && (
            <div className="text-center py-24">
              <p className="text-ink-400 text-sm">Vendor not found.</p>
              <Link href="/vendors" className="text-copper text-sm hover:underline mt-2 inline-block">← Back to vendors</Link>
            </div>
          )}

          {!loading && vendor && (
            <>
              {/* Vendor header card */}
              <div className="bg-white dark:bg-surface-base rounded-2xl border border-ink-100 dark:border-surface-raised p-6 mb-8">
                <div className="flex items-start gap-5">
                  {vendor.avatarUrl ? (
                    <img src={vendor.avatarUrl} alt={vendor.businessName}
                      className="w-20 h-20 rounded-2xl object-cover flex-shrink-0 border border-ink-100" />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-copper/10 text-copper font-bold text-2xl flex items-center justify-center flex-shrink-0 select-none">
                      {vendor.businessName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <h1 className="font-fraunces text-xl font-bold text-ink-900 dark:text-ink-100">
                        {vendor.businessName}
                      </h1>
                      {vendor.verifiedAt && (
                        <CheckCircle size={16} className="text-forest flex-shrink-0" aria-label="Verified vendor" />
                      )}
                    </div>
                    {vendor.businessDescription && (
                      <p className="text-sm text-ink-500 dark:text-ink-400 mt-1 leading-relaxed max-w-xl">
                        {vendor.businessDescription}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3 text-sm">
                      <div className="flex items-center gap-1.5">
                        <Star size={14} className="fill-gold stroke-gold" />
                        <span className="font-semibold text-ink-700 dark:text-ink-300">{vendor.averageRating.toFixed(1)}</span>
                        <span className="text-ink-400">({vendor.totalRentals} rentals)</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-ink-500">
                        <MapPin size={13} />
                        <span>{vendor.district}, {vendor.division}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-forest dark:text-forest-light">
                        <Clock size={13} />
                        <span>Responds {formatResponseTime(vendor.responseTimeMinutes)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-copper font-medium">
                        <Package size={13} />
                        <span>{products.length} item{products.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Products section */}
              <div>
                <h2 className="font-fraunces text-lg font-bold text-ink-900 dark:text-ink-100 mb-5">
                  Items by {vendor.businessName}
                </h2>

                {products.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-surface-base rounded-2xl border border-ink-100">
                    <Package size={32} className="mx-auto mb-3 text-ink-300" />
                    <p className="text-sm text-ink-400">No active listings at the moment.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {products.map((p) => <VendorProductCard key={p.id} product={p} />)}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
