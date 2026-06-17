'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Shield, RefreshCcw, Star, DollarSign, Package, BarChart3, MessageCircle, CheckCircle, ShieldCheck, Zap } from 'lucide-react'
import Link from 'next/link'

const RENTER_BENEFITS = [
  { icon: Shield,      title: 'Deposit fully guaranteed',  desc: 'Your security deposit is held safely and returned the same day as confirmed return.' },
  { icon: RefreshCcw,  title: 'Free cancellation 24h',     desc: 'Cancel any booking for free up to 24 hours before the start date, no questions asked.' },
  { icon: Star,        title: '4.8/5 average rating',      desc: 'Every vendor is reviewed by real, verified renters — not bots.' },
  { icon: DollarSign,  title: 'Save up to 90% vs buying',  desc: 'Pay only for the days you need. No ownership costs, no storage headaches.' },
]

const VENDOR_BENEFITS = [
  { icon: Package,       title: 'Start earning in 24 hours',   desc: 'Complete quick ID verification and list your first item today.' },
  { icon: BarChart3,     title: 'Built-in analytics dashboard', desc: 'Track bookings, earnings, and reviews in real time.' },
  { icon: Zap,           title: 'Instant booking notifications', desc: 'Get real-time alerts the moment a renter books or confirms your listing.' },
  { icon: CheckCircle,   title: 'Verified renter community',   desc: 'Every renter on Lendora is identity-verified, so you always know who you are dealing with.' },
]

export default function Benefits() {
  const ref    = useRef(null as HTMLElement | null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  const containerVariants = {
    hidden:  {},
    visible: { transition: { staggerChildren: 0.1 } },
  }
  const itemVariants = {
    hidden:  { opacity: 0, x: -12 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.45 } },
  }

  return (
    <section
      ref={ref}
      className="section-pad bg-ink-50 dark:bg-surface-bg"
      aria-labelledby="benefits-heading"
    >
      <div className="container-page">
        <div className="text-center max-w-xl mx-auto mb-12">
          <p className="section-label mb-2">Why Lendora</p>
          <h2 id="benefits-heading" className="section-title">Built for renters and vendors</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">

          {/* Renters card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55 }}
            className="card-base p-6 md:p-8"
          >
            <div className="mb-6">
              <div className="w-10 h-10 rounded-2xl bg-copper/10 flex items-center justify-center mb-3">
                <Shield size={18} className="text-copper" aria-hidden="true" />
              </div>
              <h3 className="font-fraunces text-xl font-bold text-ink-900 dark:text-ink-100">For renters</h3>
              <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">Access anything, own nothing</p>
            </div>

            <motion.ul
              variants={containerVariants}
              initial="hidden"
              animate={inView ? 'visible' : 'hidden'}
              className="space-y-4"
              role="list"
            >
              {RENTER_BENEFITS.map((b) => (
                <motion.li key={b.title} variants={itemVariants} className="flex items-start gap-3" role="listitem">
                  <div className="w-8 h-8 rounded-xl bg-copper/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <b.icon size={15} className="text-copper" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink-800 dark:text-ink-200">{b.title}</p>
                    <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5 leading-relaxed">{b.desc}</p>
                  </div>
                </motion.li>
              ))}
            </motion.ul>

            <div className="mt-8">
              <Link href="/products" className="btn-primary w-full justify-center">
                Browse items now
              </Link>
            </div>
          </motion.div>

          {/* Vendors card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay: 0.12 }}
            className="relative overflow-hidden rounded-3xl bg-forest p-6 md:p-8 text-white"
          >
            {/* Decorative SVG circles */}
            <svg className="absolute -top-8 -right-8 w-40 h-40 opacity-10" viewBox="0 0 160 160" aria-hidden="true">
              <circle cx="80" cy="80" r="70" stroke="#D4A843" strokeWidth="2" fill="none" />
              <circle cx="80" cy="80" r="50" stroke="#D4A843" strokeWidth="1.5" fill="none" />
              <circle cx="80" cy="80" r="30" stroke="#D4A843" strokeWidth="1" fill="none" />
            </svg>

            <div className="mb-6 relative z-10">
              <div className="w-10 h-10 rounded-2xl bg-gold/20 flex items-center justify-center mb-3">
                <Zap size={18} className="text-gold" aria-hidden="true" />
              </div>
              <h3 className="font-fraunces text-xl font-bold text-white">For vendors</h3>
              <p className="text-xs text-white/60 mt-0.5">Turn idle items into income</p>
            </div>

            <ul className="space-y-4 relative z-10" role="list">
              {VENDOR_BENEFITS.map((b) => (
                <li key={b.title} className="flex items-start gap-3" role="listitem">
                  <div className="w-8 h-8 rounded-xl bg-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <b.icon size={15} className="text-gold" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{b.title}</p>
                    <p className="text-xs text-white/60 mt-0.5 leading-relaxed">{b.desc}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-6 relative z-10">
              <Link href="/register?role=VENDOR" className="btn-primary w-full justify-center bg-gold hover:bg-gold/90 text-ink-900">
                <CheckCircle size={15} aria-hidden="true" />
                Start earning today
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
