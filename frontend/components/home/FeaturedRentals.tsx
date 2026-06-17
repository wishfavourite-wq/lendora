'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { ArrowRight, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import ProductCard from '@/components/ui/ProductCard'
import { SkeletonRow } from '@/components/ui/SkeletonCard'
import { useStats } from '@/lib/hooks/use-stats'
import { useProductSearch, type ProductSummary } from '@/lib/hooks/use-products'
import type { Product } from '@/data/homeData'

function toCardProduct(p: ProductSummary, i: number): Product {
  return {
    id:             i,
    name:           p.name,
    category:       '',
    pricePerDay:    p.pricePerDay,
    deposit:        p.depositAmount,
    rating:         p.averageRating,
    reviews:        p.reviewCount,
    location:       `${p.district}, ${p.division}`,
    vendor:         p.vendorName,
    vendorVerified: true,
    badge:          p.averageRating >= 4.8 ? 'Top Pick' : p.totalRentals >= 50 ? 'Most Loved' : null,
    emoji:          '📦',
    image:          p.media[0]?.url ?? '',
  }
}

const containerVariants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.08 } },
}
const cardVariants = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
}

export default function FeaturedRentals() {
  const ref    = useRef(null as HTMLElement | null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const stats  = useStats()

  const { data: searchResult, isLoading } = useProductSearch({ limit: 4 })
  const products = (searchResult?.items ?? []).map(toCardProduct)

  return (
    <section
      ref={ref}
      id="featured"
      className="section-pad bg-white dark:bg-surface-base"
      aria-labelledby="featured-heading"
    >
      <div className="container-page">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="section-label mb-2">Featured rentals</p>
            <h2 id="featured-heading" className="section-title">
              Top picks this week
            </h2>
            <p className="section-desc mt-2">
              Power tools, event gear, baby products &amp; camping kits — ready to rent near you.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="flex items-center gap-1.5 text-xs font-medium
                             px-3 py-1.5 rounded-full
                             bg-copper/8 text-copper border border-copper/15"
                  aria-live="polite">
              <TrendingUp size={12} aria-hidden="true" />
              {stats
                ? `${stats.todayRentals} rental${stats.todayRentals !== 1 ? 's' : ''} booked today`
                : 'Rentals booked today'}
            </span>

            <Link
              href="/products"
              className="group flex items-center gap-1.5 text-sm font-semibold text-copper
                         hover:gap-2.5 transition-all focus-visible:outline-none
                         focus-visible:ring-2 focus-visible:ring-copper rounded"
              aria-label="Browse all rental items"
            >
              Browse all
              <ArrowRight size={15} aria-hidden="true" className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* Grid */}
        {isLoading || products.length === 0 ? (
          <div aria-label="Loading products…" aria-busy="true">
            <SkeletonRow count={4} />
          </div>
        ) : (
          <motion.ul
            variants={containerVariants}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            className="grid grid-cols-2 sm:grid-cols-4 gap-5"
            role="list"
            aria-label="Featured rental items"
          >
            {products.map((product, i) => (
              <motion.li key={product.id} variants={cardVariants} role="listitem">
                <ProductCard product={product} priority={i === 0} />
              </motion.li>
            ))}
          </motion.ul>
        )}

        {/* Browse all CTA */}
        <div className="mt-10 text-center">
          <Link href="/products" className="btn-secondary inline-flex">
            Browse all items
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  )
}
