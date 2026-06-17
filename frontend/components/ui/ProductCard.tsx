'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Star, MapPin, CheckCircle, ShieldCheck } from 'lucide-react'
import { formatBDT } from '@/lib/utils'
import type { Product } from '@/data/homeData'

interface Props {
  product: Product
  priority?: boolean
}

export default function ProductCard({ product, priority }: Props) {
  const [imgError, setImgError] = useState(false)

  return (
    <motion.article
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="group card-base card-hover relative flex flex-col"
      aria-label={`${product.name} — ${formatBDT(product.pricePerDay)} per day`}
    >
      {/* Image area — clean, no overlays */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-ink-100 to-ink-200 dark:from-surface-raised dark:to-surface-overlay overflow-hidden rounded-t-3xl">
        {imgError ? (
          <div className="absolute inset-0 flex items-center justify-center text-5xl select-none" aria-hidden="true">
            {product.emoji}
          </div>
        ) : (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            priority={priority}
            onError={() => setImgError(true)}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2 p-4 flex-1">
        {/* Category + badge row */}
        <div className="flex items-center gap-2">
          <span className="badge-neutral text-[10px]">{product.category}</span>
          {product.badge && (
            <span className="text-[10px] font-semibold text-copper">{product.badge}</span>
          )}
        </div>

        {/* Name */}
        <h3 className="font-semibold text-sm text-ink-900 dark:text-ink-100 leading-snug line-clamp-2 group-hover:text-copper transition-colors">
          {product.name}
        </h3>

        {/* Vendor row */}
        <div className="flex items-center gap-1.5">
          {product.vendorVerified && (
            <CheckCircle size={12} className="text-forest flex-shrink-0" aria-hidden="true" />
          )}
          <span className="text-xs text-ink-500 dark:text-ink-400 truncate">{product.vendor}</span>
          {product.vendorVerified && (
            <span className="sr-only">Verified vendor</span>
          )}
        </div>

        {/* Rating + location */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1" aria-label={`Rated ${product.rating} out of 5`}>
            <Star size={12} className="fill-gold stroke-gold" aria-hidden="true" />
            <span className="text-xs font-semibold text-ink-700 dark:text-ink-300">{product.rating}</span>
            <span className="text-xs text-ink-400 dark:text-ink-500">({product.reviews})</span>
          </div>
          <div className="flex items-center gap-1 text-ink-400 dark:text-ink-500" aria-label={`Location: ${product.location}`}>
            <MapPin size={11} aria-hidden="true" />
            <span className="text-xs">{product.location}</span>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Price row + deposit */}
        <div className="flex items-end justify-between pt-2 border-t border-ink-100 dark:border-surface-raised">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="price-tag text-base font-bold">
                {formatBDT(product.pricePerDay)}
              </span>
              <span className="text-xs text-ink-400 dark:text-ink-500">/ day</span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <ShieldCheck size={10} className="text-forest" aria-hidden="true" />
              <span className="text-[10px] text-ink-400 dark:text-ink-500">
                {formatBDT(product.deposit ?? product.pricePerDay * 3)} deposit
              </span>
            </div>
          </div>

          {/* Visible rent link — full accessible target */}
          <a
            href="/register?role=RENTER"
            className="btn-primary text-xs px-4 py-2 min-h-0 h-8 rounded-xl"
            aria-label={`Rent ${product.name} — sign up to continue`}
          >
            Rent
          </a>
        </div>
      </div>
    </motion.article>
  )
}
