'use client'
import React, { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link                           from 'next/link'
import { format, addDays, differenceInDays, parseISO } from 'date-fns'
import {
  ChevronLeft, Loader2, Shield, Truck, Calendar,
  Clock, CheckCircle, MapPin, Package, User, AlertCircle,
} from 'lucide-react'
import Navbar                         from '@/components/shared/Navbar'
import Footer                         from '@/components/home/Footer'
import { useProduct, useProductAvailability } from '@/lib/hooks/use-products'
import { useCreateRental }            from '@/lib/hooks/use-rentals'
import { useAuthStore }               from '@/store/auth.store'
import { formatBDT, cn }              from '@/lib/utils'
import { useQuery }                   from '@tanstack/react-query'
import { api }                        from '@/lib/api'

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-ink-700">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

const inputCls = (err?: string) =>
  cn('w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 transition bg-white',
    err ? 'border-red-300 focus:ring-red-200' : 'border-ink-200 focus:ring-copper/30 focus:border-copper')

const DELIVERY_LABELS: Record<string, { title: string; desc: string; icon: React.ElementType }> = {
  CUSTOMER_PICKUP: { title: 'Customer Pickup', desc: 'You pick up the item from the seller.',      icon: MapPin  },
  COURIER:         { title: 'Courier Service', desc: 'Item shipped via courier (charges apply).', icon: Package },
}

export default function RentalRequestPage() {
  const { productId } = useParams<{ productId: string }>()
  const searchParams  = useSearchParams()
  const router        = useRouter()
  const user          = useAuthStore((s) => s.user)
  const createRental  = useCreateRental()

  const { data: product, isLoading, isError } = useProduct(productId)
  const { data: unavailableDates } = useProductAvailability(product?.id ?? '')

  // Compute next available date from unavailableDates
  const nextAvailableDate = (() => {
    if (!unavailableDates) return null
    const todayD = new Date(); todayD.setHours(0, 0, 0, 0)
    const blocked = new Set(unavailableDates.map((d) => d.toDateString()))
    const cursor  = new Date(todayD)
    for (let i = 0; i < 365; i++) {
      if (!blocked.has(cursor.toDateString())) return cursor
      cursor.setDate(cursor.getDate() + 1)
    }
    return null
  })()

  // Fetch global courier fees
  const { data: courierFees } = useQuery<{ forwardFee: number; returnFee: number }>({
    queryKey: ['courier-fees'],
    queryFn:  async () => {
      const { data } = await api.get<{ data: { forwardFee: number; returnFee: number } }>('/products/courier-fees')
      return data.data
    },
    staleTime: 5 * 60 * 1000,
  })

  const fromParam     = searchParams.get('from')
  const toParam       = searchParams.get('to')
  const deliveryParam = searchParams.get('delivery')

  const [startDate,        setStartDate]        = useState(fromParam ?? '')
  const [endDate,          setEndDate]          = useState(toParam   ?? '')
  const [bkashNumber,      setBkashNumber]      = useState('')
  const [bkashError,       setBkashError]       = useState('')
  const [selectedDelivery, setSelectedDelivery] = useState<string>(deliveryParam ?? '')
  const [deliveryAddr,     setDeliveryAddr]     = useState('')
  const [notes,            setNotes]            = useState('')
  const [errors,           setErrors]           = useState<Record<string, string>>({})

  // Parse deliveryOptions from product (JSON field)
  const availableOptions: string[] = (() => {
    if (!product) return []
    const opts = (product as any).deliveryOptions
    if (Array.isArray(opts)) return opts
    if (typeof opts === 'string') {
      try { return JSON.parse(opts) } catch { return [] }
    }
    // Fall back to inferred from deliveryAvailable
    if (product.deliveryAvailable) return ['CUSTOMER_PICKUP', 'COURIER']
    return ['CUSTOMER_PICKUP']
  })()

  // Auto-select: prefer URL param if it's in the available options, else first available
  useEffect(() => {
    if (availableOptions.length === 0) return
    if (deliveryParam && availableOptions.includes(deliveryParam) && !selectedDelivery) {
      setSelectedDelivery(deliveryParam)
    } else if (!selectedDelivery) {
      setSelectedDelivery(availableOptions[0]!)
    }
  }, [availableOptions.join(',')])

  useEffect(() => {
    if (!user) router.replace('/login')
  }, [user, router])

  const totalDays = startDate && endDate
    ? Math.max(0, differenceInDays(parseISO(endDate), parseISO(startDate)))
    : 0

  const rentalFee = product ? totalDays * product.pricePerDay : 0

  // Compute delivery fee for selected method
  const courierForwardFee = courierFees?.forwardFee ?? 60
  const courierReturnFee  = courierFees?.returnFee  ?? 40

  const deliveryFee = (() => {
    if (!selectedDelivery || selectedDelivery === 'CUSTOMER_PICKUP') return 0
    if (selectedDelivery === 'COURIER') return courierForwardFee
    return 0
  })()

  const subTotal = rentalFee + deliveryFee
  const deposit  = product?.depositAmount ?? 0
  const totalDue = subTotal + deposit

  const today  = format(new Date(), 'yyyy-MM-dd')
  const minEnd = startDate && product
    ? format(addDays(parseISO(startDate), product.minRentalDays), 'yyyy-MM-dd')
    : today
  const maxEnd = startDate && product?.maxRentalDays
    ? format(addDays(parseISO(startDate), product.maxRentalDays), 'yyyy-MM-dd')
    : undefined

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!startDate) errs.startDate = 'Select a start date'
    if (!endDate)   errs.endDate   = 'Select an end date'
    if (startDate && endDate && totalDays < 1)
      errs.endDate = 'End date must be after start date'
    if (product?.minRentalDays && totalDays > 0 && totalDays < product.minRentalDays)
      errs.endDate = `Minimum rental is ${product.minRentalDays} day${product.minRentalDays > 1 ? 's' : ''}`
    if (!bkashNumber)
      errs.bkash = 'Enter your bKash number'
    else if (!/^01[3-9]\d{8}$/.test(bkashNumber))
      errs.bkash = 'Enter a valid Bangladeshi mobile number (01XXXXXXXXX)'
    if (selectedDelivery === 'COURIER' && !deliveryAddr.trim())
      errs.deliveryAddr = 'Enter a delivery address'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async () => {
    if (!validate() || !product) return
    const renterNotes = [
      `Demo bKash payment: ${bkashNumber}`,
      notes.trim() ? `Notes: ${notes.trim()}` : '',
    ].filter(Boolean).join(' | ')

    const needsAddress = selectedDelivery === 'COURIER'

    const rental = await createRental.mutateAsync({
      productId:        product.id,
      startDate:        new Date(startDate).toISOString(),
      endDate:          new Date(endDate).toISOString(),
      selectedDelivery: selectedDelivery || undefined,
      deliveryAddress:  needsAddress ? deliveryAddr : undefined,
      renterNotes,
    })
    router.push(`/rentals/${rental.id}?submitted=1`)
  }

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-24 pb-10 animate-pulse space-y-5">
          <div className="h-4 w-28 bg-ink-100 rounded" />
          <div className="h-7 w-2/3 bg-ink-100 rounded" />
          <div className="h-48 bg-ink-100 rounded-2xl" />
          <div className="h-36 bg-ink-100 rounded-2xl" />
          <div className="h-28 bg-ink-100 rounded-2xl" />
          <div className="h-12 bg-ink-100 rounded-xl" />
        </div>
      </>
    )
  }

  if (isError || !product) {
    return (
      <>
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <p className="text-ink-600">Product not found.</p>
          <Link href="/products" className="text-copper hover:underline text-sm mt-2 inline-block">← Browse products</Link>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-24 pb-10">
        {/* Back */}
        <Link href={`/products/${product.slug}`} className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800 mb-6 transition">
          <ChevronLeft size={16} /> Back
        </Link>

        <h1 className="font-fraunces text-2xl font-bold text-ink-900 mb-1">Request to rent</h1>
        <p className="text-ink-400 text-sm mb-6">Fill in your details and the seller will confirm your request.</p>

        {/* Product summary card */}
        <div className="flex items-center gap-4 bg-white border border-ink-100 rounded-2xl p-4 mb-6">
          <div className="w-20 h-20 rounded-xl overflow-hidden bg-ink-50 flex-shrink-0">
            {product.media[0]
              ? <img src={product.media[0].url} alt={product.name} className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-ink-100" />}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-ink-900 truncate">{product.name}</p>
            <p className="text-sm text-ink-400 flex items-center gap-1 mt-0.5">
              <MapPin size={12} /> {product.district}, {product.division}
            </p>
            <p className="text-sm text-copper font-semibold mt-1">{formatBDT(product.pricePerDay)} / day</p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Dates */}
          <section className="bg-white rounded-2xl border border-ink-100 p-6 space-y-4">
            <h2 className="font-semibold text-ink-800 flex items-center gap-2">
              <Calendar size={16} className="text-copper" /> Rental dates
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Start date" error={errors.startDate}>
                <input
                  type="date"
                  min={today}
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setEndDate('') }}
                  className={inputCls(errors.startDate)}
                />
              </Field>
              <Field label="End date" error={errors.endDate}>
                <input
                  type="date"
                  min={minEnd}
                  max={maxEnd}
                  value={endDate}
                  disabled={!startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={inputCls(errors.endDate)}
                />
              </Field>
            </div>
            {/* Availability hints */}
            {(() => {
              const hints: { icon: React.ReactNode; text: string; cls?: string }[] = []
              if (product.availableFrom || product.availableUntil) {
                const from  = product.availableFrom  ? format(parseISO(product.availableFrom),  'dd MMM yyyy') : null
                const until = product.availableUntil ? format(parseISO(product.availableUntil), 'dd MMM yyyy') : null
                hints.push({
                  icon: <Calendar size={12} className="text-copper flex-shrink-0 mt-0.5" />,
                  text: from && until ? `Available ${from} – ${until}` : from ? `Available from ${from}` : `Available until ${until!}`,
                })
              }
              if (product.minRentalDays > 1)
                hints.push({ icon: <CheckCircle size={12} className="text-ink-400 flex-shrink-0 mt-0.5" />, text: `Minimum rental: ${product.minRentalDays} days` })
              if (product.maxRentalDays)
                hints.push({ icon: <CheckCircle size={12} className="text-ink-400 flex-shrink-0 mt-0.5" />, text: `Maximum rental: ${product.maxRentalDays} days` })
              if (hints.length === 0) return null
              return (
                <div className="rounded-lg bg-ink-50 border border-ink-100 px-3 py-2.5 flex flex-col gap-1.5">
                  {hints.map((h, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-[11px] text-ink-500">{h.icon}<span>{h.text}</span></div>
                  ))}
                </div>
              )
            })()}

            {totalDays > 0 && (
              <div className="flex items-center gap-2 text-sm text-ink-500 bg-ink-50 rounded-xl px-4 py-2.5">
                <Clock size={14} className="text-copper" />
                <span><strong className="text-ink-700">{totalDays} day{totalDays > 1 ? 's' : ''}</strong> rental</span>
                {product.minRentalDays > 1 && (
                  <span className="text-ink-400">· Min {product.minRentalDays} days</span>
                )}
              </div>
            )}
          </section>

          {/* Delivery method */}
          {availableOptions.length > 0 && (
            <section className="bg-white rounded-2xl border border-ink-100 p-6 space-y-4">
              <h2 className="font-semibold text-ink-800 flex items-center gap-2">
                <Truck size={16} className="text-copper" /> Delivery method
              </h2>
              <div className="grid sm:grid-cols-3 gap-3">
                {availableOptions.map((opt) => {
                  const cfg = DELIVERY_LABELS[opt]
                  if (!cfg) return null
                  const Icon = cfg.icon
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setSelectedDelivery(opt)}
                      className={cn(
                        'text-left p-4 rounded-xl border-2 transition',
                        selectedDelivery === opt
                          ? 'border-copper bg-copper/5'
                          : 'border-ink-200 hover:border-ink-300',
                      )}
                    >
                      <Icon size={16} className={cn('mb-1.5', selectedDelivery === opt ? 'text-copper' : 'text-ink-400')} />
                      <div className={cn('text-sm font-semibold mb-0.5', selectedDelivery === opt ? 'text-copper' : 'text-ink-700')}>
                        {cfg.title}
                      </div>
                      <div className="text-xs text-ink-400 leading-snug">{cfg.desc}</div>
                      {opt === 'COURIER' && (
                        <div className="text-xs text-copper font-medium mt-1">+{formatBDT(courierForwardFee)}</div>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Courier return fee note */}
              {selectedDelivery === 'COURIER' && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700">
                  <Shield size={13} className="flex-shrink-0 mt-0.5" />
                  <span>
                    A <strong>return courier charge of {formatBDT(courierReturnFee)}</strong> is non-refundable and will be deducted from your deposit when the item is returned via courier.
                  </span>
                </div>
              )}

              {/* Delivery address */}
              {selectedDelivery === 'COURIER' && (
                <Field label="Delivery address" error={errors.deliveryAddr}>
                  <input
                    type="text"
                    value={deliveryAddr}
                    onChange={(e) => setDeliveryAddr(e.target.value)}
                    placeholder="Full address including area and city"
                    className={inputCls(errors.deliveryAddr)}
                  />
                </Field>
              )}
            </section>
          )}

          {/* Pricing breakdown */}
          {totalDays > 0 && (
            <section className="bg-white rounded-2xl border border-ink-100 p-6">
              <h2 className="font-semibold text-ink-800 mb-4">Price breakdown</h2>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-ink-600">
                  <span>{formatBDT(product.pricePerDay)} × {totalDays} day{totalDays > 1 ? 's' : ''}</span>
                  <span>{formatBDT(rentalFee)}</span>
                </div>
                {selectedDelivery === 'COURIER' && (
                  <div className="flex justify-between text-ink-600">
                    <span>Courier forward fee</span>
                    <span>{formatBDT(courierForwardFee)}</span>
                  </div>
                )}
                {false && (
                  <div className="flex justify-between text-ink-600">
                    <span>Delivery fee</span>
                    <span>{formatBDT(deliveryFee)}</span>
                  </div>
                )}
                <div className="h-px bg-ink-100" />
                <div className="flex justify-between font-semibold text-ink-800">
                  <span>Subtotal</span>
                  <span>{formatBDT(subTotal)}</span>
                </div>
                <div className="flex justify-between text-ink-500 text-xs">
                  <span className="flex items-center gap-1">
                    <Shield size={11} className="text-forest" /> Security deposit (refundable)
                  </span>
                  <span className="text-forest font-medium">+ {formatBDT(deposit)}</span>
                </div>
                {selectedDelivery === 'COURIER' && (
                  <div className="flex justify-between text-ink-400 text-xs">
                    <span className="flex items-center gap-1">
                      <Package size={11} /> Return courier fee (non-refundable, deducted from deposit)
                    </span>
                    <span>{formatBDT(courierReturnFee)}</span>
                  </div>
                )}
                <div className="h-px bg-ink-100" />
                <div className="flex justify-between font-bold text-ink-900 text-base">
                  <span>Total due now</span>
                  <span className="text-copper">{formatBDT(totalDue)}</span>
                </div>
              </div>
            </section>
          )}

          {/* Payment method */}
          <section className="bg-white rounded-2xl border border-ink-100 p-6 space-y-4">
            <h2 className="font-semibold text-ink-800">Payment method</h2>
            <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-[#E2136E] bg-[#E2136E]/5">
              <span className="text-3xl">🟣</span>
              <div className="flex-1">
                <p className="font-semibold text-[#E2136E]">bKash</p>
                <p className="text-xs text-ink-400">Demo payment — no money will be charged</p>
              </div>
              <div className="w-5 h-5 rounded-full border-2 border-[#E2136E] flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-[#E2136E]" />
              </div>
            </div>
            <Field label="Your bKash mobile number" error={errors.bkash}>
              <input
                type="tel"
                value={bkashNumber}
                onChange={(e) => setBkashNumber(e.target.value)}
                placeholder="01XXXXXXXXX"
                className={inputCls(errors.bkash)}
              />
            </Field>
            <p className="text-xs text-ink-400">
              This is a demo transaction — no actual payment will be processed.
            </p>
          </section>

          {/* Notes */}
          <section className="bg-white rounded-2xl border border-ink-100 p-6 space-y-3">
            <h2 className="font-semibold text-ink-800">Message to seller <span className="text-ink-400 font-normal">(optional)</span></h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Any special instructions or questions for the seller…"
              className={cn(inputCls(), 'resize-none')}
            />
          </section>

          {/* Trust badges */}
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { icon: CheckCircle, text: 'Free cancellation before seller approves' },
              { icon: Shield,      text: 'Deposit refunded after safe return' },
              { icon: Clock,       text: 'Seller responds within 24 hours' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-2 p-3 bg-forest/5 rounded-xl">
                <Icon size={14} className="text-forest flex-shrink-0 mt-0.5" />
                <p className="text-xs text-ink-600">{text}</p>
              </div>
            ))}
          </div>

          {/* Submit */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={createRental.isPending}
            className="w-full flex items-center justify-center gap-2 py-4 bg-copper text-white font-semibold rounded-2xl hover:bg-copper/90 transition disabled:opacity-50 text-base"
          >
            {createRental.isPending
              ? <><Loader2 size={18} className="animate-spin" /> Submitting request…</>
              : totalDays > 0
                ? `Send rental request · ${formatBDT(totalDue)}`
                : 'Send rental request'}
          </button>
          <p className="text-center text-xs text-ink-400">
            By requesting, you agree to Lendora's{' '}
            <Link href="/terms" className="underline hover:text-copper">Rental Terms</Link>.
          </p>
        </div>
      </div>
      <Footer />
    </>
  )
}
