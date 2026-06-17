'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Star, CheckCircle, MapPin, Clock, Package, ArrowLeft } from 'lucide-react'
import { api } from '@/lib/api'
import { formatResponseTime, type ApiTopSeller } from '@/lib/hooks/use-top-sellers'

export default function VendorsPage() {
  const [vendors, setVendors]   = useState<ApiTopSeller[]>([])
  const [loading, setLoading]   = useState(true)
  const [total,   setTotal]     = useState(0)
  const [page,    setPage]      = useState(1)
  const limit = 20

  useEffect(() => {
    setLoading(true)
    api.get<{ data: { items: ApiTopSeller[]; total: number } }>(`/vendors?page=${page}&limit=${limit}`)
      .then(({ data }) => {
        setVendors(data.data.items)
        setTotal(data.data.total)
      })
      .catch(() => setVendors([]))
      .finally(() => setLoading(false))
  }, [page])

  const totalPages = Math.ceil(total / limit)

  return (
    <main id="main-content" className="min-h-screen bg-ink-50 dark:bg-surface-bg pt-24 pb-16">
      <div className="container-page">

        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-copper transition-colors mb-6"
        >
          <ArrowLeft size={14} />
          Back
        </Link>

        {/* Header */}
        <div className="mb-10">
          <p className="section-label mb-2">Marketplace</p>
          <h1 className="section-title">All verified vendors</h1>
          <p className="section-desc mt-2">
            {total > 0 ? `${total} verified vendor${total !== 1 ? 's' : ''} ready to rent out their items.` : 'Browse vendors on the platform.'}
          </p>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card-base p-5 animate-pulse">
                <div className="flex gap-3 mb-4">
                  <div className="w-11 h-11 rounded-2xl bg-ink-200 dark:bg-surface-raised" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-ink-200 dark:bg-surface-raised rounded w-3/4" />
                    <div className="h-2 bg-ink-100 dark:bg-surface-overlay rounded w-1/2" />
                  </div>
                </div>
                <div className="h-2 bg-ink-100 dark:bg-surface-overlay rounded w-full mb-2" />
                <div className="h-2 bg-ink-100 dark:bg-surface-overlay rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : vendors.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-ink-400 dark:text-ink-500 text-sm">No vendors found yet. Be the first to list your items!</p>
            <Link href="/register" className="btn-primary mt-6 inline-flex">
              Become a vendor
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {vendors.map((v) => (
              <Link
                key={v.id}
                href={`/vendors/${v.id}`}
                className="group card-base card-hover flex flex-col gap-4 p-5
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper focus-visible:ring-offset-2"
                aria-label={`${v.businessName} — ${v.averageRating.toFixed(1)} stars`}
              >
                {/* Avatar + name */}
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-copper/10 dark:bg-surface-raised flex items-center justify-center text-lg font-bold text-copper select-none flex-shrink-0">
                    {v.businessName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <h2 className="text-sm font-bold text-ink-900 dark:text-ink-100 group-hover:text-copper transition-colors truncate">
                        {v.businessName}
                      </h2>
                      {v.verifiedAt && (
                        <CheckCircle size={12} className="text-forest flex-shrink-0" aria-label="Verified" />
                      )}
                    </div>
                    <p className="text-xs text-ink-500 dark:text-ink-400 line-clamp-1 mt-0.5">
                      {v.businessDescription ?? 'Verified Lendora vendor'}
                    </p>
                  </div>
                </div>

                {/* Rating + location */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <Star size={12} className="fill-gold stroke-gold" aria-hidden="true" />
                    <span className="font-semibold text-ink-700 dark:text-ink-300">{v.averageRating.toFixed(1)}</span>
                    <span className="text-ink-400 dark:text-ink-500">({v.totalRentals})</span>
                  </div>
                  <div className="flex items-center gap-1 text-ink-400">
                    <MapPin size={11} aria-hidden="true" />
                    <span className="truncate max-w-[80px]">{v.district}</span>
                  </div>
                </div>

                {/* Meta row */}
                <div className="flex items-center justify-between text-xs text-ink-500 dark:text-ink-400 pt-3 border-t border-ink-100 dark:border-surface-raised">
                  <div className="flex items-center gap-1 text-forest dark:text-forest-light">
                    <Clock size={11} aria-hidden="true" />
                    <span>{formatResponseTime(v.responseTimeMinutes)}</span>
                  </div>
                  <div className="flex items-center gap-1 font-semibold text-copper">
                    <Package size={11} aria-hidden="true" />
                    <span>{v.productCount} items</span>
                  </div>
                </div>

                {/* Top products */}
                {v.topProducts.length > 0 && (
                  <div className="flex flex-col gap-1">
                    {v.topProducts.map((name) => (
                      <span key={name} className="text-[11px] text-ink-600 dark:text-ink-400 truncate">{name}</span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary text-sm px-4 py-2 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-ink-500">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-secondary text-sm px-4 py-2 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}

        {/* Become a vendor CTA */}
        <div className="mt-16 text-center p-8 rounded-3xl bg-forest text-white">
          <h2 className="font-fraunces text-2xl font-bold mb-2">Have items to rent out?</h2>
          <p className="text-white/70 text-sm mb-6">Join verified vendors earning from their idle items.</p>
          <Link href="/register" className="btn-primary bg-gold hover:bg-gold/90 text-ink-900 inline-flex">
            Start earning today
          </Link>
        </div>

      </div>
    </main>
  )
}
