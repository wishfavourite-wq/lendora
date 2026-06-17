'use client'
import Link from 'next/link'
import { useState }       from 'react'
import { useQuery }       from '@tanstack/react-query'
import {
  PlusCircle, Package, Star, Pencil, Eye,
  Clock, CheckCircle, XCircle, AlertCircle,
} from 'lucide-react'
import VendorNavbar     from '@/components/shared/VendorNavbar'
import { useAuthStore } from '@/store/auth.store'
import { api }          from '@/lib/api'
import { formatBDT, cn } from '@/lib/utils'
import type { ProductSummary } from '@/lib/hooks/use-products'

type ProductStatus = 'PENDING_REVIEW' | 'ACTIVE' | 'REJECTED'

interface VendorProduct extends ProductSummary {
  status: ProductStatus
}

const TABS: { value: ProductStatus; label: string; icon: React.ReactNode; emptyMsg: string }[] = [
  {
    value:    'PENDING_REVIEW',
    label:    'Pending',
    icon:     <Clock size={14} />,
    emptyMsg: 'No listings pending review',
  },
  {
    value:    'ACTIVE',
    label:    'Approved',
    icon:     <CheckCircle size={14} />,
    emptyMsg: 'No approved listings yet',
  },
  {
    value:    'REJECTED',
    label:    'Declined',
    icon:     <XCircle size={14} />,
    emptyMsg: 'No declined listings',
  },
]

const STATUS_STYLE: Record<ProductStatus, string> = {
  PENDING_REVIEW: 'bg-amber-100 text-amber-700',
  ACTIVE:         'bg-forest/10 text-forest',
  REJECTED:       'bg-red-100 text-red-600',
}

const STATUS_LABEL: Record<ProductStatus, string> = {
  PENDING_REVIEW: 'Pending review',
  ACTIVE:         'Approved',
  REJECTED:       'Declined',
}

function useVendorProducts(status: ProductStatus) {
  const user = useAuthStore((s) => s.user)
  return useQuery<{ items: VendorProduct[]; total: number }>({
    queryKey: ['vendor', 'my-products', status],
    queryFn:  async () => {
      const { data } = await api.get<{ data: { items: VendorProduct[]; total: number } }>(
        '/vendors/me/products',
        { params: { status, limit: 50 } },
      )
      return data.data
    },
    enabled:   !!user,
    staleTime: 0,
  })
}

export default function VendorProductsPage() {
  const [tab, setTab] = useState<ProductStatus>('PENDING_REVIEW')
  const { data, isLoading } = useVendorProducts(tab)

  const items = data?.items ?? []
  const total = data?.total ?? 0

  return (
    <>
      <VendorNavbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="min-w-0">
            <h1 className="font-fraunces text-2xl font-bold text-ink-900">My Listings</h1>
            <p className="text-ink-400 text-sm mt-0.5">
              {isLoading ? 'Loading…' : `${total} ${TABS.find(t => t.value === tab)?.label.toLowerCase()} listing${total !== 1 ? 's' : ''}`}
            </p>
          </div>
          <Link
            href="/vendor/products/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-copper text-white text-sm font-medium rounded-xl hover:bg-copper/90 transition flex-shrink-0 self-start"
          >
            <PlusCircle size={16} /> Add listing
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-ink-50 p-1 rounded-xl w-fit">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition',
                tab === t.value
                  ? 'bg-white shadow-sm text-ink-900'
                  : 'text-ink-500 hover:text-ink-700',
              )}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Info banner for declined */}
        {tab === 'REJECTED' && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-5 text-sm text-red-700">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <p>These listings were declined by the admin. Edit and resubmit them for another review.</p>
          </div>
        )}

        {/* Info banner for pending */}
        {tab === 'PENDING_REVIEW' && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 text-sm text-amber-800">
            <Clock size={16} className="flex-shrink-0 mt-0.5" />
            <p>These listings are waiting for admin review. You'll be notified once they're approved or declined.</p>
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-ink-100 p-4 flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-ink-100 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-ink-100 rounded w-1/2" />
                  <div className="h-3 bg-ink-100 rounded w-1/3" />
                  <div className="h-3 bg-ink-100 rounded w-1/4" />
                </div>
                <div className="w-16 h-8 bg-ink-100 rounded-xl flex-shrink-0" />
              </div>
            ))}
          </div>
        ) : !items.length ? (
          <div className="text-center py-20">
            <Package size={48} className="mx-auto mb-4 text-ink-200" />
            <p className="text-lg font-medium text-ink-600">
              {TABS.find(t => t.value === tab)?.emptyMsg}
            </p>
            {tab === 'PENDING_REVIEW' && (
              <p className="text-sm text-ink-400 mt-1">Submit a listing and it will appear here while awaiting review.</p>
            )}
            {tab === 'ACTIVE' && (
              <p className="text-sm text-ink-400 mt-1">Approved listings will be visible to customers on the marketplace.</p>
            )}
            <Link
              href="/vendor/products/new"
              className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 bg-copper text-white text-sm font-medium rounded-xl hover:bg-copper/90 transition"
            >
              <PlusCircle size={16} /> Add listing
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((p) => (
              <div
                key={p.id}
                className={cn(
                  'bg-white rounded-2xl border hover:border-ink-200 transition overflow-hidden group',
                  tab === 'REJECTED' ? 'border-red-200' : 'border-ink-100',
                )}
              >
                {/* Image */}
                <div className="aspect-[4/3] relative overflow-hidden bg-ink-50">
                  {p.media[0] ? (
                    <img
                      src={p.media[0].url}
                      alt={p.name}
                      className={cn(
                        'w-full h-full object-cover transition duration-300',
                        tab !== 'REJECTED' && 'group-hover:scale-105',
                        tab === 'PENDING_REVIEW' && 'opacity-80',
                      )}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl opacity-30">📦</div>
                  )}

                  {/* Status badge */}
                  <span className={cn(
                    'absolute top-2 right-2 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1',
                    STATUS_STYLE[tab],
                  )}>
                    {tab === 'PENDING_REVIEW' && <Clock size={10} />}
                    {tab === 'ACTIVE' && <CheckCircle size={10} />}
                    {tab === 'REJECTED' && <XCircle size={10} />}
                    {STATUS_LABEL[tab]}
                  </span>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h2 className="font-semibold text-ink-800 line-clamp-1">{p.name}</h2>
                  <p className="text-xs text-ink-400 mt-0.5">{p.district}, {p.division}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-copper">
                      {formatBDT(p.pricePerDay)}
                      <span className="text-xs text-ink-400 font-normal">/day</span>
                    </span>
                    {tab === 'ACTIVE' && (
                      <span className="flex items-center gap-1 text-xs text-ink-500">
                        <Star size={11} className="text-gold fill-gold" />
                        {p.averageRating.toFixed(1)}
                        <span className="text-ink-300">({p.reviewCount})</span>
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-3 pt-3 border-t border-ink-100">
                    <Link
                      href={`/vendor/products/${p.id}/edit`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium border border-ink-200 rounded-lg hover:border-copper/50 text-ink-600 transition"
                    >
                      <Pencil size={12} /> Edit
                    </Link>
                    {tab === 'ACTIVE' ? (
                      <Link
                        href={`/products/${p.slug}`}
                        target="_blank"
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium bg-ink-50 rounded-lg hover:bg-ink-100 text-ink-600 transition"
                      >
                        <Eye size={12} /> View live
                      </Link>
                    ) : (
                      <span className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs text-ink-300 bg-ink-50 rounded-lg cursor-not-allowed">
                        <Eye size={12} /> Not live
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
