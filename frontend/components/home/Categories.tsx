'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCategories } from '@/lib/hooks/use-categories'

const CARD_COLORS = [
  { color: 'from-orange-100 to-orange-50 dark:from-surface-raised dark:to-surface-base', textColor: 'text-orange-700 dark:text-orange-300' },
  { color: 'from-purple-100 to-purple-50 dark:from-surface-raised dark:to-surface-base', textColor: 'text-purple-700 dark:text-purple-300' },
  { color: 'from-pink-100  to-pink-50   dark:from-surface-raised dark:to-surface-base', textColor: 'text-pink-700   dark:text-pink-300'   },
  { color: 'from-green-100 to-green-50  dark:from-surface-raised dark:to-surface-base', textColor: 'text-green-700  dark:text-green-300'  },
  { color: 'from-blue-100  to-blue-50   dark:from-surface-raised dark:to-surface-base', textColor: 'text-blue-700   dark:text-blue-300'   },
  { color: 'from-amber-100 to-amber-50  dark:from-surface-raised dark:to-surface-base', textColor: 'text-amber-700  dark:text-amber-300'  },
]

const fadeUp = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
}

const stagger = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.06 } },
}

export default function Categories() {
  const ref      = useRef(null as HTMLElement | null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  const { data: categories = [] } = useCategories()

  const FEATURED_SLUGS = ['power-tools', 'event-equipment', 'baby-products', 'camping-travel-gear']
  const rootCategories = FEATURED_SLUGS
    .map((slug) => categories.find((c) => c.slug === slug))
    .filter((c): c is NonNullable<typeof c> => c !== undefined)

  return (
    <section ref={ref} className="section-pad bg-ink-50 dark:bg-surface-bg" id="categories">
      <div className="container-page">

        {/* Header */}
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={stagger}
          className="flex items-end justify-between mb-10"
        >
          <div className="flex flex-col gap-2">
            <motion.p variants={fadeUp} className="section-label">Browse by Category</motion.p>
            <motion.h2 variants={fadeUp} className="section-title">Find what you need</motion.h2>
          </div>
        </motion.div>

        {/* Grid */}
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={stagger}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          {rootCategories.map((cat, i) => {
            const palette = CARD_COLORS[i % CARD_COLORS.length]!
            return (
              <motion.a
                key={cat.id}
                href={`/products?categoryId=${cat.id}`}
                variants={fadeUp}
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  'group relative flex flex-col items-center justify-center gap-3',
                  'bg-gradient-to-br rounded-3xl p-4 sm:p-6 min-h-[120px] sm:min-h-[140px]',
                  'border border-transparent hover:border-copper',
                  'shadow-warm-sm hover:shadow-warm-md transition-all duration-200',
                  'cursor-pointer overflow-hidden',
                  palette.color,
                )}
              >
                {/* Emoji */}
                <span
                  className="text-5xl transition-transform duration-200 group-hover:scale-110"
                  role="img"
                  aria-label={cat.name}
                >
                  {cat.emoji}
                </span>

                {/* Name */}
                <div className="text-center">
                  <p className={cn('font-fraunces font-semibold text-base tracking-tight', palette.textColor)}>
                    {cat.name}
                  </p>
                  <p className="text-xs text-ink-400 dark:text-ink-500 mt-0.5">
                    {cat.productCount} item{cat.productCount !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Arrow on hover */}
                <div
                  className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/60 dark:bg-surface-raised/60
                             backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100
                             transition-opacity duration-200"
                >
                  <ArrowRight className="w-3 h-3 text-ink-600 dark:text-ink-400" />
                </div>
              </motion.a>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
