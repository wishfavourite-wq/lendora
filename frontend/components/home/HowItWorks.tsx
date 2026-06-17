'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { HOW_IT_WORKS } from '@/data/homeData'
import { cn } from '@/lib/utils'

const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
}

const stagger = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.12 } },
}

export default function HowItWorks() {
  const ref      = useRef(null as HTMLElement | null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="section-pad bg-white dark:bg-surface-base" id="how-it-works">
      <div className="container-page">

        {/* Header */}
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={stagger}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <motion.p variants={fadeUp} className="section-label mb-3">How It Works</motion.p>
          <motion.h2 variants={fadeUp} className="section-title">
            Rent in 4 simple steps
          </motion.h2>
          <motion.p variants={fadeUp} className="section-desc mx-auto mt-3">
            From browsing to returning — the whole process takes minutes to set up.
          </motion.p>
        </motion.div>

        {/* Steps */}
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={stagger}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative"
        >
          {/* Connecting line (desktop) */}
          <div
            className="hidden lg:block absolute top-12 left-[calc(12.5%+20px)] right-[calc(12.5%+20px)]
                       h-px bg-gradient-to-r from-transparent via-ink-200 dark:via-surface-raised to-transparent
                       pointer-events-none"
            aria-hidden="true"
          />

          {HOW_IT_WORKS.map((step, i) => (
            <motion.div
              key={step.step}
              variants={fadeUp}
              className="flex flex-col items-center text-center gap-4 group"
            >
              {/* Step icon circle */}
              <div className="relative">
                <div
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-ink-50 dark:bg-surface-raised
                             border-2 border-ink-200 dark:border-surface-overlay
                             group-hover:border-copper group-hover:shadow-copper
                             flex items-center justify-center text-3xl sm:text-4xl
                             transition-all duration-300"
                >
                  {step.emoji}
                </div>
                {/* Step number */}
                <div
                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-copper text-white
                             flex items-center justify-center text-xs font-bold"
                >
                  {step.step}
                </div>
              </div>

              {/* Content */}
              <div>
                <h3 className="font-fraunces font-semibold text-lg tracking-tight
                               text-ink-900 dark:text-ink-100 mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-ink-500 dark:text-ink-400 leading-relaxed max-w-[220px] mx-auto">
                  {step.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="flex justify-center mt-12"
        >
          <a href="/products" className="btn-primary">
            Start browsing
          </a>
          <a href="/register?role=VENDOR" className="btn-ghost ml-3">
            List your item
          </a>
        </motion.div>
      </div>
    </section>
  )
}
