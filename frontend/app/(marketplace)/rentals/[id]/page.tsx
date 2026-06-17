'use client'
import { useState, useEffect }   from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link                       from 'next/link'
import { format, formatDistanceToNow } from 'date-fns'
import { useQuery }               from '@tanstack/react-query'
import {
  Clock, CheckCircle2, XCircle, Package, ChevronLeft,
  Loader2, Shield, Truck, MapPin, AlertCircle, AlertTriangle, User,
  Phone, Calendar, Banknote, ChevronRight, Zap, RotateCcw, Camera,
  Star, MessageSquare, Check, ChevronDown,
} from 'lucide-react'
import { toast }                  from 'sonner'
import Navbar                     from '@/components/shared/Navbar'
import VendorNavbar               from '@/components/shared/VendorNavbar'
import Footer                     from '@/components/home/Footer'
import { useAuthStore }           from '@/store/auth.store'
import { api }                    from '@/lib/api'
import { formatBDT, cn }          from '@/lib/utils'
import {
  useConfirmRental, useDeclineRental, useRejectRental, useCancelRental,
  useRenterInfo, useShipRental, useMarkCollected, useConfirmReceipt, useInitiateReturn, useConfirmReturn,
  useUpdatePickupAddress, useUpdateReturnAddress,
} from '@/lib/hooks/use-rentals'
import type { InitiateReturnInput } from '@/lib/hooks/use-rentals'
import type { Rental, ReturnRecordSummary } from '@/lib/hooks/use-rentals'
import {
  useRentalReview, useSubmitReview, useVendorReply,
  useRentalVendorFeedback, useSubmitVendorFeedback,
} from '@/lib/hooks/use-reviews'

/* ── Status config ─────────────────────────────────────────────────────── */

type StatusCfg = {
  label:      string
  badgeLabel: string
  bannerCls:  string
  icon:       React.ElementType
  badgeCls:   string
  customerDesc: string
  vendorDesc:   string
}

const STATUS_CFG: Record<string, StatusCfg> = {
  PENDING_CONFIRMATION: {
    label:       'Waiting for Seller Approval',
    badgeLabel:  'Pending Approval',
    bannerCls:   'bg-amber-50 border-amber-200 text-amber-800',
    icon:        Clock,
    badgeCls:    'bg-amber-100 text-amber-700',
    customerDesc: 'Your request has been sent. The seller will confirm shortly.',
    vendorDesc:   'New rental request — review and respond.',
  },
  CONFIRMED: {
    label:       'Confirmed — Payment Required',
    badgeLabel:  'Confirmed',
    bannerCls:   'bg-blue-50 border-blue-200 text-blue-800',
    icon:        CheckCircle2,
    badgeCls:    'bg-blue-100 text-blue-700',
    customerDesc: 'The seller accepted your request! Complete payment to proceed.',
    vendorDesc:   'Request accepted. Waiting for customer to complete payment.',
  },
  READY_FOR_PICKUP: {
    label:       'Payment Confirmed',
    badgeLabel:  'Payment Confirmed',
    bannerCls:   'bg-forest/10 border-forest/30 text-forest',
    icon:        CheckCircle2,
    badgeCls:    'bg-forest/15 text-forest',
    customerDesc: 'Payment confirmed! The seller has been notified and is preparing your item for delivery.',
    vendorDesc:   'Payment received. Please dispatch the item to activate the rental.',
  },
  SHIPPED: {
    label:       'Product Shipped',
    badgeLabel:  'Shipped',
    bannerCls:   'bg-blue-50 border-blue-200 text-blue-800',
    icon:        Truck,
    badgeCls:    'bg-blue-100 text-blue-700',
    customerDesc: 'Your item is on the way! Confirm receipt once it arrives.',
    vendorDesc:   'Product shipped. Waiting for customer to confirm receipt.',
  },
  ACTIVE: {
    label:       'Rental Active',
    badgeLabel:  'Active',
    bannerCls:   'bg-forest/10 border-forest/30 text-forest',
    icon:        Zap,
    badgeCls:    'bg-forest/15 text-forest',
    customerDesc: 'Your rental is active. Enjoy the item!',
    vendorDesc:   'Rental is active and in progress.',
  },
  OVERDUE: {
    label:       'Product Return Overdue',
    badgeLabel:  'Overdue',
    bannerCls:   'bg-red-50 border-red-300 text-red-700',
    icon:        AlertTriangle,
    badgeCls:    'bg-red-100 text-red-700',
    customerDesc: 'Warning! Your rental period has ended. Please return the product immediately. Late fees are being deducted from your security deposit.',
    vendorDesc:   'This rental is overdue. A late fee is being automatically deducted from the customer\'s deposit and credited to your wallet.',
  },
  RETURN_INITIATED: {
    label:       'Return Requested',
    badgeLabel:  'Return Requested',
    bannerCls:   'bg-amber-50 border-amber-200 text-amber-800',
    icon:        Clock,
    badgeCls:    'bg-amber-100 text-amber-700',
    customerDesc: 'Return has been initiated. Waiting for the seller to confirm.',
    vendorDesc:   'Customer has requested a return.',
  },
  RETURN_RECEIVED: {
    label:       'Return Received',
    badgeLabel:  'Return Received',
    bannerCls:   'bg-forest/10 border-forest/30 text-forest',
    icon:        CheckCircle2,
    badgeCls:    'bg-forest/15 text-forest',
    customerDesc: 'Seller has received the item.',
    vendorDesc:   'Item returned and received.',
  },
  DEPOSIT_PROCESSING: {
    label:       'Processing Deposit',
    badgeLabel:  'Processing Deposit',
    bannerCls:   'bg-amber-50 border-amber-200 text-amber-800',
    icon:        Clock,
    badgeCls:    'bg-amber-100 text-amber-700',
    customerDesc: 'Your deposit refund is being processed.',
    vendorDesc:   'Deposit is being processed.',
  },
  COMPLETED: {
    label:       'Completed',
    badgeLabel:  'Completed',
    bannerCls:   'bg-ink-50 border-ink-200 text-ink-700',
    icon:        CheckCircle2,
    badgeCls:    'bg-ink-100 text-ink-600',
    customerDesc: 'Rental completed. Thank you for using Lendora!',
    vendorDesc:   'Rental completed successfully.',
  },
  CANCELLED: {
    label:       'Cancelled',
    badgeLabel:  'Cancelled',
    bannerCls:   'bg-red-50 border-red-200 text-red-700',
    icon:        XCircle,
    badgeCls:    'bg-red-100 text-red-600',
    customerDesc: 'This rental was cancelled.',
    vendorDesc:   'This rental was cancelled.',
  },
}

/* ── Vendor action panel ───────────────────────────────────────────────── */

type VendorAction = 'accept' | 'decline' | 'reject' | null

function VendorActionPanel({ rentalId, selectedDelivery, onDone }: { rentalId: string; selectedDelivery?: string | null; onDone: () => void }) {
  const [action,       setAction]       = useState<VendorAction>(null)
  const [rejectNote,   setRejectNote]   = useState('')
  const [declineNote,  setDeclineNote]  = useState('')
  const [pickupAddr,   setPickupAddr]   = useState('')
  const [pickupError,  setPickupError]  = useState('')
  const [returnAddr,   setReturnAddr]   = useState('')
  const [sameAsPickup, setSameAsPickup] = useState(true)
  const confirm  = useConfirmRental()
  const decline  = useDeclineRental()
  const reject   = useRejectRental()
  const busy     = confirm.isPending || decline.isPending || reject.isPending

  const isPickup    = selectedDelivery === 'CUSTOMER_PICKUP'
  const needsReturn = selectedDelivery === 'CUSTOMER_PICKUP' || selectedDelivery === 'COURIER'

  const handleAccept = async () => {
    if (isPickup && !pickupAddr.trim()) {
      setPickupError('Please enter your pickup address so the customer knows where to collect the item.')
      return
    }
    setPickupError('')
    const returnAddress = needsReturn
      ? (sameAsPickup && isPickup ? pickupAddr.trim() : returnAddr.trim())
      : undefined
    await confirm.mutateAsync({
      id: rentalId,
      pickupAddress: isPickup ? pickupAddr.trim() : undefined,
      returnAddress: returnAddress || undefined,
    })
    toast.success('Rental accepted! The customer has been notified.')
    onDone()
  }
  const handleDecline = async () => {
    await decline.mutateAsync({ id: rentalId, note: declineNote || undefined })
    onDone()
  }
  const handleReject = async () => {
    if (!rejectNote.trim()) { toast.error('Please provide a reason for rejection.'); return }
    await reject.mutateAsync({ id: rentalId, note: rejectNote })
    onDone()
  }

  if (action === 'accept' && !isPickup) return (
    <div className="bg-forest/5 border border-forest/20 rounded-2xl p-5">
      <p className="font-semibold text-ink-800 mb-1">Accept this rental?</p>
      <p className="text-sm text-ink-500 mb-4">The customer will be notified and asked to complete payment.</p>
      <div className="flex gap-3">
        <button onClick={handleAccept} disabled={busy}
          className="flex items-center gap-2 px-5 py-2.5 bg-forest text-white text-sm font-semibold rounded-xl hover:bg-forest/90 transition disabled:opacity-50">
          {confirm.isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Yes, accept
        </button>
        <button onClick={() => setAction(null)} disabled={busy}
          className="px-4 py-2.5 border border-ink-200 text-ink-600 text-sm rounded-xl hover:bg-ink-50 transition">
          Cancel
        </button>
      </div>
    </div>
  )

  if (action === 'decline') return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
      <p className="font-semibold text-ink-800 mb-1">Decline this request?</p>
      <p className="text-sm text-ink-500 mb-4">The customer will be notified that the item is unavailable.</p>
      <textarea value={declineNote} onChange={(e) => setDeclineNote(e.target.value)} rows={2}
        placeholder="Optional note to customer…"
        className="w-full border border-amber-200 rounded-xl px-3 py-2.5 text-sm mb-4 outline-none focus:ring-2 focus:ring-amber-200 resize-none bg-white" />
      <div className="flex gap-3">
        <button onClick={handleDecline} disabled={busy}
          className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white text-sm font-semibold rounded-xl hover:bg-amber-600 transition disabled:opacity-50">
          {decline.isPending ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />} Decline
        </button>
        <button onClick={() => setAction(null)} disabled={busy}
          className="px-4 py-2.5 border border-ink-200 text-ink-600 text-sm rounded-xl hover:bg-ink-50 transition">Cancel</button>
      </div>
    </div>
  )

  if (action === 'reject') return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
      <p className="font-semibold text-ink-800 mb-1">Reject with reason</p>
      <p className="text-sm text-ink-500 mb-4">Reason will be shared with the customer.</p>
      <textarea value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} rows={3}
        placeholder="Reason for rejection (required)…"
        className="w-full border border-red-200 rounded-xl px-3 py-2.5 text-sm mb-4 outline-none focus:ring-2 focus:ring-red-200 resize-none bg-white" />
      <div className="flex gap-3">
        <button onClick={handleReject} disabled={busy}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition disabled:opacity-50">
          {reject.isPending ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />} Reject
        </button>
        <button onClick={() => setAction(null)} disabled={busy}
          className="px-4 py-2.5 border border-ink-200 text-ink-600 text-sm rounded-xl hover:bg-ink-50 transition">Cancel</button>
      </div>
    </div>
  )

  return (
    <div className="bg-white rounded-2xl border border-ink-100 p-5">
      <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-4">Your decision</p>
      <p className="text-sm text-ink-500 mb-5">Review the customer's details and rental info, then respond.</p>

      {isPickup && (
        <div className="mb-5">
          <label className="block text-sm font-medium text-ink-700 mb-1.5">
            Your pickup address <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-ink-400 mb-2">The customer will see this address to know where to collect the item.</p>
          <textarea
            rows={2}
            value={pickupAddr}
            onChange={(e) => { setPickupAddr(e.target.value); setPickupError('') }}
            placeholder="e.g. House 12, Road 5, Gulshan 1, Dhaka 1212…"
            className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 resize-none ${pickupError ? 'border-red-300 focus:ring-red-200' : 'border-ink-200 focus:ring-forest/30'}`}
          />
          {pickupError && <p className="text-xs text-red-500 mt-1">{pickupError}</p>}
        </div>
      )}

      {needsReturn && (
        <div className="mb-5">
          <label className="block text-sm font-medium text-ink-700 mb-1.5">
            Where should the customer return the item? <span className="text-ink-400 font-normal">(optional — can set later)</span>
          </label>
          <p className="text-xs text-ink-400 mb-2">Shown to the customer once they're ready to return the item.</p>

          {isPickup && (
            <label className="flex items-center gap-2 text-xs text-ink-600 mb-2 cursor-pointer">
              <input type="checkbox" checked={sameAsPickup} onChange={(e) => setSameAsPickup(e.target.checked)} className="accent-copper" />
              Same as pickup address
            </label>
          )}

          {!(isPickup && sameAsPickup) && (
            <textarea
              rows={2}
              value={returnAddr}
              onChange={(e) => setReturnAddr(e.target.value)}
              placeholder="e.g. House 12, Road 5, Gulshan 1, Dhaka 1212…"
              className="w-full border border-ink-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-forest/30 resize-none"
            />
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button onClick={needsReturn ? handleAccept : () => setAction('accept')} disabled={busy}
          className="flex items-center gap-2 px-5 py-2.5 bg-forest text-white text-sm font-semibold rounded-xl hover:bg-forest/90 transition disabled:opacity-50">
          {confirm.isPending ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />} Accept
        </button>
        <button onClick={() => setAction('decline')}
          className="flex items-center gap-2 px-5 py-2.5 border border-amber-300 text-amber-700 text-sm font-semibold rounded-xl hover:bg-amber-50 transition">
          <XCircle size={15} /> Decline
        </button>
        <button onClick={() => setAction('reject')}
          className="flex items-center gap-2 px-5 py-2.5 border border-red-200 text-red-600 text-sm font-medium rounded-xl hover:bg-red-50 transition">
          <AlertCircle size={15} /> Reject with reason
        </button>
      </div>
    </div>
  )
}

/* ── Pickup address editor (vendor, post-confirmation) ──────────────────── */

function PickupAddressEditor({ rentalId, currentAddress, onDone }: { rentalId: string; currentAddress?: string | null; onDone: () => void }) {
  const [editing, setEditing]   = useState(!currentAddress)
  const [addr, setAddr]         = useState(currentAddress ?? '')
  const [err, setErr]           = useState('')
  const update                  = useUpdatePickupAddress()

  if (!editing && currentAddress) {
    return (
      <div className="flex items-start gap-2.5 p-3 bg-white/80 rounded-xl border border-white">
        <MapPin size={13} className="flex-shrink-0 mt-0.5 text-blue-500" />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold text-ink-500 uppercase tracking-wide mb-0.5">Pickup address shared with customer</p>
          <p className="text-sm text-ink-800 font-medium">{currentAddress}</p>
        </div>
        <button onClick={() => setEditing(true)} className="text-[10px] text-copper underline whitespace-nowrap flex-shrink-0 mt-0.5">Edit</button>
      </div>
    )
  }

  return (
    <div className="p-3 bg-white/80 rounded-xl border border-white space-y-2">
      <label className="block text-[10px] font-semibold text-ink-500 uppercase tracking-wide">
        {currentAddress ? 'Update pickup address' : 'Your pickup address'} <span className="text-red-500">*</span>
      </label>
      <textarea
        rows={2}
        value={addr}
        onChange={(e) => { setAddr(e.target.value); setErr('') }}
        placeholder="e.g. House 12, Road 5, Gulshan 1, Dhaka 1212…"
        className={`w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 resize-none bg-white ${err ? 'border-red-300 focus:ring-red-200' : 'border-ink-200 focus:ring-forest/30'}`}
      />
      {err && <p className="text-xs text-red-500">{err}</p>}
      <div className="flex gap-2">
        <button
          disabled={update.isPending}
          onClick={async () => {
            if (!addr.trim()) { setErr('Please enter your pickup address.'); return }
            await update.mutateAsync({ id: rentalId, pickupAddress: addr.trim() })
            setEditing(false)
            onDone()
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-forest text-white text-xs font-semibold rounded-lg hover:bg-forest/90 transition disabled:opacity-50"
        >
          {update.isPending ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />} Save address
        </button>
        {currentAddress && (
          <button onClick={() => { setAddr(currentAddress); setEditing(false) }} className="px-3 py-1.5 border border-ink-200 text-ink-500 text-xs rounded-lg hover:bg-ink-50 transition">
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}

/* ── Return address editor (vendor, post-confirmation) ──────────────────── */

function ReturnAddressEditor({ rentalId, currentAddress, pickupAddress, isPickupDelivery, onDone }: {
  rentalId: string; currentAddress?: string | null; pickupAddress?: string | null; isPickupDelivery?: boolean; onDone: () => void
}) {
  const [editing, setEditing] = useState(!currentAddress)
  const [addr, setAddr]       = useState(currentAddress ?? '')
  const [sameAsPickup, setSameAsPickup] = useState(!!pickupAddress && !!currentAddress && currentAddress === pickupAddress)
  const [err, setErr]         = useState('')
  const update                = useUpdateReturnAddress()

  if (!editing && currentAddress) {
    return (
      <div className="flex items-start gap-2.5 p-3 bg-white/80 rounded-xl border border-white">
        <RotateCcw size={13} className="flex-shrink-0 mt-0.5 text-copper" />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold text-ink-500 uppercase tracking-wide mb-0.5">Return address shared with customer</p>
          <p className="text-sm text-ink-800 font-medium">{currentAddress}</p>
        </div>
        <button onClick={() => setEditing(true)} className="text-[10px] text-copper underline whitespace-nowrap flex-shrink-0 mt-0.5">Edit</button>
      </div>
    )
  }

  const handleSave = async () => {
    if (sameAsPickup && !pickupAddress) { setErr('Please save your pickup address first.'); return }
    const value = sameAsPickup ? (pickupAddress ?? '').trim() : addr.trim()
    if (!value) { setErr('Please enter a return address.'); return }
    await update.mutateAsync({ id: rentalId, returnAddress: value })
    setEditing(false)
    onDone()
  }

  return (
    <div className="p-3 bg-white/80 rounded-xl border border-white space-y-2">
      <label className="block text-[10px] font-semibold text-ink-500 uppercase tracking-wide">
        {currentAddress ? 'Update return address' : 'Where should the customer return the item?'} <span className="text-red-500">*</span>
      </label>

      {(pickupAddress || isPickupDelivery) && (
        <label className="flex items-center gap-2 text-xs text-ink-600 cursor-pointer">
          <input
            type="checkbox"
            checked={sameAsPickup}
            onChange={(e) => { setSameAsPickup(e.target.checked); setErr('') }}
            className="accent-copper"
          />
          Same as pickup address
        </label>
      )}
      {sameAsPickup && !pickupAddress && (
        <p className="text-[11px] text-amber-600">Save your pickup address above first.</p>
      )}

      {!sameAsPickup && (
        <textarea
          rows={2}
          value={addr}
          onChange={(e) => { setAddr(e.target.value); setErr('') }}
          placeholder="e.g. House 12, Road 5, Gulshan 1, Dhaka 1212…"
          className={`w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 resize-none bg-white ${err ? 'border-red-300 focus:ring-red-200' : 'border-ink-200 focus:ring-forest/30'}`}
        />
      )}
      {err && <p className="text-xs text-red-500">{err}</p>}
      <div className="flex gap-2">
        <button
          disabled={update.isPending}
          onClick={handleSave}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-forest text-white text-xs font-semibold rounded-lg hover:bg-forest/90 transition disabled:opacity-50"
        >
          {update.isPending ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />} Save address
        </button>
        {currentAddress && (
          <button onClick={() => { setAddr(currentAddress); setSameAsPickup(!!pickupAddress && currentAddress === pickupAddress); setEditing(false) }} className="px-3 py-1.5 border border-ink-200 text-ink-500 text-xs rounded-lg hover:bg-ink-50 transition">
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}

/* ── Ship panel (vendor, READY_FOR_PICKUP) ─────────────────────────────── */

const SHIP_METHODS = ['Courier Service']

function ShipPanel({ rentalId, selectedDelivery, deliveryAddress, onDone }: {
  rentalId: string
  selectedDelivery: string | null
  deliveryAddress: string | null
  onDone: () => void
}) {
  const markCollected = useMarkCollected()
  const ship          = useShipRental()
  const [method, setMethod] = useState('Courier Service')
  const [tracking, setTracking] = useState('')
  const [edd, setEdd]           = useState('')

  // Customer Pickup: no shipment — just confirm the customer has collected the item
  if (selectedDelivery === 'CUSTOMER_PICKUP') {
    return (
      <div className="bg-white rounded-2xl border border-ink-100 p-5 space-y-4">
        <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide">Confirm collection</p>
        <div className="flex items-center gap-2.5 p-3 bg-forest/5 rounded-xl">
          <CheckCircle2 size={16} className="text-forest flex-shrink-0" />
          <p className="text-sm text-ink-700">
            <span className="font-semibold text-forest">Payment received.</span>{' '}
            The customer will come to your location to collect the item.
          </p>
        </div>
        <p className="text-sm text-ink-600">
          Once the customer has picked up the item, mark it as collected to start the rental period.
        </p>
        <button
          onClick={async () => { await markCollected.mutateAsync(rentalId); onDone() }}
          disabled={markCollected.isPending}
          className="flex items-center gap-2 px-5 py-2.5 bg-forest text-white text-sm font-semibold rounded-xl hover:bg-forest/90 transition disabled:opacity-50">
          {markCollected.isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
          Mark as Collected
        </button>
      </div>
    )
  }

  const handle = async () => {
    await ship.mutateAsync({
      id:                   rentalId,
      shipmentMethod:       method,
      trackingNumber:       tracking || undefined,
      estimatedDeliveryDate: edd || undefined,
    })
    onDone()
  }

  const requestedInfo = selectedDelivery ? DELIVERY_META_FULL[selectedDelivery] : null

  return (
    <div className="bg-white rounded-2xl border border-ink-100 p-5 space-y-5">
      <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide">Mark as dispatched</p>

      <div className="flex items-center gap-2.5 p-3 bg-forest/5 rounded-xl">
        <CheckCircle2 size={16} className="text-forest flex-shrink-0" />
        <p className="text-sm text-ink-700">
          <span className="font-semibold text-forest">Payment received.</span>{' '}
          Dispatch the item using the method the customer requested, then mark it below.
        </p>
      </div>

      {/* Customer's requested delivery method */}
      {requestedInfo && (() => {
        const Icon = requestedInfo.icon
        return (
          <div className={cn('flex items-start gap-3 p-3.5 rounded-xl border', requestedInfo.boxCls)}>
            <Icon size={16} className={cn('flex-shrink-0 mt-0.5', requestedInfo.iconCls)} />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-ink-800">
                Customer requested: <span className={requestedInfo.iconCls}>{requestedInfo.label}</span>
              </p>
              <p className="text-xs text-ink-600 leading-relaxed">{requestedInfo.vendorAction}</p>
              {deliveryAddress && (
                <p className="text-xs text-ink-700 font-medium mt-1">
                  Address: {deliveryAddress}
                </p>
              )}
            </div>
          </div>
        )
      })()}

      {/* Delivery method */}
      <div>
        <p className="text-xs font-medium text-ink-600 mb-2">Delivery method <span className="text-red-500">*</span></p>
        <div className="flex flex-col gap-2">
          {SHIP_METHODS.map((m) => (
            <label key={m} className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition',
              method === m ? 'border-copper bg-copper/5' : 'border-ink-200 hover:border-ink-300',
            )}>
              <input type="radio" name="shipMethod" value={m} checked={method === m} onChange={() => setMethod(m)} className="accent-copper" />
              <span className="text-sm font-medium text-ink-700">{m}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Tracking number */}
      <div>
        <label className="text-xs font-medium text-ink-600 mb-1.5 block">
          Tracking number <span className="text-ink-400 font-normal">(optional)</span>
        </label>
        <input value={tracking} onChange={(e) => setTracking(e.target.value)} maxLength={100}
          placeholder="e.g. SA123456789BD"
          className="w-full border border-ink-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-copper/30 focus:border-copper bg-white" />
      </div>

      {/* Estimated delivery date */}
      <div>
        <label className="text-xs font-medium text-ink-600 mb-1.5 block">
          Estimated delivery date <span className="text-ink-400 font-normal">(optional)</span>
        </label>
        <input type="date" value={edd} onChange={(e) => setEdd(e.target.value)}
          className="w-full border border-ink-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-copper/30 focus:border-copper bg-white" />
      </div>

      <button onClick={handle} disabled={ship.isPending}
        className="flex items-center gap-2 px-5 py-2.5 bg-copper text-white text-sm font-semibold rounded-xl hover:bg-copper/90 transition disabled:opacity-50">
        {ship.isPending ? <Loader2 size={14} className="animate-spin" /> : <Truck size={14} />}
        Mark as Shipped
      </button>
    </div>
  )
}

/* ── Confirm receipt panel (customer, SHIPPED) ─────────────────────────── */

function ConfirmReceiptPanel({ rental, onDone }: { rental: Rental; onDone: () => void }) {
  const confirmReceipt = useConfirmReceipt()

  const handle = async () => {
    await confirmReceipt.mutateAsync(rental.id)
    onDone()
  }

  return (
    <div className="bg-white rounded-2xl border border-ink-100 p-5 space-y-4">
      <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide">Shipment information</p>

      <div className="space-y-2.5 text-sm">
        {rental.shipmentMethod && (
          <div className="flex items-center gap-2.5 text-ink-700">
            <Truck size={14} className="text-ink-400 flex-shrink-0" />
            <span><span className="text-ink-400">Method:</span> {rental.shipmentMethod}</span>
          </div>
        )}
        {rental.trackingNumber && (
          <div className="flex items-center gap-2.5 text-ink-700">
            <Package size={14} className="text-ink-400 flex-shrink-0" />
            <span><span className="text-ink-400">Tracking:</span> {rental.trackingNumber}</span>
          </div>
        )}
        {rental.estimatedDeliveryDate && (
          <div className="flex items-center gap-2.5 text-ink-700">
            <Calendar size={14} className="text-ink-400 flex-shrink-0" />
            <span>
              <span className="text-ink-400">Est. delivery:</span>{' '}
              {format(new Date(rental.estimatedDeliveryDate), 'dd MMM yyyy')}
            </span>
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-ink-100">
        <p className="text-sm text-ink-600 mb-4">Received the item? Confirm to start your rental period.</p>
        <button onClick={handle} disabled={confirmReceipt.isPending}
          className="flex items-center gap-2 px-5 py-2.5 bg-forest text-white text-sm font-semibold rounded-xl hover:bg-forest/90 transition disabled:opacity-50">
          {confirmReceipt.isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
          Confirm Product Received
        </button>
      </div>
    </div>
  )
}

/* ── Customer collect panel (customer, READY_FOR_PICKUP + CUSTOMER_PICKUP) ── */

function CustomerCollectPanel({ rentalId, onDone, useReceiptEndpoint }: { rentalId: string; onDone: () => void; useReceiptEndpoint?: boolean }) {
  const markCollected  = useMarkCollected()
  const confirmReceipt = useConfirmReceipt()
  const busy = markCollected.isPending || confirmReceipt.isPending

  const handle = async () => {
    if (useReceiptEndpoint) {
      await confirmReceipt.mutateAsync(rentalId)
    } else {
      await markCollected.mutateAsync(rentalId)
    }
    onDone()
  }

  return (
    <div className="bg-white rounded-2xl border border-ink-100 p-5 space-y-4">
      <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide">Confirm collection</p>
      <p className="text-sm text-ink-600">
        Once you have collected the item from the seller&apos;s location, confirm below to start your rental period.
      </p>
      <button onClick={handle} disabled={busy}
        className="flex items-center gap-2 px-5 py-2.5 bg-forest text-white text-sm font-semibold rounded-xl hover:bg-forest/90 transition disabled:opacity-50">
        {busy ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
        Confirm I've Collected the Item
      </button>
    </div>
  )
}

/* ── Return request form (customer, ACTIVE) ────────────────────────────── */

const DELIVERY_TO_RETURN: Record<string, InitiateReturnInput['returnMethod']> = {
  COURIER:         'COURIER_RETURN',
  CUSTOMER_PICKUP: 'CUSTOMER_DROPOFF',
  SELLER_DELIVERY: 'SELLER_PICKUP',
}

const RETURN_METHOD_META: Record<string, { label: string; desc: string }> = {
  SELLER_PICKUP:    { label: 'Seller Pickup',    desc: 'The seller will come to your location to collect the item.' },
  COURIER_RETURN:   { label: 'Courier Return',   desc: 'Ship the item back to the seller via courier.' },
  CUSTOMER_DROPOFF: { label: 'Customer Drop-off', desc: 'You will drop off the item at the seller\'s location.' },
}

/* Delivery method metadata — drives both vendor and customer views */
const DELIVERY_META_FULL: Record<string, {
  label:        string
  icon:         React.ElementType
  vendorAction: string
  customerDesc: string
  iconCls:      string
  boxCls:       string
}> = {
  CUSTOMER_PICKUP: {
    label:        'Customer Pickup',
    icon:         MapPin,
    iconCls:      'text-blue-500',
    boxCls:       'bg-blue-50 border-blue-200',
    vendorAction: 'The customer will come to your location to collect the item. Have it ready and share your exact pickup address with them.',
    customerDesc: 'You will collect the item from the seller\'s location. The seller will share their pickup address with you.',
  },
  SELLER_DELIVERY: {
    label:        'Seller Delivery',
    icon:         Truck,
    iconCls:      'text-forest',
    boxCls:       'bg-forest/5 border-forest/20',
    vendorAction: 'You are responsible for delivering this item to the customer\'s address. Coordinate with the customer on a delivery time.',
    customerDesc: 'The seller will deliver the item directly to your address.',
  },
  COURIER: {
    label:        'Courier Service',
    icon:         Package,
    iconCls:      'text-amber-600',
    boxCls:       'bg-amber-50 border-amber-200',
    vendorAction: 'Pack the item securely and ship it via a courier service (e.g. Sundarban, Pathao Courier, Redx) to the customer\'s address listed below. Enter the tracking number once shipped.',
    customerDesc: 'Your item will be packed and shipped to your address via courier. You\'ll receive tracking details once dispatched.',
  },
}

function ReturnRequestForm({ rentalId, selectedDelivery, returnAddress, onDone }: { rentalId: string; selectedDelivery?: string | null; returnAddress?: string | null; onDone: () => void }) {
  const returnMethod  = (selectedDelivery && DELIVERY_TO_RETURN[selectedDelivery]) ?? 'COURIER_RETURN'
  const methodMeta    = RETURN_METHOD_META[returnMethod]
  const [open,           setOpen]    = useState(false)
  const [returnDate,     setDate]    = useState('')
  const [trackingNumber, setTracking] = useState('')
  const initiateReturn = useInitiateReturn()

  const handle = async () => {
    await initiateReturn.mutateAsync({
      id: rentalId,
      returnMethod,
      returnDate:           returnDate || undefined,
      returnTrackingNumber: trackingNumber || undefined,
    })
    onDone()
  }

  if (!open) return (
    <div className="bg-white rounded-2xl border border-ink-100 p-5 flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-ink-700">Done with the rental?</p>
        <p className="text-xs text-ink-400 mt-0.5">Start the return process and get your deposit back.</p>
      </div>
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-4 py-2 bg-copper text-white text-sm font-semibold rounded-xl hover:bg-copper/90 transition whitespace-nowrap">
        <RotateCcw size={13} /> Request Return
      </button>
    </div>
  )

  return (
    <div className="bg-white rounded-2xl border border-ink-100 p-5 space-y-5">
      <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide">Request return</p>

      {/* Return method — fixed to match the original delivery method */}
      <div>
        <p className="text-xs font-medium text-ink-600 mb-2">Return method</p>
        <div className="flex items-start gap-3 p-3.5 rounded-xl border-2 border-copper bg-copper/5">
          <RotateCcw size={15} className="text-copper flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-copper">{methodMeta?.label}</p>
            <p className="text-xs text-ink-500 mt-0.5">{methodMeta?.desc}</p>
          </div>
        </div>
        {returnAddress && (
          <div className="mt-2.5 flex items-start gap-2 bg-copper/5 rounded-lg border border-copper/20 px-3 py-2.5">
            <MapPin size={13} className="text-copper flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-semibold text-copper uppercase tracking-wide mb-0.5">Return to this address</p>
              <p className="text-sm font-medium text-ink-800">{returnAddress}</p>
            </div>
          </div>
        )}
      </div>

      {/* Return date */}
      <div>
        <label className="text-xs font-medium text-ink-600 mb-1.5 block">
          Return date <span className="text-ink-400 font-normal">(optional)</span>
        </label>
        <input type="date" value={returnDate} onChange={(e) => setDate(e.target.value)}
          className="w-full border border-ink-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-copper/30 focus:border-copper bg-white" />
      </div>

      {/* Courier tracking — only for courier return */}
      {returnMethod === 'COURIER_RETURN' && (
        <div>
          <label className="text-xs font-medium text-ink-600 mb-1.5 block">
            Courier tracking number <span className="text-ink-400 font-normal">(optional)</span>
          </label>
          <input value={trackingNumber} onChange={(e) => setTracking(e.target.value)} maxLength={100}
            placeholder="e.g. SA123456789BD"
            className="w-full border border-ink-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-copper/30 focus:border-copper bg-white" />
        </div>
      )}

      <p className="text-xs text-ink-400">
        The seller will inspect the item and confirm its condition. Your deposit refund depends on the outcome.
      </p>

      <div className="flex gap-3">
        <button onClick={handle} disabled={initiateReturn.isPending}
          className="flex items-center gap-2 px-5 py-2.5 bg-copper text-white text-sm font-semibold rounded-xl hover:bg-copper/90 transition disabled:opacity-50">
          {initiateReturn.isPending ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
          Submit return request
        </button>
        <button onClick={() => setOpen(false)} disabled={initiateReturn.isPending}
          className="px-4 py-2.5 border border-ink-200 text-ink-600 text-sm rounded-xl hover:bg-ink-50 transition">
          Cancel
        </button>
      </div>
    </div>
  )
}

/* ── Return inspection panel (vendor, RETURN_INITIATED) ────────────────── */

function ReturnInspectionPanel({
  rentalId, depositAmount, endDate, pricePerDay, onDone,
}: { rentalId: string; depositAmount: number; endDate: string; pricePerDay: number; onDone: () => void }) {
  const [step, setStep]             = useState<'choose' | 'good' | 'damaged'>('choose')
  const [photos, setPhotos]         = useState<File[]>([])
  const [photoUrls, setPhotoUrls]   = useState<string[]>([])
  const [description, setDesc]      = useState('')
  const [claimAmount, setClaimAmt]  = useState('')
  const confirmReturn               = useConfirmReturn()

  const now      = new Date()
  const due      = new Date(endDate); due.setHours(23, 59, 59, 999)
  const msLate   = now.getTime() - due.getTime()
  const lateDays = msLate > 0 ? Math.ceil(msLate / (1000 * 60 * 60 * 24)) : 0
  const latePenalty = lateDays > 0 ? lateDays * pricePerDay : 0

  const handleGood = async () => {
    await confirmReturn.mutateAsync({ id: rentalId, condition: 'GOOD' })
    toast.success('Return confirmed — full deposit will be refunded.')
    onDone()
  }

  const handleDamaged = async () => {
    if (!description.trim()) { toast.error('Please describe the damage.'); return }
    await confirmReturn.mutateAsync({
      id:               rentalId,
      condition:        'DAMAGED',
      damageDescription: description,
      damageAmount:     claimAmount ? Number(claimAmount) : undefined,
      photos:           photos.length > 0 ? photos : undefined,
    })
    toast.success('Damage report submitted. Admin will review.')
    onDone()
  }

  const addPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setPhotos((p) => [...p, ...files])
    setPhotoUrls((u) => [...u, ...files.map((f) => URL.createObjectURL(f))])
    e.target.value = ''
  }

  const removePhoto = (i: number) => {
    setPhotos((p) => p.filter((_, idx) => idx !== i))
    setPhotoUrls((u) => u.filter((_, idx) => idx !== i))
  }

  if (step === 'choose') return (
    <div className="bg-white rounded-2xl border border-ink-100 p-5">
      <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-3">Inspect returned item</p>

      {lateDays > 0 && (
        <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-xl mb-4 text-sm text-red-800">
          <AlertTriangle size={15} className="flex-shrink-0 mt-0.5 text-red-500" />
          <span>
            <strong>Late return:</strong> This item was due {format(due, 'dd MMM yyyy')} —{' '}
            <strong>{lateDays} day{lateDays !== 1 ? 's' : ''} late.</strong>{' '}
            A late penalty of <strong>{formatBDT(latePenalty)}</strong> may be deducted. Admin will confirm.
          </span>
        </div>
      )}

      <p className="text-sm text-ink-600 mb-5">
        The customer has requested a return. Inspect the item and record its condition.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setStep('good')}
          className="flex flex-col items-center gap-2 p-5 rounded-xl border-2 border-forest/30 hover:border-forest hover:bg-forest/5 transition text-center">
          <CheckCircle2 size={24} className="text-forest" />
          <span className="text-sm font-semibold text-forest">Good Condition</span>
          <span className="text-xs text-ink-400">No damage — full deposit refund</span>
        </button>
        <button onClick={() => setStep('damaged')}
          className="flex flex-col items-center gap-2 p-5 rounded-xl border-2 border-red-200 hover:border-red-400 hover:bg-red-50 transition text-center">
          <AlertCircle size={24} className="text-red-500" />
          <span className="text-sm font-semibold text-red-600">Damaged</span>
          <span className="text-xs text-ink-400">File a damage report for admin review</span>
        </button>
      </div>
    </div>
  )

  if (step === 'good') return (
    <div className="bg-forest/5 border border-forest/20 rounded-2xl p-5">
      <p className="font-semibold text-ink-800 mb-1">Confirm good condition?</p>
      <p className="text-sm text-ink-500 mb-5">
        The full deposit of <strong>{formatBDT(depositAmount)}</strong> will be refunded to the customer.
      </p>
      <div className="flex gap-3">
        <button onClick={handleGood} disabled={confirmReturn.isPending}
          className="flex items-center gap-2 px-5 py-2.5 bg-forest text-white text-sm font-semibold rounded-xl hover:bg-forest/90 transition disabled:opacity-50">
          {confirmReturn.isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
          Confirm — Good Condition
        </button>
        <button onClick={() => setStep('choose')} disabled={confirmReturn.isPending}
          className="px-4 py-2.5 border border-ink-200 text-ink-600 text-sm rounded-xl hover:bg-ink-50 transition">
          Back
        </button>
      </div>
    </div>
  )

  return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-4">
      <div>
        <p className="font-semibold text-ink-800 mb-1">Damage Report</p>
        <p className="text-sm text-ink-500">
          Provide evidence and details. Admin will review before any deposit deduction is finalized.
        </p>
      </div>

      {/* Photo upload */}
      <div>
        <p className="text-xs font-semibold text-ink-600 mb-2">Damage photos <span className="font-normal text-ink-400">(optional)</span></p>
        <label className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 rounded-xl text-sm text-red-600 cursor-pointer hover:bg-red-100 transition">
          <Camera size={14} /> Add photos
          <input type="file" multiple accept="image/*" className="hidden" onChange={addPhotos} />
        </label>
        {photoUrls.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {photoUrls.map((url, i) => (
              <div key={i} className="relative">
                <img src={url} alt={`damage ${i + 1}`} className="w-16 h-16 rounded-lg object-cover border border-red-200" />
                <button onClick={() => removePhoto(i)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600">
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="text-xs font-semibold text-ink-600 mb-2 block">
          Damage description <span className="text-red-500">*</span>
        </label>
        <textarea value={description} onChange={(e) => setDesc(e.target.value)} rows={3}
          placeholder="Describe the damage in detail…"
          className="w-full border border-red-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-200 resize-none bg-white" />
      </div>

      {/* Claim amount */}
      <div>
        <label className="text-xs font-semibold text-ink-600 mb-2 block">
          Claim amount (৳) <span className="text-ink-400 font-normal">optional — max deposit {formatBDT(depositAmount)}</span>
        </label>
        <input type="number" value={claimAmount} onChange={(e) => setClaimAmt(e.target.value)}
          min={0} max={depositAmount} placeholder="0"
          className="w-full border border-red-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-200 bg-white" />
      </div>

      <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl text-xs text-amber-700">
        <AlertCircle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
        Admin will review before any deduction is applied.
      </div>

      <div className="flex gap-3">
        <button onClick={handleDamaged} disabled={confirmReturn.isPending || !description.trim()}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition disabled:opacity-50">
          {confirmReturn.isPending ? <Loader2 size={14} className="animate-spin" /> : <AlertCircle size={14} />}
          Submit damage report
        </button>
        <button onClick={() => setStep('choose')} disabled={confirmReturn.isPending}
          className="px-4 py-2.5 border border-ink-200 text-ink-600 text-sm rounded-xl hover:bg-ink-50 transition">
          Back
        </button>
      </div>
    </div>
  )
}

/* ── Rental timeline / order progress ─────────────────────────────────── */

const TIMELINE_STEPS = [
  { idx:  0, label: 'Rental Requested',   desc: 'Booking submitted by customer' },
  { idx:  1, label: 'Seller Review',       desc: 'Awaiting seller decision' },
  { idx:  2, label: 'Accepted',            desc: 'Seller confirmed the booking' },
  { idx:  3, label: 'Payment Pending',     desc: 'Rental fee + deposit payment awaited' },
  { idx:  4, label: 'Payment Completed',   desc: 'All fees paid and confirmed' },
  { idx:  5, label: 'Product Shipped',     desc: 'Seller has shipped the item' },
  { idx:  6, label: 'Product Received',    desc: 'Customer confirmed receipt' },
  { idx:  7, label: 'Rental Active',       desc: 'Item is with the renter' },
  { idx:  8, label: 'Return Requested',    desc: 'Renter initiated return' },
  { idx:  9, label: 'Seller Inspection',   desc: 'Seller inspecting returned item' },
  { idx: 10, label: 'Admin Review',        desc: 'Admin adjudicating damage or late claim' },
  { idx: 11, label: 'Deposit Settled',     desc: 'Deposit refunded or applied to damages' },
  { idx: 12, label: 'Completed',           desc: 'Rental successfully completed' },
]

function rentalCurrentStep(status: string, adminReviewRequired?: boolean, isPickup?: boolean): number {
  switch (status) {
    case 'PENDING_CONFIRMATION': return 1
    case 'CONFIRMED':            return 3
    // For pickup, payment done means "awaiting collection" → keep Payment Completed (idx 4) active
    case 'READY_FOR_PICKUP':     return isPickup ? 4 : 5
    case 'SHIPPED':              return 6
    case 'ACTIVE':
    case 'OVERDUE':               return 7
    case 'RETURN_INITIATED':
    case 'RETURN_REQUESTED':     return 8
    case 'RETURN_RECEIVED':      return adminReviewRequired ? 10 : 9
    case 'COMPLETED':            return 13   // beyond last — all done
    default:                     return 0
  }
}

function RentalTimeline({
  status,
  adminReviewRequired,
  cancellationNote,
  selectedDelivery,
}: {
  status: string
  adminReviewRequired?: boolean
  cancellationNote?: string | null
  selectedDelivery?: string | null
}) {
  const [open, setOpen] = useState(false)
  const isCancelled = status === 'CANCELLED'
  const isPickup    = selectedDelivery === 'CUSTOMER_PICKUP'
  const currentStep = isCancelled ? -1 : rentalCurrentStep(status, adminReviewRequired, isPickup)

  // For customer pickup: remove "Product Shipped" (idx 5) and "Product Received" (idx 6)
  // because there is no shipment — customer collects directly from the seller.
  // Skip Admin Review (idx 10) if not required.
  const steps = TIMELINE_STEPS
    .filter((s) => {
      if (isPickup && (s.idx === 5 || s.idx === 6)) return false
      if (s.idx === 10 && !adminReviewRequired) return false
      return true
    })
    .map((s) => {
      if (!isPickup) return s
      if (s.idx === 4) return { ...s, label: 'Payment Completed', desc: 'Payment confirmed — item ready for collection' }
      if (s.idx === 7) return { ...s, desc: 'Customer has collected the item from the seller' }
      return s
    })

  return (
    <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-ink-50/50 transition">
        <div className="flex items-center gap-3">
          {isCancelled ? (
            <span className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle size={13} className="text-red-500" />
            </span>
          ) : currentStep >= 12 ? (
            <span className="w-6 h-6 rounded-full bg-forest flex items-center justify-center">
              <Check size={13} className="text-white" />
            </span>
          ) : (
            <span className="w-6 h-6 rounded-full bg-copper flex items-center justify-center animate-pulse">
              <div className="w-2 h-2 rounded-full bg-white" />
            </span>
          )}
          <div className="text-left">
            <p className="text-sm font-semibold text-ink-800">Order timeline</p>
            <p className="text-xs text-ink-400">
              {isCancelled
                ? 'Order cancelled'
                : currentStep >= 12
                  ? 'All steps completed'
                  : `Step ${Math.min(currentStep + 1, steps.length)} of ${steps.length}`}
            </p>
          </div>
        </div>
        <ChevronDown size={16} className={cn('text-ink-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-ink-50">
          {isCancelled ? (
            <div className="pt-4">
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                <XCircle size={20} className="text-red-500 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-red-700 text-sm">Order Cancelled</p>
                  {cancellationNote && (
                    <p className="text-xs text-red-600 mt-0.5">Reason: {cancellationNote}</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="pt-4">
              {steps.map((step, i) => {
                const isDone    = currentStep > step.idx
                const isActive  = currentStep === step.idx
                const isLast    = i === steps.length - 1

                return (
                  <div key={step.idx} className="flex gap-3">
                    {/* Connector column */}
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all',
                        isDone    && 'bg-forest border-forest',
                        isActive  && 'bg-copper border-copper',
                        !isDone && !isActive && 'bg-white border-ink-200',
                      )}>
                        {isDone   && <Check size={11} className="text-white" />}
                        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                        {!isDone && !isActive && <div className="w-1.5 h-1.5 rounded-full bg-ink-200" />}
                      </div>
                      {!isLast && (
                        <div className={cn('w-0.5 min-h-[20px] flex-1', isDone ? 'bg-forest' : 'bg-ink-100')} />
                      )}
                    </div>

                    {/* Label column */}
                    <div className={cn('pb-3', isLast && 'pb-0')}>
                      <p className={cn(
                        'text-sm font-medium leading-tight',
                        isDone              && 'text-forest',
                        isActive            && 'text-copper font-semibold',
                        !isDone && !isActive && 'text-ink-400',
                      )}>
                        {step.label}
                      </p>
                      {isActive && (
                        <p className="text-xs text-ink-400 mt-0.5">{step.desc}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Star rating picker ────────────────────────────────────────────────── */

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          className="p-0.5 transition">
          <Star size={22}
            className={cn('transition', (hover || value) >= s ? 'text-amber-400 fill-amber-400' : 'text-ink-200')} />
        </button>
      ))}
    </div>
  )
}

/* ── Customer review panel ─────────────────────────────────────────────── */

function CustomerReviewPanel({ rentalId, refetch }: { rentalId: string; refetch: () => void }) {
  const { data: existing, isLoading } = useRentalReview(rentalId)
  const [replyOpen, setReplyOpen]     = useState(false)
  const [replyText, setReplyText]     = useState('')
  const submit    = useSubmitReview()
  const vendorRep = useVendorReply()

  // Form state
  const [rating, setRating] = useState(0)
  const [title,  setTitle]  = useState('')
  const [body,   setBody]   = useState('')

  if (isLoading) return null

  // Already reviewed — show the review + vendor reply
  if (existing) {
    return (
      <div className="bg-white rounded-2xl border border-ink-100 p-5">
        <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-4">Your review</p>
        <div className="flex gap-1 mb-2">
          {[1,2,3,4,5].map((s) => (
            <Star key={s} size={16} className={cn(existing.rating >= s ? 'text-amber-400 fill-amber-400' : 'text-ink-200')} />
          ))}
        </div>
        {existing.title && <p className="font-semibold text-ink-800 mb-1">{existing.title}</p>}
        <p className="text-sm text-ink-700">{existing.body}</p>
        {existing.vendorReply && (
          <div className="mt-3 p-3 bg-forest/5 border border-forest/20 rounded-xl">
            <p className="text-xs font-semibold text-forest mb-1">Seller reply</p>
            <p className="text-sm text-ink-700">{existing.vendorReply}</p>
          </div>
        )}
        {!existing.vendorReply && (
          <p className="text-xs text-ink-300 mt-3 italic">Waiting for seller to respond…</p>
        )}
      </div>
    )
  }

  // Not yet reviewed — show form
  const handleSubmit = async () => {
    if (rating === 0) { return }
    if (!body.trim()) { return }
    await submit.mutateAsync({ rentalId, rating, title: title || undefined, body })
    refetch()
  }

  return (
    <div className="bg-white rounded-2xl border border-ink-100 p-5">
      <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-4">
        Rate this rental
      </p>
      <div className="space-y-4">
        <div>
          <p className="text-xs text-ink-500 mb-2">Your rating <span className="text-red-500">*</span></p>
          <StarPicker value={rating} onChange={setRating} />
        </div>
        <div>
          <label className="text-xs text-ink-500 mb-1.5 block">Title <span className="text-ink-300">(optional)</span></label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100}
            placeholder="Summarise your experience…"
            className="w-full border border-ink-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-copper/30 bg-white" />
        </div>
        <div>
          <label className="text-xs text-ink-500 mb-1.5 block">Your review <span className="text-red-500">*</span></label>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} maxLength={1000}
            placeholder="Share details about the product, seller communication, and overall experience…"
            className="w-full border border-ink-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-copper/30 resize-none bg-white" />
        </div>
        <button onClick={handleSubmit} disabled={submit.isPending || rating === 0 || !body.trim()}
          className="flex items-center gap-2 px-5 py-2.5 bg-copper text-white text-sm font-semibold rounded-xl hover:bg-copper/90 transition disabled:opacity-50">
          {submit.isPending ? <Loader2 size={14} className="animate-spin" /> : <Star size={14} />}
          Submit review
        </button>
      </div>
    </div>
  )
}

/* ── Vendor review panel (see customer review + reply + rate customer) ──── */

function VendorReviewPanel({ rentalId, refetch }: { rentalId: string; refetch: () => void }) {
  const { data: review,   isLoading: rLoading }  = useRentalReview(rentalId)
  const { data: feedback, isLoading: fLoading }  = useRentalVendorFeedback(rentalId)
  const vendorRep = useVendorReply()
  const submitFb  = useSubmitVendorFeedback()

  const [replyText,   setReply]   = useState('')
  const [replyOpen,   setReplyO]  = useState(false)
  const [fbRating,    setFbRate]  = useState(0)
  const [fbComment,   setFbCmt]   = useState('')

  if (rLoading || fLoading) return null

  const handleReply = async () => {
    if (!replyText.trim() || !review) return
    await vendorRep.mutateAsync({ reviewId: review.id, reply: replyText, rentalId })
    setReplyO(false)
    refetch()
  }

  const handleFeedback = async () => {
    if (fbRating === 0) return
    await submitFb.mutateAsync({ rentalId, rating: fbRating, comment: fbComment || undefined })
    refetch()
  }

  return (
    <div className="space-y-4">
      {/* Customer's review — if exists */}
      {review ? (
        <div className="bg-white rounded-2xl border border-ink-100 p-5">
          <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-4">Customer review</p>
          <div className="flex gap-1 mb-2">
            {[1,2,3,4,5].map((s) => (
              <Star key={s} size={16} className={cn(review.rating >= s ? 'text-amber-400 fill-amber-400' : 'text-ink-200')} />
            ))}
            {review.reviewerName && (
              <span className="text-xs text-ink-400 ml-2 self-center">{review.reviewerName}</span>
            )}
          </div>
          {review.title && <p className="font-semibold text-ink-800 mb-1">{review.title}</p>}
          <p className="text-sm text-ink-700 mb-3">{review.body}</p>

          {review.vendorReply ? (
            <div className="p-3 bg-forest/5 border border-forest/20 rounded-xl">
              <p className="text-xs font-semibold text-forest mb-1">Your reply</p>
              <p className="text-sm text-ink-700">{review.vendorReply}</p>
            </div>
          ) : replyOpen ? (
            <div className="space-y-3">
              <textarea value={replyText} onChange={(e) => setReply(e.target.value)} rows={3}
                placeholder="Respond to this review…"
                className="w-full border border-ink-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-forest/30 resize-none bg-white" />
              <div className="flex gap-2">
                <button onClick={handleReply} disabled={vendorRep.isPending || !replyText.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-forest text-white text-sm font-semibold rounded-xl hover:bg-forest/90 transition disabled:opacity-50">
                  {vendorRep.isPending ? <Loader2 size={13} className="animate-spin" /> : <MessageSquare size={13} />}
                  Post reply
                </button>
                <button onClick={() => setReplyO(false)}
                  className="px-4 py-2 border border-ink-200 text-ink-600 text-sm rounded-xl hover:bg-ink-50 transition">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setReplyO(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-forest hover:text-forest/70 transition">
              <MessageSquare size={12} /> Reply to this review
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-ink-100 p-5">
          <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-2">Customer review</p>
          <p className="text-sm text-ink-400 italic">The customer hasn't submitted a review yet.</p>
        </div>
      )}

      {/* Rate the customer */}
      <div className="bg-white rounded-2xl border border-ink-100 p-5">
        <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-4">Rate this customer</p>
        {feedback ? (
          <div>
            <div className="flex gap-1 mb-2">
              {[1,2,3,4,5].map((s) => (
                <Star key={s} size={16} className={cn(feedback.rating >= s ? 'text-amber-400 fill-amber-400' : 'text-ink-200')} />
              ))}
            </div>
            {feedback.comment && <p className="text-sm text-ink-700 mt-1">{feedback.comment}</p>}
            <p className="text-xs text-ink-300 mt-2">Feedback submitted</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <p className="text-xs text-ink-500 mb-2">Rating <span className="text-red-500">*</span></p>
              <StarPicker value={fbRating} onChange={setFbRate} />
            </div>
            <div>
              <label className="text-xs text-ink-500 mb-1.5 block">Comment <span className="text-ink-300">(optional)</span></label>
              <textarea value={fbComment} onChange={(e) => setFbCmt(e.target.value)} rows={2}
                placeholder="Note anything about the customer — care of items, communication, timeliness…"
                className="w-full border border-ink-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-copper/30 resize-none bg-white" />
            </div>
            <button onClick={handleFeedback} disabled={submitFb.isPending || fbRating === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-copper text-white text-sm font-semibold rounded-xl hover:bg-copper/90 transition disabled:opacity-50">
              {submitFb.isPending ? <Loader2 size={14} className="animate-spin" /> : <Star size={14} />}
              Submit feedback
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Return outcome card (COMPLETED) ──────────────────────────────────── */

function ReturnOutcomeCard({
  returnRecord: r, depositAmount, isVendor,
}: { returnRecord: ReturnRecordSummary; depositAmount: number; isVendor?: boolean }) {
  const conditionLabel: Record<string, string> = {
    PERFECT: 'Perfect', GOOD: 'Good', MINOR_DAMAGE: 'Minor damage',
    MAJOR_DAMAGE: 'Major damage', DAMAGED: 'Damaged',
  }

  const isGood       = r.depositDeduction === 0
  const hasLate      = (r.lateDays ?? 0) > 0
  const hasDamage    = (r.damageAmount ?? 0) > 0
  const hasOutstanding = (r.outstandingDue ?? 0) > 0

  return (
    <div className="bg-white rounded-2xl border border-ink-100 p-5">
      <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-4">Return outcome</p>

      <div className="flex items-center gap-2 mb-4">
        {isGood
          ? <><CheckCircle2 size={18} className="text-forest" /> <span className="font-semibold text-forest text-sm">Full deposit refunded</span></>
          : <><AlertCircle size={18} className="text-amber-600" /> <span className="font-semibold text-amber-700 text-sm">Partial deduction applied</span></>}
        <span className={cn('ml-auto text-xs font-medium px-2.5 py-1 rounded-full',
          r.condition === 'GOOD' || r.condition === 'PERFECT'
            ? 'bg-forest/10 text-forest'
            : 'bg-amber-100 text-amber-700')}>
          {conditionLabel[r.condition] ?? r.condition}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        {hasLate && (
          <div className="flex justify-between text-ink-700">
            <span className="flex items-center gap-1.5">
              <Clock size={12} className="text-red-500" />
              Late penalty ({r.lateDays} day{(r.lateDays ?? 0) !== 1 ? 's' : ''})
            </span>
            <span className="font-medium text-red-600">− {formatBDT(r.latePenalty ?? 0)}</span>
          </div>
        )}
        {hasDamage && (
          <div className="flex justify-between text-ink-700">
            <span className="flex items-center gap-1.5">
              <AlertCircle size={12} className="text-amber-500" /> Damage deduction
            </span>
            <span className="font-medium text-amber-700">− {formatBDT(r.damageAmount ?? 0)}</span>
          </div>
        )}
        {(hasLate || hasDamage) && (
          <div className="h-px bg-ink-100" />
        )}
        <div className="flex justify-between font-semibold text-ink-800">
          <span>Total deducted</span>
          <span className={r.depositDeduction > 0 ? 'text-red-700' : 'text-ink-400'}>
            − {formatBDT(r.depositDeduction)}
          </span>
        </div>
        <div className="flex justify-between font-bold text-ink-900">
          <span>{isVendor ? 'Deposited to wallet' : 'Deposit refunded to you'}</span>
          <span className="text-forest">{formatBDT(r.depositRefund)}</span>
        </div>
        {hasOutstanding && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-800">
            <AlertTriangle size={13} className="text-red-500 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Outstanding due: {formatBDT(r.outstandingDue ?? 0)}</strong> — penalties exceeded the deposit amount.
              {isVendor ? ' Admin will follow up for recovery.' : ' Please contact support to settle the outstanding amount.'}
            </span>
          </div>
        )}
        {r.adminReviewRequired && (
          <div className="mt-2 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
            <Clock size={13} className="flex-shrink-0" /> Pending admin review — final amounts not yet confirmed.
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Overdue warning card (customer + vendor) ───────────────────────────── */

function OverdueWarningCard({ rental, audience }: { rental: Rental; audience: 'customer' | 'vendor' }) {
  const depositRemaining = Math.max(0, rental.depositAmount - rental.lateFeeAmount)
  return (
    <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle size={18} className="text-red-600 flex-shrink-0" />
        <p className="font-bold text-red-700 text-sm">⚠ Product Return Overdue</p>
      </div>
      <p className="text-sm text-red-700 mb-4 leading-relaxed">
        {audience === 'customer'
          ? 'Warning! Your rental period has ended. Please return the product immediately. Late fees are being deducted from your security deposit.'
          : 'This rental is past its due date. A late fee is being deducted automatically from the customer\'s deposit and credited to your wallet.'}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm bg-white/60 rounded-xl p-3">
        <div>
          <p className="text-[10px] font-semibold text-red-500 uppercase tracking-wide mb-0.5">Late by</p>
          <p className="font-bold text-red-700">{rental.lateDays} day{rental.lateDays !== 1 ? 's' : ''}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-red-500 uppercase tracking-wide mb-0.5">Daily charge</p>
          <p className="font-bold text-red-700">{formatBDT(rental.pricePerDay)}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-red-500 uppercase tracking-wide mb-0.5">
            {audience === 'customer' ? 'Late fee deducted' : 'Late fee collected'}
          </p>
          <p className="font-bold text-red-700">{formatBDT(rental.lateFeeAmount)}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-red-500 uppercase tracking-wide mb-0.5">Remaining deposit</p>
          <p className="font-bold text-red-700">{formatBDT(depositRemaining)}</p>
        </div>
      </div>
    </div>
  )
}

/* ── Main page ─────────────────────────────────────────────────────────── */

export default function RentalDetailPage() {
  const { id }       = useParams<{ id: string }>()
  const router       = useRouter()
  const searchParams = useSearchParams()
  const user         = useAuthStore((s) => s.user)
  const isVendor     = user?.role === 'VENDOR'

  useEffect(() => {
    if (!user) { router.replace('/login'); return }
    if (searchParams.get('submitted') === '1') toast.success('Rental request sent! Waiting for seller approval.')
    if (searchParams.get('paid')      === '1') toast.success('Payment confirmed! The seller has been notified and will prepare your item for delivery.')
  }, [user, router, searchParams])

  const { data: rental, isLoading, refetch } = useQuery<Rental>({
    queryKey:        ['rentals', id],
    queryFn:         async () => {
      const { data } = await api.get<{ data: Rental }>(`/rentals/${id}`)
      return data.data
    },
    enabled:         !!id,
    refetchInterval: (query) => {
      const r = query.state.data
      if (!r) return false
      const live = ['PENDING_CONFIRMATION', 'CONFIRMED', 'READY_FOR_PICKUP', 'SHIPPED', 'ACTIVE', 'OVERDUE', 'RETURN_INITIATED', 'RETURN_RECEIVED']
      return live.includes(r.status) ? 12_000 : false
    },
  })

  const { data: renter } = useRenterInfo(isVendor && id ? id : undefined)
  const cancelRental = useCancelRental()

  /* Loading */
  if (isLoading) {
    return (
      <>
        {isVendor ? <VendorNavbar /> : <Navbar />}
        <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-10 pb-10 space-y-4 animate-pulse">
          <div className="h-4 w-24 bg-ink-100 rounded" />
          <div className="h-24 bg-ink-100 rounded-2xl" />
          <div className="h-48 bg-ink-100 rounded-2xl" />
          <div className="h-36 bg-ink-100 rounded-2xl" />
          <div className="h-32 bg-ink-100 rounded-2xl" />
        </div>
      </>
    )
  }

  if (!rental) {
    return (
      <>
        {isVendor ? <VendorNavbar /> : <Navbar />}
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-ink-500">
          <Package size={48} className="opacity-30" />
          <p>Rental not found.</p>
          <Link href="/rentals" className="text-sm text-copper underline">← Back</Link>
        </div>
      </>
    )
  }

  const cfg              = STATUS_CFG[rental.status]
  const StatusIcon       = cfg?.icon ?? AlertCircle
  const customerRentalFee = rental.rentalFee
  const isCourier        = rental.selectedDelivery === 'COURIER'
  const subTotal         = customerRentalFee + rental.deliveryFee
  const totalCharged     = subTotal + rental.depositAmount
  const bkashNote    = rental.renterNotes?.match(/Demo bKash payment: (\S+)/)?.[1]
  const extraNotes   = rental.renterNotes?.replace(/Demo bKash payment: \S+\s?\|?\s?/, '').replace(/^Notes:\s*/, '').trim()

  return (
    <>
      {isVendor ? <VendorNavbar /> : <Navbar />}
      <div className={cn('max-w-2xl mx-auto px-4 sm:px-6 pb-10', isVendor ? 'pt-10' : 'pt-28')}>
        <Link href="/rentals" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800 mb-6 transition">
          <ChevronLeft size={16} /> {isVendor ? 'Rental orders' : 'My rentals'}
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs text-ink-400 uppercase tracking-wide mb-1">Order #{id.slice(-8).toUpperCase()}</p>
            <h1 className="font-fraunces text-2xl font-bold text-ink-900">
              {isVendor ? 'Rental Request' : 'Rental Details'}
            </h1>
          </div>
          {cfg && (
            <span className={cn('text-xs font-semibold px-3 py-1.5 rounded-full', cfg.badgeCls)}>
              {cfg.badgeLabel}
            </span>
          )}
        </div>

        {/* Order timeline */}
        <div className="mb-4">
          <RentalTimeline
            status={rental.status}
            adminReviewRequired={rental.returnRecord?.adminReviewRequired}
            cancellationNote={rental.cancellationNote}
            selectedDelivery={rental.selectedDelivery}
          />
        </div>

        {/* ═══════════════════ VENDOR VIEW ═══════════════════ */}
        {isVendor ? (
          <div className="space-y-4">
            {/* Overdue warning */}
            {rental.status === 'OVERDUE' && (
              <OverdueWarningCard rental={rental} audience="vendor" />
            )}

            {/* Customer profile */}
            <section className="bg-white rounded-2xl border border-ink-100 p-5">
              <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-4">Customer profile</p>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-ink-100 flex-shrink-0 flex items-center justify-center">
                  {renter?.avatarUrl
                    ? <img src={renter.avatarUrl} alt={renter.name} className="w-full h-full object-cover" />
                    : <User size={22} className="text-ink-300" />}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-ink-900 text-lg">{renter?.name ?? '—'}</p>
                  <p className="text-xs text-ink-400 mt-0.5">
                    Member {renter?.createdAt ? formatDistanceToNow(new Date(renter.createdAt), { addSuffix: true }) : ''}
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-2.5">
                {renter?.phone && (
                  <div className="flex items-center gap-2.5 text-sm text-ink-700">
                    <Phone size={14} className="text-ink-400 flex-shrink-0" /> {renter.phone}
                  </div>
                )}
                {renter?.address && (
                  <div className="flex items-center gap-2.5 text-sm text-ink-700">
                    <MapPin size={14} className="text-ink-400 flex-shrink-0" /> {renter.address}
                  </div>
                )}
                {bkashNote && (
                  <div className="flex items-center gap-2.5 text-sm text-ink-700">
                    <span className="text-base flex-shrink-0">🟣</span> bKash: {bkashNote}
                  </div>
                )}
                {rental.deliveryAddress && (
                  <div className="flex items-center gap-2.5 text-sm text-ink-700">
                    <Truck size={14} className="text-ink-400 flex-shrink-0" /> Delivery: {rental.deliveryAddress}
                  </div>
                )}
                {extraNotes && (
                  <div className="mt-3 p-3 bg-ink-50 rounded-xl text-sm text-ink-600 italic">
                    "{extraNotes}"
                  </div>
                )}
              </div>
            </section>

            {/* Rental details + pricing */}
            <section className="bg-white rounded-2xl border border-ink-100 p-5">
              <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-4">Rental details</p>
              <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                <div>
                  <p className="text-ink-400 text-xs mb-0.5">Start date</p>
                  <p className="font-medium text-ink-800">{format(new Date(rental.startDate), 'dd MMM yyyy')}</p>
                </div>
                <div>
                  <p className="text-ink-400 text-xs mb-0.5">End date</p>
                  <p className="font-medium text-ink-800">{format(new Date(rental.endDate), 'dd MMM yyyy')}</p>
                </div>
                <div>
                  <p className="text-ink-400 text-xs mb-0.5">Duration</p>
                  <p className="font-medium text-ink-800 flex items-center gap-1">
                    <Calendar size={12} className="text-copper" /> {rental.totalDays} day{rental.totalDays !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="border-t border-ink-100 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-ink-600">
                  <span>Rental fee</span><span>{formatBDT(rental.rentalFee)}</span>
                </div>
                <div className="flex justify-between text-ink-600">
                  <span>Platform fee</span><span>{formatBDT(rental.platformFee)}</span>
                </div>
                {isCourier && rental.courierForwardFee ? (
                  <div className="flex justify-between text-ink-600">
                    <span className="flex items-center gap-1"><Truck size={11} className="text-ink-400" /> Courier forward fee</span>
                    <span>{formatBDT(rental.courierForwardFee)}</span>
                  </div>
                ) : rental.deliveryFee > 0 ? (
                  <div className="flex justify-between text-ink-600">
                    <span>Delivery fee</span><span>{formatBDT(rental.deliveryFee)}</span>
                  </div>
                ) : null}
                <div className="h-px bg-ink-100" />
                <div className="flex justify-between font-semibold text-ink-800">
                  <span>Subtotal</span><span>{formatBDT(subTotal)}</span>
                </div>
                <div className="flex justify-between text-xs text-ink-500">
                  <span className="flex items-center gap-1"><Shield size={11} className="text-forest" /> Deposit (held)</span>
                  <span>{formatBDT(rental.depositAmount)}</span>
                </div>
                {isCourier && rental.courierReturnFee && (
                  <div className="flex justify-between text-xs text-amber-600">
                    <span className="flex items-center gap-1"><Truck size={11} /> Return courier fee (non-refundable)</span>
                    <span>{formatBDT(rental.courierReturnFee)}</span>
                  </div>
                )}
                <div className="h-px bg-ink-100" />
                <div className="flex justify-between font-bold text-ink-900 text-base">
                  <span>Total</span><span className="text-copper">{formatBDT(totalCharged)}</span>
                </div>
                <div className="flex justify-between text-xs text-forest font-medium pt-1">
                  <span>Your payout (after fees)</span><span>{formatBDT(rental.vendorPayout)}</span>
                </div>
              </div>
            </section>

            {/* Delivery method — what the customer has requested and what the seller must do */}
            {rental.selectedDelivery && (() => {
              const info = DELIVERY_META_FULL[rental.selectedDelivery]
              if (!info) return null
              const Icon = info.icon
              return (
                <section className={cn('rounded-2xl border p-5 space-y-3', info.boxCls)}>
                  <div className="flex items-center gap-2.5">
                    <Icon size={16} className={cn('flex-shrink-0', info.iconCls)} />
                    <p className="font-semibold text-ink-800 text-sm">
                      Delivery method requested: <span className={info.iconCls}>{info.label}</span>
                    </p>
                  </div>
                  <p className="text-sm text-ink-700 leading-relaxed">{info.vendorAction}</p>
                  {(rental.selectedDelivery === 'SELLER_DELIVERY' || rental.selectedDelivery === 'COURIER') && rental.deliveryAddress && (
                    <div className="flex items-start gap-2.5 p-3 bg-white/80 rounded-xl border border-white">
                      <MapPin size={13} className="flex-shrink-0 mt-0.5 text-ink-400" />
                      <div>
                        <p className="text-[10px] font-semibold text-ink-500 uppercase tracking-wide mb-0.5">Customer delivery address</p>
                        <p className="text-sm text-ink-800 font-medium">{rental.deliveryAddress}</p>
                      </div>
                    </div>
                  )}
                  {/* Pickup/return address editing — once confirmed; while pending, these are set in "Your decision" below */}
                  {rental.status !== 'PENDING_CONFIRMATION' && rental.selectedDelivery === 'CUSTOMER_PICKUP' && (
                    <PickupAddressEditor
                      rentalId={rental.id}
                      currentAddress={rental.pickupAddress}
                      onDone={() => refetch()}
                    />
                  )}
                  {rental.status !== 'PENDING_CONFIRMATION' && (rental.selectedDelivery === 'CUSTOMER_PICKUP' || rental.selectedDelivery === 'COURIER') && (
                    <ReturnAddressEditor
                      rentalId={rental.id}
                      currentAddress={rental.returnAddress}
                      pickupAddress={rental.selectedDelivery === 'CUSTOMER_PICKUP' ? rental.pickupAddress : null}
                      isPickupDelivery={rental.selectedDelivery === 'CUSTOMER_PICKUP'}
                      onDone={() => refetch()}
                    />
                  )}
                </section>
              )
            })()}

            {/* Vendor action: pending → approve/decline/reject */}
            {rental.status === 'PENDING_CONFIRMATION' && (
              <VendorActionPanel rentalId={rental.id} selectedDelivery={rental.selectedDelivery} onDone={() => refetch()} />
            )}

            {/* Vendor action: payment received → ship */}
            {rental.status === 'READY_FOR_PICKUP' && (
              <ShipPanel
                rentalId={rental.id}
                selectedDelivery={rental.selectedDelivery}
                deliveryAddress={rental.deliveryAddress}
                onDone={() => refetch()}
              />
            )}

            {/* Vendor action: customer requested return → inspect */}
            {rental.status === 'RETURN_INITIATED' && (
              <>
                {/* Return details from customer */}
                {(rental.returnMethod || rental.returnDate || rental.returnTrackingNumber) && (
                  <div className="bg-white rounded-2xl border border-ink-100 p-5">
                    <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-3">Return details from customer</p>
                    <div className="space-y-2 text-sm">
                      {rental.returnMethod && (
                        <div className="flex items-center gap-2.5 text-ink-700">
                          <RotateCcw size={14} className="text-ink-400 flex-shrink-0" />
                          <span><span className="text-ink-400">Method:</span> {rental.returnMethod.replace(/_/g, ' ')}</span>
                        </div>
                      )}
                      {rental.returnDate && (
                        <div className="flex items-center gap-2.5 text-ink-700">
                          <Calendar size={14} className="text-ink-400 flex-shrink-0" />
                          <span><span className="text-ink-400">Return date:</span> {format(new Date(rental.returnDate), 'dd MMM yyyy')}</span>
                        </div>
                      )}
                      {rental.returnTrackingNumber && (
                        <div className="flex items-center gap-2.5 text-ink-700">
                          <Package size={14} className="text-ink-400 flex-shrink-0" />
                          <span><span className="text-ink-400">Tracking:</span> {rental.returnTrackingNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <ReturnInspectionPanel
                  rentalId={rental.id}
                  depositAmount={rental.depositAmount}
                  endDate={rental.endDate}
                  pricePerDay={rental.pricePerDay}
                  onDone={() => refetch()}
                />
              </>
            )}

            {/* Shipment info card — vendor, SHIPPED */}
            {rental.status === 'SHIPPED' && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-blue-800">
                  <Truck size={16} className="flex-shrink-0" />
                  <p className="font-semibold text-sm">
                    {rental.selectedDelivery === 'CUSTOMER_PICKUP'
                      ? 'Item collected — awaiting customer confirmation'
                      : 'Product Shipped — awaiting customer confirmation'}
                  </p>
                </div>
                <div className="space-y-2 text-sm">
                  {rental.shipmentMethod && (
                    <p className="text-blue-700"><span className="text-blue-500">Method:</span> {rental.shipmentMethod}</p>
                  )}
                  {rental.trackingNumber && (
                    <p className="text-blue-700"><span className="text-blue-500">Tracking:</span> {rental.trackingNumber}</p>
                  )}
                  {rental.estimatedDeliveryDate && (
                    <p className="text-blue-700">
                      <span className="text-blue-500">Est. delivery:</span>{' '}
                      {format(new Date(rental.estimatedDeliveryDate), 'dd MMM yyyy')}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Static status banner for all other states */}
            {!['PENDING_CONFIRMATION', 'READY_FOR_PICKUP', 'SHIPPED', 'RETURN_INITIATED'].includes(rental.status) && cfg && (
              <div className={cn('flex items-start gap-3 p-5 rounded-2xl border', cfg.bannerCls)}>
                <StatusIcon size={18} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">{cfg.label}</p>
                  <p className="text-xs mt-0.5 opacity-80">
                    {rental.status === 'CANCELLED' && rental.cancellationNote
                      ? `Reason: ${rental.cancellationNote}`
                      : cfg.vendorDesc}
                  </p>
                </div>
              </div>
            )}

            {/* Return outcome — COMPLETED + returnRecord */}
            {rental.status === 'COMPLETED' && rental.returnRecord && (
              <ReturnOutcomeCard returnRecord={rental.returnRecord} depositAmount={rental.depositAmount} isVendor />
            )}

            {/* Review panel — vendor */}
            {rental.status === 'COMPLETED' && (
              <VendorReviewPanel rentalId={rental.id} refetch={refetch} />
            )}
          </div>

        ) : (
          /* ═══════════════════ CUSTOMER VIEW ═══════════════════ */
          <div className="space-y-4">
            {/* Status banner */}
            {cfg && (() => {
              const isPickupShipped = rental.status === 'SHIPPED' && rental.selectedDelivery === 'CUSTOMER_PICKUP'
              return (
                <div className={cn('flex items-start gap-3 p-5 rounded-2xl border', isPickupShipped ? 'bg-blue-50 border-blue-200 text-blue-800' : cfg.bannerCls)}>
                  <StatusIcon size={20} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">
                      {isPickupShipped ? 'Ready for Collection' : cfg.label}
                    </p>
                    <p className="text-sm mt-0.5 opacity-80">
                      {rental.status === 'CANCELLED' && rental.cancellationNote
                        ? `Reason: ${rental.cancellationNote}`
                        : rental.status === 'READY_FOR_PICKUP' && rental.selectedDelivery === 'CUSTOMER_PICKUP'
                          ? 'Payment received! You can now contact the seller to arrange a pickup time and collect the item.'
                          : isPickupShipped
                            ? 'The seller has confirmed the item is ready. Please go to the seller\'s location to collect it.'
                            : cfg.customerDesc}
                    </p>
                  </div>
                </div>
              )
            })()}

            {/* Overdue warning */}
            {rental.status === 'OVERDUE' && (
              <OverdueWarningCard rental={rental} audience="customer" />
            )}

            {/* Confirm collection — customer, READY_FOR_PICKUP + CUSTOMER_PICKUP */}
            {rental.status === 'READY_FOR_PICKUP' && rental.selectedDelivery === 'CUSTOMER_PICKUP' && (
              <CustomerCollectPanel rentalId={rental.id} onDone={() => refetch()} />
            )}

            {/* Confirm collection — customer, SHIPPED + CUSTOMER_PICKUP (legacy rentals use confirm-receipt) */}
            {rental.status === 'SHIPPED' && rental.selectedDelivery === 'CUSTOMER_PICKUP' && (
              <CustomerCollectPanel rentalId={rental.id} onDone={() => refetch()} useReceiptEndpoint />
            )}

            {/* Pay Now CTA — only when CONFIRMED */}
            {rental.status === 'CONFIRMED' && (
              <div className="bg-white rounded-2xl border-2 border-[#E2136E]/30 p-5 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-ink-800 flex items-center gap-2">
                    <span className="text-xl">🟣</span> Payment Required
                  </p>
                  <p className="text-sm text-ink-500 mt-0.5">
                    Complete demo bKash payment to confirm your booking.
                  </p>
                </div>
                <Link
                  href={`/rentals/${rental.id}/pay`}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-[#E2136E] text-white text-sm font-bold rounded-xl hover:bg-[#C4115E] transition whitespace-nowrap"
                >
                  Pay {formatBDT(totalCharged)} <ChevronRight size={14} />
                </Link>
              </div>
            )}

            {/* Booking details */}
            <div className="bg-white rounded-2xl border border-ink-100 p-5">
              <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-4">Booking details</p>
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <p className="text-ink-400 text-xs mb-0.5">Start date</p>
                  <p className="font-medium text-ink-800">{format(new Date(rental.startDate), 'dd MMM yyyy')}</p>
                </div>
                <div>
                  <p className="text-ink-400 text-xs mb-0.5">End date</p>
                  <p className="font-medium text-ink-800">{format(new Date(rental.endDate), 'dd MMM yyyy')}</p>
                </div>
                <div>
                  <p className="text-ink-400 text-xs mb-0.5">Duration</p>
                  <p className="font-medium text-ink-800">{rental.totalDays} day{rental.totalDays !== 1 ? 's' : ''}</p>
                </div>
                {bkashNote && (
                  <div>
                    <p className="text-ink-400 text-xs mb-0.5">Payment</p>
                    <p className="font-medium text-ink-800 flex items-center gap-1.5">
                      <span>🟣</span> bKash · {bkashNote}
                    </p>
                  </div>
                )}
              </div>
              {/* Delivery method — highlighted card */}
              {rental.selectedDelivery && (() => {
                const info = DELIVERY_META_FULL[rental.selectedDelivery]
                if (!info) return null
                const Icon = info.icon
                return (
                  <div className={cn('flex items-start gap-3 p-4 rounded-xl border', info.boxCls)}>
                    <Icon size={15} className={cn('flex-shrink-0 mt-0.5', info.iconCls)} />
                    <div>
                      <p className="text-sm font-semibold text-ink-800">{info.label}</p>
                      {rental.status !== 'COMPLETED' && rental.status !== 'ACTIVE' && (
                        <p className="text-xs text-ink-600 mt-0.5 leading-relaxed">{info.customerDesc}</p>
                      )}
                      {rental.deliveryAddress && rental.selectedDelivery !== 'CUSTOMER_PICKUP' && (
                        <p className="text-xs text-ink-700 mt-1.5 font-medium">
                          {rental.status === 'COMPLETED' || rental.status === 'ACTIVE' ? 'Delivered to' : 'Delivery to'}: {rental.deliveryAddress}
                        </p>
                      )}
                      {rental.selectedDelivery === 'CUSTOMER_PICKUP' && (
                        rental.pickupAddress ? (
                          <div className="mt-2.5 flex items-start gap-2 bg-white/80 rounded-lg border border-blue-100 px-3 py-2.5">
                            <MapPin size={13} className="text-blue-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-[10px] font-semibold text-blue-500 uppercase tracking-wide mb-0.5">Pickup address</p>
                              <p className="text-sm font-medium text-ink-800">{rental.pickupAddress}</p>
                            </div>
                          </div>
                        ) : rental.status !== 'PENDING_CONFIRMATION' ? (
                          <p className="text-xs text-amber-600 mt-2 flex items-center gap-1.5">
                            <MapPin size={11} /> Pickup address will be shared by the seller soon.
                          </p>
                        ) : null
                      )}
                      {(rental.selectedDelivery === 'CUSTOMER_PICKUP' || rental.selectedDelivery === 'COURIER') && (
                        rental.returnAddress ? (
                          <div className="mt-2.5 flex items-start gap-2 bg-white/80 rounded-lg border border-copper/20 px-3 py-2.5">
                            <RotateCcw size={13} className="text-copper flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-[10px] font-semibold text-copper uppercase tracking-wide mb-0.5">Return address</p>
                              <p className="text-sm font-medium text-ink-800">{rental.returnAddress}</p>
                            </div>
                          </div>
                        ) : ['ACTIVE', 'RETURN_INITIATED', 'RETURN_RECEIVED', 'DEPOSIT_PROCESSING'].includes(rental.status) ? (
                          <p className="text-xs text-amber-600 mt-2 flex items-center gap-1.5">
                            <RotateCcw size={11} /> The seller hasn't shared a return address yet — contact them before returning the item.
                          </p>
                        ) : null
                      )}
                    </div>
                  </div>
                )
              })()}
            </div>

            {/* Payment breakdown */}
            <div className="bg-white rounded-2xl border border-ink-100 p-5">
              <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-4">Payment breakdown</p>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-ink-600">
                  <span>Rental fee</span><span>{formatBDT(customerRentalFee)}</span>
                </div>
                {isCourier && rental.courierForwardFee ? (
                  <div className="flex justify-between text-ink-600">
                    <span className="flex items-center gap-1"><Truck size={11} className="text-ink-400" /> Courier forward fee</span>
                    <span>{formatBDT(rental.courierForwardFee)}</span>
                  </div>
                ) : rental.deliveryFee > 0 ? (
                  <div className="flex justify-between text-ink-600">
                    <span>Delivery fee</span><span>{formatBDT(rental.deliveryFee)}</span>
                  </div>
                ) : null}
                <div className="h-px bg-ink-100" />
                <div className="flex justify-between font-semibold text-ink-800">
                  <span>Subtotal</span><span>{formatBDT(subTotal)}</span>
                </div>
                <div className="flex justify-between text-xs text-ink-500">
                  <span className="flex items-center gap-1"><Shield size={11} className="text-forest" /> Security deposit (refundable)</span>
                  <span className="text-forest">+ {formatBDT(rental.depositAmount)}</span>
                </div>
                {isCourier && rental.courierReturnFee && (
                  <div className="flex justify-between text-xs text-amber-600">
                    <span className="flex items-center gap-1"><Truck size={11} /> Return courier fee (non-refundable)</span>
                    <span>{formatBDT(rental.courierReturnFee)}</span>
                  </div>
                )}
                <div className="h-px bg-ink-100" />
                <div className="flex justify-between font-bold text-ink-900 text-base">
                  <span>Total</span>
                  <span className={cn(rental.status === 'CONFIRMED' ? 'text-[#E2136E]' : 'text-copper')}>
                    {formatBDT(totalCharged)}
                  </span>
                </div>
              </div>
            </div>

            {/* Confirm receipt — customer, SHIPPED (non-pickup only; pickup uses CustomerCollectPanel above) */}
            {rental.status === 'SHIPPED' && rental.selectedDelivery !== 'CUSTOMER_PICKUP' && (
              <ConfirmReceiptPanel rental={rental} onDone={() => refetch()} />
            )}

            {/* Return request — when rental is active or overdue */}
            {(rental.status === 'ACTIVE' || rental.status === 'OVERDUE') && (
              <ReturnRequestForm rentalId={rental.id} selectedDelivery={rental.selectedDelivery} returnAddress={rental.returnAddress} onDone={() => refetch()} />
            )}

            {/* Cancel option — only for pending requests */}
            {rental.status === 'PENDING_CONFIRMATION' && (
              <div className="bg-white rounded-2xl border border-ink-100 p-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-ink-700">Need to cancel?</p>
                  <p className="text-xs text-ink-400 mt-0.5">Free cancellation while the request is pending.</p>
                </div>
                <button
                  disabled={cancelRental.isPending}
                  onClick={async () => {
                    if (!confirm('Cancel this rental request? This cannot be undone.')) return
                    await cancelRental.mutateAsync({ id: rental.id, reason: 'RENTER_REQUESTED' })
                    refetch()
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 border border-red-200 text-red-600 text-sm font-medium rounded-xl hover:bg-red-50 transition disabled:opacity-50"
                >
                  {cancelRental.isPending ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />} Cancel
                </button>
              </div>
            )}

            {/* Return outcome — COMPLETED + returnRecord */}
            {rental.status === 'COMPLETED' && rental.returnRecord && (
              <ReturnOutcomeCard returnRecord={rental.returnRecord} depositAmount={rental.depositAmount} />
            )}

            {/* Review panel — customer */}
            {rental.status === 'COMPLETED' && (
              <CustomerReviewPanel rentalId={rental.id} refetch={refetch} />
            )}
          </div>
        )}
      </div>
      <Footer />
    </>
  )
}
