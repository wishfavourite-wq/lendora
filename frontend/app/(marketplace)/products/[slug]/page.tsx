'use client'
import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link             from 'next/link'
import { format, addDays, differenceInDays, max as dateMax, parseISO } from 'date-fns'
import {
  Star, MapPin, Truck, Zap, Shield, ChevronLeft,
  CheckCircle, AlertCircle, Calendar, Package,
} from 'lucide-react'
import Navbar           from '@/components/shared/Navbar'
import VendorNavbar     from '@/components/shared/VendorNavbar'
import Footer           from '@/components/home/Footer'
import SkeletonCard     from '@/components/ui/SkeletonCard'
import { useProduct, useProductAvailability } from '@/lib/hooks/use-products'
import { useAuthStore } from '@/store/auth.store'
import { formatBDT }   from '@/lib/utils'
import { cn }          from '@/lib/utils'

export default function ProductDetailPage() {
  const params        = useParams<{ slug: string }>()
  const router        = useRouter()
  const user          = useAuthStore((s) => s.user)
  const isVendor      = user?.role === 'VENDOR'
  const { data: product, isLoading, isError } = useProduct(params.slug)
  const { data: unavailableDates } = useProductAvailability(product?.id ?? '')

  const [selectedImage, setSelectedImage]     = useState(0)
  const [startDate, setStartDate]             = useState<Date | null>(null)
  const [endDate, setEndDate]                 = useState<Date | null>(null)
  const [selectedDelivery, setSelectedDelivery] = useState('')

  const totalDays = startDate && endDate ? Math.max(1, differenceInDays(endDate, startDate)) : 0
  const rentalFee = product ? totalDays * product.pricePerDay : 0

  // Resolve delivery options the same way the checkout page does
  const availableDeliveryOptions: string[] = (() => {
    if (!product) return []
    const opts = (product as any).deliveryOptions
    if (Array.isArray(opts) && opts.length > 0) return opts.filter((o: string) => o !== 'SELLER_DELIVERY')
    if (product.deliveryAvailable) return ['CUSTOMER_PICKUP', 'COURIER']
    return ['CUSTOMER_PICKUP']
  })()

  // Auto-select first available option when product loads
  useEffect(() => {
    if (availableDeliveryOptions.length > 0 && !selectedDelivery) {
      setSelectedDelivery(availableDeliveryOptions[0]!)
    }
  }, [availableDeliveryOptions.join(',')])

  // Delivery fee based on selected method
  const widgetDeliveryFee = (() => {
    if (!selectedDelivery || selectedDelivery === 'CUSTOMER_PICKUP') return 0
    return 0 // COURIER — shown accurately at checkout
  })()
  const totalAmount = rentalFee + widgetDeliveryFee

  const isUnavailable = (date: Date) =>
    unavailableDates?.some((d) => d.toDateString() === date.toDateString()) ?? false

  // Detect whether the product is currently rented out (today is blocked)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const isRentedNow = unavailableDates?.some(
    (d) => d.toDateString() === today.toDateString()
  ) ?? false

  // Find the next date the product becomes free again
  const nextAvailableDate = (() => {
    if (!isRentedNow || !unavailableDates) return null
    const blocked = new Set(unavailableDates.map((d) => d.toDateString()))
    const cursor  = new Date(today)
    for (let i = 0; i < 365; i++) {
      cursor.setDate(cursor.getDate() + 1)
      if (!blocked.has(cursor.toDateString())) return new Date(cursor)
    }
    return null
  })()

  const handleBook = () => {
    if (!user) { router.push('/login'); return }
    if (!startDate || !endDate || !product) return
    const from = format(startDate, 'yyyy-MM-dd')
    const to   = format(endDate,   'yyyy-MM-dd')
    const deliveryParam = selectedDelivery ? `&delivery=${selectedDelivery}` : ''
    router.push(`/rent/${product.id}?from=${from}&to=${to}${deliveryParam}`)
  }

  if (isLoading) {
    return (
      <>
        {isVendor ? <VendorNavbar /> : <Navbar />}
        <div className="max-w-7xl mx-auto px-4 pt-24 pb-8">
          <div className="grid lg:grid-cols-2 gap-10">
            <div className="space-y-4">
              <div className="aspect-[4/3] bg-ink-100 rounded-2xl animate-pulse" />
              <div className="grid grid-cols-4 gap-2">
                {[...Array(4)].map((_, i) => <div key={i} className="aspect-square bg-ink-100 rounded-xl animate-pulse" />)}
              </div>
            </div>
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => <div key={i} className="h-5 bg-ink-100 rounded animate-pulse" style={{ width: `${80 - i * 10}%` }} />)}
            </div>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  if (isError || !product) {
    return (
      <>
        {isVendor ? <VendorNavbar /> : <Navbar />}
        <div className="max-w-7xl mx-auto px-4 pt-24 pb-20 text-center">
          <p className="text-xl font-semibold text-ink-700">Product not found</p>
          <Link href="/products" className="mt-4 inline-block text-copper hover:underline">← Browse all products</Link>
        </div>
        <Footer />
      </>
    )
  }

  const primaryImage = product.media[selectedImage]?.url ?? product.media[0]?.url ?? '/placeholder.jpg'

  return (
    <>
      {isVendor ? <VendorNavbar /> : <Navbar />}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        <Link href="/products" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800 mb-6 transition">
          <ChevronLeft size={16} /> Back
        </Link>

        <div className="grid md:grid-cols-[1fr_320px] lg:grid-cols-[1fr_400px] gap-6 lg:gap-10">
          {/* Left: images + details */}
          <div>
            {/* Title + meta */}
            <h1 className="font-fraunces text-2xl font-bold text-ink-900 mb-2">{product.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-ink-500 mb-4">
              <span className="flex items-center gap-1">
                <Star size={14} className="text-gold fill-gold" />
                <strong className="text-ink-700">{product.averageRating.toFixed(1)}</strong>
                <span>({product.reviewCount} reviews)</span>
              </span>
              <span className="flex items-center gap-1">
                <MapPin size={14} /> {product.district}, {product.division}
              </span>
              {product.deliveryAvailable && (
                <span className="flex items-center gap-1 text-forest">
                  <Truck size={14} /> Delivery available
                </span>
              )}
            </div>

            <p className="text-ink-600 leading-relaxed mb-6">{product.description}</p>

            {/* Main image */}
            <div className="relative rounded-2xl overflow-hidden bg-ink-50 mb-3 flex items-center justify-center" style={{ maxHeight: '360px', height: '360px' }}>
              <img src={primaryImage} alt={product.name} className="max-h-full max-w-full object-contain" />
              {product.isInstantBooking && (
                <span className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-forest font-semibold text-xs px-3 py-1.5 rounded-full shadow">
                  <Zap size={12} className="text-gold" fill="currentColor" /> Instant Booking
                </span>
              )}
            </div>

            {/* Thumbnails */}
            {product.media.length > 1 && (
              <div className="grid grid-cols-5 gap-2 mb-6">
                {product.media.slice(0, 5).map((m, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={cn('aspect-square relative rounded-xl overflow-hidden', selectedImage === i ? 'ring-2 ring-copper' : 'opacity-70 hover:opacity-100')}
                  >
                    <img src={m.url} alt={m.altText ?? product.name} className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}

            {/* Specs */}
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div className="border border-ink-100 rounded-xl p-5 mb-6">
                <h2 className="font-semibold text-ink-800 mb-3">Specifications</h2>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  {Object.entries(product.specifications).map(([k, v]) => (
                    <div key={k} className="flex flex-col">
                      <dt className="text-ink-400 text-xs">{k}</dt>
                      <dd className="text-ink-700 font-medium">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {/* Tags */}
            {product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <span key={tag} className="text-xs bg-ink-100 text-ink-500 px-3 py-1 rounded-full">#{tag}</span>
                ))}
              </div>
            )}
          </div>

          {/* Right: booking panel */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="bg-white border border-ink-100 rounded-2xl p-6 shadow-sm">
              {/* Pricing — always visible */}
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-fraunces text-3xl font-bold text-ink-900">{formatBDT(product.pricePerDay)}</span>
                <span className="text-ink-400 text-sm">/ day</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-ink-500 mb-5">
                <Shield size={13} className="text-copper" />
                Deposit: {formatBDT(product.depositAmount)} · refunded after return
              </div>

              {/* Availability window */}
              {(product.availableFrom || product.availableUntil) && (
                <div className="flex items-center gap-2 bg-forest/5 border border-forest/20 rounded-xl px-3 py-2.5 mb-4 text-xs text-forest">
                  <Calendar size={13} className="flex-shrink-0" />
                  <span>
                    <span className="font-semibold">Available: </span>
                    {product.availableFrom
                      ? format(parseISO(product.availableFrom), 'dd MMM yyyy')
                      : 'Now'}
                    {' – '}
                    {product.availableUntil
                      ? format(parseISO(product.availableUntil), 'dd MMM yyyy')
                      : 'Ongoing'}
                  </span>
                </div>
              )}

              {/* ── Rented Out banner ── */}
              {isRentedNow && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle size={15} className="text-red-500 flex-shrink-0" />
                    <p className="font-semibold text-red-700 text-sm">Currently Rented Out</p>
                  </div>
                  <p className="text-xs text-red-600 leading-relaxed">
                    This item is currently with another renter and cannot be booked right now.
                  </p>
                  {nextAvailableDate && (
                    <div className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-forest">
                      <Calendar size={12} />
                      Available from <span className="font-bold">{format(nextAvailableDate, 'dd MMM yyyy')}</span>
                    </div>
                  )}
                </div>
              )}

              {!user ? (
                /* ── Guest: sign-up CTA ── */
                <div className="space-y-3">
                  <Link
                    href={`/register?role=RENTER`}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-copper text-white font-semibold rounded-xl hover:bg-copper/90 transition"
                  >
                    Sign up to rent this
                  </Link>
                  <p className="text-center text-xs text-ink-400">
                    Already have an account?{' '}
                    <Link href="/login" className="text-copper hover:underline font-medium">Sign in</Link>
                  </p>
                </div>
              ) : isVendor ? (
                /* ── Vendor: cannot rent ── */
                <div className="rounded-xl border border-ink-100 bg-ink-50 p-4 text-center space-y-2">
                  <p className="text-sm font-semibold text-ink-700">You&apos;re logged in as a Vendor</p>
                  <p className="text-xs text-ink-400 leading-relaxed">Vendor accounts cannot rent items. Use a separate customer account to rent.</p>
                </div>
              ) : (
                /* ── Logged-in customer: booking form ── */
                <>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {(() => {
                      const earliestStart = product.availableFrom
                        ? dateMax([new Date(), parseISO(product.availableFrom)])
                        : new Date()
                      const latestDate = product.availableUntil
                        ? parseISO(product.availableUntil)
                        : undefined
                      return [
                        {
                          label: 'Start date', value: startDate, setter: (d: Date | null) => { setStartDate(d); setEndDate(null) },
                          min: earliestStart, max: latestDate,
                        },
                        {
                          label: 'End date', value: endDate, setter: setEndDate,
                          min: startDate ? addDays(startDate, product.minRentalDays) : earliestStart,
                          max: latestDate,
                        },
                      ]
                    })().map(({ label, value, setter, min, max }) => (
                      <div key={label}>
                        <label className="block text-xs font-medium text-ink-500 mb-1">{label}</label>
                        <input
                          type="date"
                          min={format(min, 'yyyy-MM-dd')}
                          max={max ? format(max, 'yyyy-MM-dd') : undefined}
                          value={value ? format(value, 'yyyy-MM-dd') : ''}
                          onChange={(e) => setter(e.target.value ? new Date(e.target.value) : null)}
                          className="w-full text-sm border border-ink-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-copper/30"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Availability & rental duration hints */}
                  {(() => {
                    const hints: { icon: React.ReactNode; text: string }[] = []
                    if (product.availableFrom || product.availableUntil) {
                      const from = product.availableFrom ? format(parseISO(product.availableFrom), 'dd MMM yyyy') : null
                      const until = product.availableUntil ? format(parseISO(product.availableUntil), 'dd MMM yyyy') : null
                      hints.push({
                        icon: <Calendar size={11} className="text-copper flex-shrink-0 mt-0.5" />,
                        text: from && until
                          ? `Available ${from} – ${until}`
                          : from
                            ? `Available from ${from}`
                            : `Available until ${until}`,
                      })
                    }
                    if (product.minRentalDays > 1) {
                      hints.push({
                        icon: <CheckCircle size={11} className="text-ink-400 flex-shrink-0 mt-0.5" />,
                        text: `Minimum rental: ${product.minRentalDays} days`,
                      })
                    }
                    if (product.maxRentalDays) {
                      hints.push({
                        icon: <CheckCircle size={11} className="text-ink-400 flex-shrink-0 mt-0.5" />,
                        text: `Maximum rental: ${product.maxRentalDays} days`,
                      })
                    }
                    if (hints.length === 0) return null
                    return (
                      <div className="mb-4 rounded-lg bg-ink-50 border border-ink-100 px-3 py-2.5 flex flex-col gap-1.5">
                        {hints.map((h, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-[11px] text-ink-500">
                            {h.icon}
                            <span>{h.text}</span>
                          </div>
                        ))}
                      </div>
                    )
                  })()}

                  {/* Delivery method selector */}
                  {availableDeliveryOptions.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-ink-500 mb-2">Delivery method</p>
                      <div className="flex flex-col gap-1.5">
                        {availableDeliveryOptions.map((opt) => {
                          const cfg = {
                            CUSTOMER_PICKUP: { label: 'Customer Pickup', hint: 'You collect from the seller · Free', icon: MapPin },
                            COURIER:         { label: 'Courier Service', hint: 'Shipped via courier · Fee at checkout', icon: Package },
                          }[opt as 'CUSTOMER_PICKUP' | 'COURIER']
                          if (!cfg) return null
                          const Icon = cfg.icon
                          const isSelected = selectedDelivery === opt
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setSelectedDelivery(opt)}
                              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition ${
                                isSelected ? 'border-copper bg-copper/5' : 'border-ink-200 hover:border-ink-300'
                              }`}
                            >
                              <Icon size={14} className={`flex-shrink-0 ${isSelected ? 'text-copper' : 'text-ink-400'}`} />
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs font-medium ${isSelected ? 'text-copper' : 'text-ink-700'}`}>{cfg.label}</p>
                                <p className="text-[10px] text-ink-400 leading-snug">{cfg.hint}</p>
                              </div>
                              {isSelected && <CheckCircle size={13} className="text-copper flex-shrink-0" />}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {totalDays > 0 && (
                    <div className="bg-ink-50 rounded-xl p-4 mb-4 space-y-2 text-sm">
                      <div className="flex justify-between text-ink-600">
                        <span>{formatBDT(product.pricePerDay)} × {totalDays} day{totalDays > 1 ? 's' : ''}</span>
                        <span>{formatBDT(rentalFee)}</span>
                      </div>
                      {widgetDeliveryFee > 0 && (
                        <div className="flex justify-between text-ink-600">
                          <span>Delivery fee</span>
                          <span>{formatBDT(widgetDeliveryFee)}</span>
                        </div>
                      )}
                      {selectedDelivery === 'COURIER' && (
                        <div className="flex justify-between text-ink-400 text-xs">
                          <span>Courier fee</span>
                          <span>shown at checkout</span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold text-ink-800 pt-2 border-t border-ink-200">
                        <span>Total</span>
                        <span>{formatBDT(totalAmount)}</span>
                      </div>
                      <div className="flex justify-between text-ink-500">
                        <span>Security deposit</span>
                        <span className="text-forest">{formatBDT(product.depositAmount)} (refundable)</span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleBook}
                    disabled={isRentedNow || !startDate || !endDate}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-copper text-white font-semibold rounded-xl hover:bg-copper/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {isRentedNow
                      ? 'Not Available Right Now'
                      : !startDate || !endDate
                        ? 'Select dates to rent'
                        : `Rent · ${formatBDT(totalAmount)}`}
                  </button>
                </>
              )}

              {/* Trust badges */}
              <div className="mt-5 space-y-2 text-xs text-ink-500">
                {[
                  { icon: CheckCircle, text: 'Free cancellation before vendor confirms' },
                  { icon: Shield,      text: 'Deposit returned within 24h of return' },
                  { icon: AlertCircle, text: 'Dispute protection on every rental' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-start gap-2">
                    <Icon size={13} className="text-forest mt-0.5 flex-shrink-0" />
                    {text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
