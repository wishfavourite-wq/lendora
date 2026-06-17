'use client'

import { useRef }    from 'react'
import { motion, useInView } from 'framer-motion'
import { ArrowRight, CheckCircle, Zap } from 'lucide-react'
import Link from 'next/link'
import { useStats, formatCount } from '@/lib/hooks/use-stats'

/* Kantha-stitch SVG background pattern */
function KanthaPattern() {
  return (
    <svg
      className="absolute inset-0 w-full h-full opacity-[0.04] dark:opacity-[0.06] pointer-events-none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="kantha" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <line x1="0" y1="20" x2="40" y2="20" stroke="#C87941" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="20" y1="0" x2="20" y2="40" stroke="#C87941" strokeWidth="1" strokeDasharray="4 4" />
          <circle cx="20" cy="20" r="2.5" fill="none" stroke="#C87941" strokeWidth="1" />
          <circle cx="0"  cy="0"  r="1.5" fill="#C87941" opacity="0.5" />
          <circle cx="40" cy="0"  r="1.5" fill="#C87941" opacity="0.5" />
          <circle cx="0"  cy="40" r="1.5" fill="#C87941" opacity="0.5" />
          <circle cx="40" cy="40" r="1.5" fill="#C87941" opacity="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#kantha)" />
    </svg>
  )
}

/* Floating product card — decorative */
function FloatingCard({
  emoji, name, price, rating, delay, className,
}: {
  emoji: string; name: string; price: string; rating: string; delay: number; className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease: 'easeOut' }}
      whileHover={{ scale: 1.04, rotate: 0 }}
      className={`bg-white dark:bg-surface-base border border-ink-100 dark:border-surface-raised
                  rounded-3xl p-4 shadow-warm-lg cursor-default select-none ${className}`}
      aria-hidden="true"
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-ink-100 dark:bg-surface-raised flex items-center justify-center text-2xl flex-shrink-0">
          {emoji}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-ink-900 dark:text-ink-100 truncate">{name}</p>
          <p className="text-xs text-ink-400 dark:text-ink-500 mt-0.5">{rating} ⭐</p>
        </div>
        <div className="ml-auto flex-shrink-0">
          <p className="text-xs font-bold text-copper font-mono">{price}</p>
          <p className="text-[9px] text-ink-400 text-right">/ day</p>
        </div>
      </div>
    </motion.div>
  )
}

export default function HeroSection() {
  const ref       = useRef<HTMLElement | null>(null)
  const isInView  = useInView(ref, { once: true })
  const stats = useStats()

  const containerVariants = {
    hidden:  {},
    visible: { transition: { staggerChildren: 0.12 } },
  }
  const itemVariants = {
    hidden:  { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
  }

  const heroStats = [
    { label: 'Items available',   value: stats ? formatCount(stats.products)      : '—' },
    { label: 'Verified vendors',  value: stats ? String(stats.vendors)             : '—' },
    { label: 'Rentals active',    value: stats ? String(stats.activeRentals)       : '—' },
    { label: 'Cities covered',    value: stats ? String(stats.cities || 1)         : '—' },
  ]

  return (
    <section
      ref={ref}
      id="hero"
      className="relative min-h-[92vh] flex items-center pt-24 pb-16 overflow-hidden
                 bg-ink-50 dark:bg-surface-bg"
      aria-labelledby="hero-heading"
    >
      <KanthaPattern />

      {/* Radial glow */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]
                   rounded-full bg-copper/8 dark:bg-copper/5 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="container-page relative z-10 w-full">
        <div className="grid lg:grid-cols-2 gap-12 xl:gap-20 items-center">

          {/* ── Left column ────────────────────────────────── */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            className="flex flex-col gap-6"
          >
            {/* Eyebrow */}
            <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full
                               bg-copper/10 text-copper border border-copper/20">
                <Zap size={11} aria-hidden="true" />
                Bangladesh&apos;s rental marketplace
              </span>
              {stats !== null && (
                <span className="flex items-center gap-1 text-xs text-forest dark:text-forest-light font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-forest dark:bg-forest-light animate-pulse" aria-hidden="true" />
                  <span aria-live="polite">{stats.activeRentals} rentals active now</span>
                </span>
              )}
            </motion.div>

            {/* Headline */}
            <motion.h1
              id="hero-heading"
              variants={itemVariants}
              className="font-fraunces text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight
                         text-ink-900 dark:text-ink-50 leading-[1.08]"
            >
              Borrow{' '}
              <em className="not-italic text-copper border-b-2 border-copper/40">smarter,</em>
              <br />
              earn from<br />
              <span className="text-ink-400 dark:text-ink-500">what you own.</span>
            </motion.h1>

            {/* Tagline */}
            <motion.p
              variants={itemVariants}
              className="text-base md:text-lg text-ink-600 dark:text-ink-400 leading-relaxed max-w-md"
            >
              Access power tools, baby gear, event equipment, and more — without buying.
              Deposit returned same day.
            </motion.p>

            {/* CTA buttons */}
            <motion.div variants={itemVariants} className="flex flex-wrap gap-3">
              <Link href="/products" className="btn-primary text-sm px-6 py-2.5">
                Browse items
              </Link>
              <Link href="/register?role=VENDOR" className="btn-secondary text-sm px-6 py-2.5">
                Start earning
              </Link>
            </motion.div>

            {/* Stats row — real data from API */}
            <motion.div variants={itemVariants}>
              <dl
                className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-ink-100 dark:border-surface-raised"
                aria-label="Platform statistics"
              >
                {heroStats.map((stat) => (
                  <div key={stat.label} className="flex flex-col gap-0.5">
                    <dt className="text-xs text-ink-500 dark:text-ink-400 leading-tight">{stat.label}</dt>
                    <dd className="font-fraunces text-xl font-bold text-ink-900 dark:text-ink-100">
                      {stat.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </motion.div>
          </motion.div>

          {/* ── Right column — floating cards (lg+) ────────── */}
          <div className="hidden lg:flex flex-col gap-4 relative pt-2" aria-hidden="true">
            <FloatingCard emoji="🔧" name="Bosch Cordless Drill Set" price="৳380"   rating="4.8" delay={0.3}  className="-rotate-[3deg] self-start ml-8" />
            <FloatingCard emoji="🍼" name="Baby Stroller (Lightweight)" price="৳280" rating="4.9" delay={0.45} className="rotate-[2deg] self-end mr-4" />
            <FloatingCard emoji="⛺" name="Party Tent 20×30 ft"     price="৳2,200" rating="4.9" delay={0.6}  className="-rotate-[1.5deg] self-start ml-4" />

            {/* Trust badge — real vendor count */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9, duration: 0.4 }}
              className="self-end flex items-center gap-2 px-4 py-2.5 mt-2
                         bg-forest text-white rounded-2xl shadow-warm-lg text-xs font-semibold"
            >
              <CheckCircle size={14} />
              {stats ? `${stats.vendors} verified vendor${stats.vendors !== 1 ? 's' : ''}` : 'Verified vendors'}
            </motion.div>
          </div>

          {/* Mobile: simplified trust row */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            className="lg:hidden flex items-center justify-center gap-6 pt-2"
            aria-hidden="true"
          >
            {[
              { emoji: '🔧', label: 'Power Tools' },
              { emoji: '🍼', label: 'Baby Gear' },
              { emoji: '🎪', label: 'Events' },
              { emoji: '🏕️', label: 'Camping' },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-1 opacity-60">
                <span className="text-3xl">{item.emoji}</span>
                <span className="text-[10px] text-ink-500 dark:text-ink-500">{item.label}</span>
              </div>
            ))}
          </motion.div>

        </div>
      </div>

      {/* Bottom CTA strip — mobile only */}
      <div className="absolute bottom-0 inset-x-0 flex items-center justify-center gap-4 py-4
                      bg-gradient-to-t from-ink-100/60 dark:from-surface-base/60 to-transparent
                      px-4 md:hidden">
        <Link href="/products" className="btn-primary flex-1 justify-center text-sm">
          Browse items
        </Link>
        <Link href="/register?role=VENDOR" className="btn-secondary flex-1 justify-center text-sm">
          Earn by renting out
        </Link>
      </div>

      {/* Scroll indicator */}
      <motion.a
        href="#featured"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center
                   gap-1.5 text-ink-400 dark:text-ink-600 hover:text-copper transition-colors
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper rounded"
        aria-label="Scroll to featured rentals"
        animate={{ y: [0, 6, 0] }}
        transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
      >
        <ArrowRight size={16} className="rotate-90" aria-hidden="true" />
        <span className="text-[10px] font-medium tracking-wide uppercase sr-only">Scroll</span>
      </motion.a>
    </section>
  )
}
