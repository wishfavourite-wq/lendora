'use client'

import { useRef, useState, useEffect } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { ArrowRight, PackageSearch } from 'lucide-react'
import Link from 'next/link'
import { FEATURED_PRODUCTS, CATEGORIES } from '@/data/homeData'
import ProductCard from '@/components/ui/ProductCard'
import { SkeletonRow } from '@/components/ui/SkeletonCard'

const ALL_TABS = ['All', ...CATEGORIES.slice(0, 6).map((c) => c.name)]

export default function LatestProducts() {
  const ref        = useRef(null as HTMLElement | null)
  const inView     = useInView(ref, { once: true, margin: '-60px' })
  const [tab,      setTab]      = useState('All')
  const [loading,  setLoading]  = useState(false)
  const [tabKey,   setTabKey]   = useState('All')

  const handleTabChange = (next: string) => {
    if (next === tab) return
    setLoading(true)
    setTab(next)
    setTimeout(() => { setLoading(false); setTabKey(next) }, 600)
  }

  const filtered = tabKey === 'All'
    ? FEATURED_PRODUCTS
    : FEATURED_PRODUCTS.filter((p) => p.category === tabKey)

  return (
    <section
      ref={ref}
      className="section-pad bg-ink-50 dark:bg-surface-bg"
      aria-labelledby="latest-heading"
    >
      <div className="container-page">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="section-label mb-2">New arrivals</p>
            <h2 id="latest-heading" className="section-title">Latest on Lendora</h2>
          </div>
          <Link href="/products" className="group flex items-center gap-1.5 text-sm font-semibold text-copper
                                            hover:gap-2.5 transition-all focus-visible:outline-none
                                            focus-visible:ring-2 focus-visible:ring-copper rounded">
            See all
            <ArrowRight size={15} aria-hidden="true" className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Tab bar */}
        <div
          className="flex gap-2 overflow-x-auto scrollbar-none pb-2 mb-8"
          role="tablist"
          aria-label="Filter by category"
        >
          {ALL_TABS.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              aria-controls="latest-grid"
              onClick={() => handleTabChange(t)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-150
                          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper
                          ${tab === t
                            ? 'bg-copper text-white shadow-copper'
                            : 'bg-white dark:bg-surface-base border border-ink-200 dark:border-surface-raised text-ink-600 dark:text-ink-400 hover:border-copper hover:text-copper'}`}
            >
              {t}
              {tab === t && (
                <span className="ml-2 text-xs opacity-70 font-normal">
                  {filtered.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Product grid */}
        <div id="latest-grid" role="tabpanel" aria-label={`${tab} products`}>
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                aria-busy="true"
                aria-label="Loading products…"
              >
                <SkeletonRow count={4} />
              </motion.div>
            ) : filtered.length === 0 ? (
              /* ── Empty state ── */
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4 py-20 text-center"
                role="status"
                aria-live="polite"
              >
                <div className="w-20 h-20 rounded-3xl bg-ink-100 dark:bg-surface-raised flex items-center justify-center">
                  <PackageSearch size={32} className="text-ink-400 dark:text-ink-600" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-semibold text-ink-700 dark:text-ink-300 mb-1">
                    No {tab} items yet
                  </p>
                  <p className="text-sm text-ink-500 dark:text-ink-400 max-w-xs">
                    Be the first to list a {tab.toLowerCase()} item and start earning today.
                  </p>
                </div>
                <Link href="/vendor" className="btn-secondary text-sm">
                  List an item
                </Link>
              </motion.div>
            ) : (
              <motion.ul
                key={tabKey}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
                role="list"
              >
                {filtered.map((product) => (
                  <li key={product.id}>
                    <ProductCard product={product} />
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
