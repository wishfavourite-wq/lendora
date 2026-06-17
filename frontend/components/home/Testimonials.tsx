'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Star, Quote, CheckCircle, ShieldCheck } from 'lucide-react'
import { TESTIMONIALS } from '@/data/homeData'
import { useReviews, type ApiReview } from '@/lib/hooks/use-reviews'

function StarRow({ count, max = 5 }: { count: number; max?: number }) {
  return (
    <div className="flex gap-0.5" role="img" aria-label={`${count} out of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => (
        <Star key={i} size={13} className={i < count ? 'fill-gold stroke-gold' : 'stroke-ink-200 dark:stroke-ink-700'} aria-hidden="true" />
      ))}
    </div>
  )
}

/* Unified display shape for both demo and real reviews */
interface DisplayReview {
  id:        string | number
  rating:    number
  body:      string
  daysAgo:   number
  item:      string
  name:      string
  avatar:    string   // emoji (demo) or initial letter (real)
  role:      string
  district:  string
}

function fromApi(r: ApiReview): DisplayReview {
  return {
    id:       r.id,
    rating:   r.rating,
    body:     r.body,
    daysAgo:  r.daysAgo,
    item:     r.productName,
    name:     r.reviewerName,
    avatar:   r.reviewerInitial,
    role:     'Verified renter',
    district: 'Bangladesh',
  }
}

export default function Testimonials() {
  const ref    = useRef(null as HTMLElement | null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const data   = useReviews()

  /* Real reviews if available, else demo */
  const reviews: DisplayReview[] = (data && data.reviews.length > 0)
    ? data.reviews.map(fromApi)
    : TESTIMONIALS.map((t) => ({
        id:       t.id,
        rating:   t.rating,
        body:     t.quote,
        daysAgo:  t.daysAgo,
        item:     t.item,
        name:     t.name,
        avatar:   t.name.charAt(0).toUpperCase(),
        role:     t.role,
        district: t.district,
      }))

  /* Real stats if available, else demo copy */
  const avgRating      = data?.stats.averageRating    ?? null
  const totalReviews   = data?.stats.totalReviews     ?? 0
  const depositReturn  = data?.stats.depositReturnRate ?? null

  const trustStats = [
    {
      value: avgRating !== null ? `${avgRating}/5` : '4.8/5',
      label: 'Average rating',
      icon:  <Star size={14} className="fill-gold stroke-gold" aria-hidden="true" />,
      live:  avgRating !== null,
    },
    {
      value: totalReviews > 0
        ? totalReviews >= 1000 ? `${(totalReviews / 1000).toFixed(1)}K+` : `${totalReviews}+`
        : '120+',
      label: 'Verified reviews',
      icon:  <CheckCircle size={14} className="text-forest" aria-hidden="true" />,
      live:  totalReviews > 0,
    },
    {
      value: depositReturn !== null ? `${depositReturn}%` : '98%',
      label: 'Deposit returned',
      icon:  <ShieldCheck size={14} className="text-forest" aria-hidden="true" />,
      live:  depositReturn !== null,
    },
  ]

  const containerVariants = {
    hidden:  {},
    visible: { transition: { staggerChildren: 0.1 } },
  }
  const itemVariants = {
    hidden:  { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
  }

  return (
    <section
      ref={ref}
      className="section-pad bg-ink-50 dark:bg-surface-bg"
      aria-labelledby="testimonials-heading"
    >
      <div className="container-page">

        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-12">
          <p className="section-label mb-2">Real renters, real results</p>
          <h2 id="testimonials-heading" className="section-title">
            Trusted by thousands across Bangladesh
          </h2>
        </div>

        {/* Aggregate trust bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-3 gap-4 mb-12 max-w-lg mx-auto text-center"
          role="list"
          aria-label="Platform trust statistics"
        >
          {trustStats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-1" role="listitem">
              <div className="flex items-center gap-1.5">
                {stat.icon}
                <span
                  className="font-fraunces text-2xl font-bold text-ink-900 dark:text-ink-100"
                  aria-live={stat.live ? 'polite' : undefined}
                >
                  {stat.value}
                </span>
              </div>
              <span className="text-xs text-ink-500 dark:text-ink-400">{stat.label}</span>
            </div>
          ))}
        </motion.div>

        {/* Cards */}
        <motion.ul
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
          role="list"
          aria-label="Customer testimonials"
        >
          {reviews.map((t) => (
            <motion.li key={t.id} variants={itemVariants} role="listitem">
              <figure className="card-base h-full flex flex-col p-5 gap-4">
                {/* Quote icon + stars */}
                <div className="flex items-start justify-between">
                  <Quote size={20} className="text-copper/30" aria-hidden="true" />
                  <StarRow count={t.rating} />
                </div>

                {/* Verified rental badge */}
                <div className="flex items-center gap-1.5">
                  <CheckCircle size={11} className="text-forest flex-shrink-0" aria-hidden="true" />
                  <span className="text-[10px] font-semibold text-forest dark:text-forest-light uppercase tracking-wide">
                    Verified rental
                  </span>
                  <span className="text-[10px] text-ink-400 dark:text-ink-500 ml-auto">
                    {t.daysAgo}d ago
                  </span>
                </div>

                {/* Quote text */}
                <blockquote className="flex-1">
                  <p className="text-sm text-ink-700 dark:text-ink-300 leading-relaxed">
                    &ldquo;{t.body}&rdquo;
                  </p>
                </blockquote>

                {/* Item rented pill */}
                <div className="px-3 py-1.5 rounded-full bg-copper/8 dark:bg-copper/10
                                border border-copper/15 text-xs text-copper font-medium self-start truncate max-w-full">
                  {t.item}
                </div>

                {/* Attribution */}
                <figcaption className="flex items-center gap-3 pt-3 border-t border-ink-100 dark:border-surface-raised">
                  <div
                    className="w-9 h-9 rounded-full bg-copper/10 dark:bg-surface-raised
                               flex items-center justify-center text-base font-bold text-copper flex-shrink-0"
                    aria-hidden="true"
                  >
                    {t.avatar}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink-900 dark:text-ink-100 truncate">{t.name}</p>
                    <p className="text-xs text-ink-500 dark:text-ink-400 truncate">{t.role} · {t.district}</p>
                  </div>
                </figcaption>
              </figure>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  )
}
