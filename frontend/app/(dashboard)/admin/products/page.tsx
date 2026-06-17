'use client'
import { useState }     from 'react'
import { format }       from 'date-fns'
import {
  Package, CheckCircle, XCircle, Clock, Loader2,
  Eye, X, MapPin, Tag, Truck, Calendar, Star, Archive,
} from 'lucide-react'
import { formatBDT, cn } from '@/lib/utils'
import { useAdminProducts, useApproveProduct, useRejectProduct } from '@/lib/hooks/use-admin'
import { useProduct } from '@/lib/hooks/use-products'

type Tab = 'PENDING_REVIEW' | 'ACTIVE' | 'REJECTED' | 'INACTIVE'

const TABS: { value: Tab; label: string; icon: React.ReactNode }[] = [
  { value: 'PENDING_REVIEW', label: 'Pending',   icon: <Clock       size={14} /> },
  { value: 'ACTIVE',         label: 'Active',    icon: <CheckCircle size={14} /> },
  { value: 'REJECTED',       label: 'Declined',  icon: <XCircle     size={14} /> },
  { value: 'INACTIVE',       label: 'Completed', icon: <Archive     size={14} /> },
]

const CONDITION_LABEL: Record<string, string> = {
  NEW:      'New',
  LIKE_NEW: 'Like New',
  GOOD:     'Good',
  FAIR:     'Fair',
}

function ProductDetailModal({ productId, onClose }: { productId: string; onClose: () => void }) {
  const { data: p, isLoading } = useProduct(productId)
  const [imgIdx, setImgIdx] = useState(0)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="font-fraunces font-bold text-ink-900 text-lg truncate pr-4">
            {isLoading ? 'Loading…' : p?.name}
          </h2>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700 transition flex-shrink-0">
            <X size={20} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-ink-300" />
          </div>
        ) : !p ? (
          <div className="py-20 text-center text-ink-400">Product not found</div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Images */}
            {p.media.length > 0 && (
              <div>
                <div className="w-full h-56 rounded-xl overflow-hidden bg-ink-100">
                  <img src={p.media[imgIdx]?.url} alt={p.name} className="w-full h-full object-cover" />
                </div>
                {p.media.length > 1 && (
                  <div className="flex gap-2 mt-2">
                    {p.media.map((m, i) => (
                      <button
                        key={i}
                        onClick={() => setImgIdx(i)}
                        className={cn(
                          'w-14 h-14 rounded-lg overflow-hidden border-2 transition flex-shrink-0',
                          imgIdx === i ? 'border-copper' : 'border-transparent opacity-60 hover:opacity-100',
                        )}
                      >
                        <img src={m.url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Condition + rating */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-ink-100 text-ink-600">
                {CONDITION_LABEL[p.condition] ?? p.condition}
              </span>
              <span className="flex items-center gap-1 text-sm text-ink-500">
                <Star size={13} className="text-amber-400 fill-amber-400" />
                {p.averageRating.toFixed(1)} ({p.reviewCount} reviews)
              </span>
              <span className="text-xs text-ink-400">{p.totalRentals} rentals</span>
            </div>

            {/* Description */}
            <div>
              <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-1">Description</p>
              <p className="text-sm text-ink-700 leading-relaxed whitespace-pre-wrap">{p.description}</p>
            </div>

            {/* Pricing */}
            <div>
              <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-2">Pricing</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-ink-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-ink-400 mb-0.5">Per day</p>
                  <p className="font-semibold text-ink-800">{formatBDT(p.pricePerDay)}</p>
                </div>
                {p.pricePerWeek && (
                  <div className="bg-ink-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-ink-400 mb-0.5">Per week</p>
                    <p className="font-semibold text-ink-800">{formatBDT(p.pricePerWeek)}</p>
                  </div>
                )}
                {p.pricePerMonth && (
                  <div className="bg-ink-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-ink-400 mb-0.5">Per month</p>
                    <p className="font-semibold text-ink-800">{formatBDT(p.pricePerMonth)}</p>
                  </div>
                )}
                <div className="bg-amber-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-amber-600 mb-0.5">Deposit</p>
                  <p className="font-semibold text-amber-700">{formatBDT(p.depositAmount)}</p>
                </div>
              </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-ink-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-ink-400">Location</p>
                  <p className="text-ink-700">{p.district}, {p.division}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar size={14} className="text-ink-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-ink-400">Rental period</p>
                  <p className="text-ink-700">
                    Min {p.minRentalDays}d{p.maxRentalDays ? ` · Max ${p.maxRentalDays}d` : ''}
                  </p>
                </div>
              </div>
              {p.brand && (
                <div className="flex items-start gap-2">
                  <Tag size={14} className="text-ink-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-ink-400">Brand / Model</p>
                    <p className="text-ink-700">{p.brand}{p.model ? ` · ${p.model}` : ''}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2">
                <Truck size={14} className="text-ink-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-ink-400">Delivery</p>
                  <p className="text-ink-700">
                    {p.deliveryAvailable
                      ? `Available${p.deliveryFee ? ` · ${formatBDT(p.deliveryFee)} fee` : ' · Free'}`
                      : 'Pickup only'}
                  </p>
                </div>
              </div>
            </div>

            {/* Specifications */}
            {p.specifications && Object.keys(p.specifications).length > 0 && (
              <div>
                <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-2">Specifications</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                  {Object.entries(p.specifications).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-sm border-b border-ink-50 pb-1">
                      <span className="text-ink-400">{k}</span>
                      <span className="text-ink-700 font-medium">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {p.tags.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-2">Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {p.tags.map((t) => (
                    <span key={t} className="text-xs px-2.5 py-1 bg-ink-50 text-ink-600 rounded-full">{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminProductApprovalPage() {
  const [tab,       setTab]       = useState<Tab>('PENDING_REVIEW')
  const [page,      setPage]      = useState(1)
  const [viewingId, setViewingId] = useState<string | null>(null)

  const { data, isLoading } = useAdminProducts(tab, page)
  const approve = useApproveProduct()
  const reject  = useRejectProduct()

  const items = data?.items ?? []
  const total = data?.total ?? 0

  const handleTabChange = (t: Tab) => { setTab(t); setPage(1) }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="font-fraunces text-2xl font-bold text-ink-900">Product Approval</h1>
        <p className="text-ink-400 text-sm mt-0.5">
          {isLoading ? 'Loading…' : `${total} ${tab === 'PENDING_REVIEW' ? 'pending' : tab === 'ACTIVE' ? 'approved' : tab === 'REJECTED' ? 'declined' : 'completed'} product${total !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-ink-50 p-1 rounded-xl w-fit">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => handleTabChange(t.value)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition',
              tab === t.value ? 'bg-white shadow-sm text-ink-900' : 'text-ink-500 hover:text-ink-700',
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50">
                {['Product', 'Vendor', 'Category', 'Price/day', 'Location', 'Submitted',
                  tab === 'PENDING_REVIEW' ? 'Actions' : 'Status',
                ].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-ink-400 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-ink-400">
                    <Loader2 size={28} className="mx-auto mb-3 animate-spin opacity-40" />
                    Loading products…
                  </td>
                </tr>
              ) : !items.length ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-ink-400">
                    <Package size={32} className="mx-auto mb-3 opacity-30" />
                    {tab === 'PENDING_REVIEW' ? 'No products awaiting approval'
                      : tab === 'ACTIVE' ? 'No approved products'
                      : tab === 'REJECTED' ? 'No declined products'
                      : 'No completed products'}
                  </td>
                </tr>
              ) : items.map((p) => (
                <tr key={p.id} className="hover:bg-ink-50/50 transition">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-lg overflow-hidden bg-ink-100 flex-shrink-0">
                        {p.imageUrl
                          ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                        }
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-ink-800 truncate max-w-[160px]">{p.name}</p>
                        <p className="text-xs text-ink-400">{CONDITION_LABEL[p.condition] ?? p.condition}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-ink-700 whitespace-nowrap">{p.vendorName}</p>
                    <p className="text-xs text-ink-400 truncate max-w-[130px]">{p.vendorEmail}</p>
                  </td>
                  <td className="px-5 py-4 text-ink-500 whitespace-nowrap">{p.categoryName}</td>
                  <td className="px-5 py-4 font-medium text-ink-800 whitespace-nowrap">{formatBDT(p.pricePerDay)}</td>
                  <td className="px-5 py-4 text-ink-500 whitespace-nowrap text-xs">{p.district}, {p.division}</td>
                  <td className="px-5 py-4 text-ink-400 text-xs whitespace-nowrap">
                    {format(new Date(p.createdAt), 'dd MMM yyyy')}
                  </td>
                  {tab === 'PENDING_REVIEW' ? (
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewingId(p.id)}
                          className="p-1.5 text-ink-400 hover:text-copper border border-ink-200 rounded-lg hover:border-copper/40 transition"
                          title="View details"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => approve.mutate(p.id)}
                          disabled={approve.isPending || reject.isPending}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-forest text-white text-xs font-semibold rounded-lg hover:bg-forest/90 disabled:opacity-50 transition whitespace-nowrap"
                        >
                          {approve.isPending ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle size={11} />}
                          Approve
                        </button>
                        <button
                          onClick={() => reject.mutate({ id: p.id })}
                          disabled={approve.isPending || reject.isPending}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-red-300 text-red-500 text-xs font-semibold rounded-lg hover:bg-red-50 disabled:opacity-50 transition whitespace-nowrap"
                        >
                          {reject.isPending ? <Loader2 size={11} className="animate-spin" /> : <XCircle size={11} />}
                          Decline
                        </button>
                      </div>
                    </td>
                  ) : (
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewingId(p.id)}
                          className="p-1.5 text-ink-400 hover:text-copper border border-ink-200 rounded-lg hover:border-copper/40 transition"
                          title="View details"
                        >
                          <Eye size={14} />
                        </button>
                        <span className={cn(
                          'text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap',
                          tab === 'ACTIVE'   ? 'bg-forest/10 text-forest'
                          : tab === 'REJECTED' ? 'bg-red-100 text-red-500'
                          : 'bg-ink-100 text-ink-500',
                        )}>
                          {tab === 'ACTIVE' ? 'Active' : tab === 'REJECTED' ? 'Declined' : 'Completed'}
                        </span>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-ink-100 text-xs text-ink-500 flex justify-between items-center">
          <span>Page {page} · {total} total</span>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1 rounded-lg border border-ink-200 disabled:opacity-40 hover:bg-ink-50 transition">Prev</button>
            <button onClick={() => setPage((p) => p + 1)} disabled={items.length < 20}
              className="px-3 py-1 rounded-lg border border-ink-200 disabled:opacity-40 hover:bg-ink-50 transition">Next</button>
          </div>
        </div>
      </div>

      {viewingId && (
        <ProductDetailModal productId={viewingId} onClose={() => setViewingId(null)} />
      )}
    </div>
  )
}
