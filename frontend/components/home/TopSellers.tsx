'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Star, CheckCircle, MapPin, ArrowRight, Clock } from 'lucide-react'
import Link from 'next/link'
import { TOP_SELLERS } from '@/data/homeData'
import { useTopSellers, formatResponseTime, type ApiTopSeller } from '@/lib/hooks/use-top-sellers'

/* Normalise both demo and API data to the same display shape */
interface DisplaySeller {
  id:           string | number
  name:         string
  avatar:       string
  tagline:      string
  district:     string
  rating:       number
  reviews:      number
  items:        number
  topItems:     string[]
  verified:     boolean
  badge:        string | null
  responseTime: string
}

function fromApi(v: ApiTopSeller, rank: number): DisplaySeller {
  const initials = v.businessName.charAt(0).toUpperCase()
  return {
    id:           v.id,
    name:         v.businessName,
    avatar:       initials,
    tagline:      v.businessDescription ?? 'Verified Lendora vendor',
    district:     `${v.district}, ${v.division}`,
    rating:       v.averageRating,
    reviews:      v.totalRentals,
    items:        v.productCount,
    topItems:     v.topProducts,
    verified:     v.verifiedAt !== null,
    badge:        rank === 0 ? 'Top Vendor' : null,
    responseTime: formatResponseTime(v.responseTimeMinutes),
  }
}

export default function TopSellers() {
  const ref    = useRef(null as HTMLElement | null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const apiSellers = useTopSellers()

  /* Use real data if API returned any vendors; otherwise show demo */
  const sellers: DisplaySeller[] = (apiSellers && apiSellers.length > 0)
    ? apiSellers.map((v, i) => fromApi(v, i))
    : TOP_SELLERS.map((v) => ({
        id:           v.id,
        name:         v.name,
        avatar:       v.avatar,
        tagline:      v.tagline,
        district:     v.district,
        rating:       v.rating,
        reviews:      v.reviews,
        items:        v.items,
        topItems:     v.topItems,
        verified:     v.verified,
        badge:        v.badge,
        responseTime: v.responseTime,
      }))

  const containerVariants = {
    hidden:  {},
    visible: { transition: { staggerChildren: 0.1 } },
  }
  const itemVariants = {
    hidden:  { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  }

  return (
    <section
      ref={ref}
      className="section-pad bg-white dark:bg-surface-base"
      aria-labelledby="sellers-heading"
    >
      <div className="container-page">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="section-label mb-2">Trusted vendors</p>
            <h2 id="sellers-heading" className="section-title">Top sellers this month</h2>
            <p className="section-desc mt-2">All vendors are identity-verified and rated by real renters.</p>
          </div>
          <Link
            href="/vendors"
            className="group flex items-center gap-1.5 text-sm font-semibold text-copper
                       hover:gap-2.5 transition-all focus-visible:outline-none
                       focus-visible:ring-2 focus-visible:ring-copper rounded"
          >
            View all vendors
            <ArrowRight size={15} aria-hidden="true" className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Vendor cards */}
        <motion.ul
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
          role="list"
          aria-label="Top vendor profiles"
        >
          {sellers.map((vendor, i) => (
            <motion.li key={vendor.id} variants={itemVariants} role="listitem">
              <Link
                href={`/vendors/${vendor.id}`}
                className="group card-base card-hover flex flex-col gap-4 p-5 h-full
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper
                           focus-visible:ring-offset-2"
                aria-label={`${vendor.name} — ${vendor.rating} stars, ${vendor.items} items`}
              >
                {/* Rank + avatar row */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold
                                  flex-shrink-0 ${i === 0 ? 'bg-gold text-ink-900' : i === 1 ? 'bg-ink-200 dark:bg-surface-raised text-ink-700 dark:text-ink-300' : 'bg-ink-100 dark:bg-surface-raised text-ink-500'}`}
                      aria-label={`Ranked #${i + 1}`}
                    >
                      {i + 1}
                    </div>
                    <div
                      className="w-11 h-11 rounded-2xl bg-copper/10 dark:bg-surface-raised flex items-center justify-center text-lg font-bold text-copper select-none"
                      aria-hidden="true"
                    >
                      {vendor.avatar}
                    </div>
                  </div>

                  {vendor.badge && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      i === 0 ? 'bg-gold/20 text-amber-700 dark:text-gold' : 'badge-neutral'
                    }`}>
                      {vendor.badge}
                    </span>
                  )}
                </div>

                {/* Name + verified */}
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-ink-900 dark:text-ink-100 group-hover:text-copper transition-colors">
                      {vendor.name}
                    </h3>
                    {vendor.verified && (
                      <CheckCircle size={13} className="text-forest flex-shrink-0" aria-label="Verified vendor" />
                    )}
                  </div>
                  <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5 line-clamp-1">{vendor.tagline}</p>
                </div>

                {/* Rating + location */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1" aria-label={`${vendor.rating} star rating from ${vendor.reviews} rentals`}>
                    <Star size={12} className="fill-gold stroke-gold" aria-hidden="true" />
                    <span className="font-semibold text-ink-700 dark:text-ink-300">{vendor.rating.toFixed(1)}</span>
                    <span className="text-ink-400 dark:text-ink-500">({vendor.reviews})</span>
                  </div>
                  <div className="flex items-center gap-1 text-ink-400" aria-label={`Location: ${vendor.district}`}>
                    <MapPin size={11} aria-hidden="true" />
                    <span className="truncate max-w-[80px]">{vendor.district}</span>
                  </div>
                </div>

                {/* Response time */}
                <div className="flex items-center gap-1.5 text-xs text-forest dark:text-forest-light">
                  <Clock size={11} aria-hidden="true" />
                  <span>Responds {vendor.responseTime}</span>
                </div>

              </Link>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  )
}
