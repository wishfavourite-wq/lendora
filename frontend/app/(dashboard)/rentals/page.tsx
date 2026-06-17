'use client'
import { useState }     from 'react'
import Link             from 'next/link'
import { format, addDays } from 'date-fns'
import {
  Package, Calendar, Loader2, XCircle, CheckCircle2, Clock,
  ChevronRight, RotateCcw, CalendarPlus, AlertTriangle, ClipboardCheck,
} from 'lucide-react'
import Navbar           from '@/components/shared/Navbar'
import VendorNavbar     from '@/components/shared/VendorNavbar'
import Footer           from '@/components/home/Footer'
import {
  useMyRentals, useCancelRental,
  useConfirmRental, useDeclineRental, useInitiateReturn, useExtendRental, useConfirmReturn,
  useDemoMode,
} from '@/lib/hooks/use-rentals'
import { useAuthStore } from '@/store/auth.store'
import { formatBDT, cn } from '@/lib/utils'

const ACTIVE_STATUSES = [
  'CONFIRMED',
  'READY_FOR_PICKUP',
  'SHIPPED',
  'ACTIVE',
  'OVERDUE',
  'RETURN_INITIATED',
  'RETURN_RECEIVED',
  'DEPOSIT_PROCESSING',
].join(',')

const STATUS_TABS = [
  { label: 'Pending',   value: 'PENDING_CONFIRMATION' },
  { label: 'Active',    value: ACTIVE_STATUSES },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
]

const STATUS_STYLES: Record<string, string> = {
  PENDING_CONFIRMATION: 'bg-amber-100 text-amber-700',
  CONFIRMED:            'bg-blue-100 text-blue-700',
  READY_FOR_PICKUP:     'bg-indigo-100 text-indigo-700',
  SHIPPED:              'bg-sky-100 text-sky-700',
  ACTIVE:               'bg-forest/10 text-forest',
  OVERDUE:              'bg-red-100 text-red-600',
  RETURN_INITIATED:     'bg-purple-100 text-purple-700',
  RETURN_RECEIVED:      'bg-teal-100 text-teal-700',
  DEPOSIT_PROCESSING:   'bg-orange-100 text-orange-700',
  COMPLETED:            'bg-ink-100 text-ink-600',
  CANCELLED:            'bg-red-100 text-red-600',
}

const STATUS_LABEL: Record<string, string> = {
  PENDING_CONFIRMATION: 'Awaiting Approval',
  CONFIRMED:            'Confirmed',
  READY_FOR_PICKUP:     'Ready for Pickup',
  SHIPPED:              'Shipped',
  ACTIVE:               'Active',
  OVERDUE:              'Overdue',
  RETURN_INITIATED:     'Return Requested',
  RETURN_RECEIVED:      'Return Received',
  DEPOSIT_PROCESSING:   'Processing Deposit',
  COMPLETED:            'Completed',
  CANCELLED:            'Cancelled',
}

export default function RentalsPage() {
  const user                       = useAuthStore((s) => s.user)
  const isVendor                   = user?.role === 'VENDOR'
  const [activeTab, setActiveTab]  = useState('PENDING_CONFIRMATION')
  const { data: isDemoMode }       = useDemoMode()
  const { data, isLoading }        = useMyRentals(activeTab, {
    refetchInterval: isDemoMode ? 30_000 : false,
  })
  const cancelRental               = useCancelRental()
  const confirmRental              = useConfirmRental()
  const declineRental              = useDeclineRental()
  const initiateReturn             = useInitiateReturn()
  const extendRental               = useExtendRental()
  const confirmReturn              = useConfirmReturn()
  const [actioning, setActioning]  = useState<string | null>(null)
  const [extendId,  setExtendId]   = useState<string | null>(null)
  const [extendDate, setExtendDate] = useState('')
  const [extendCurrentEnd, setExtendCurrentEnd] = useState('')
  const [confirmReturnId,  setConfirmReturnId]   = useState<string | null>(null)
  const [returnCondition,  setReturnCondition]   = useState('GOOD')
  const [returnNote,       setReturnNote]        = useState('')

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this rental? This cannot be undone.')) return
    setActioning(id)
    try { await cancelRental.mutateAsync({ id, reason: 'RENTER_REQUESTED' }) }
    finally { setActioning(null) }
  }

  const handleAccept = async (id: string) => {
    setActioning(id)
    try { await confirmRental.mutateAsync({ id }) }
    finally { setActioning(null) }
  }

  const handleDecline = async (id: string) => {
    if (!confirm('Decline this rental request?')) return
    setActioning(id)
    try { await declineRental.mutateAsync({ id }) }
    finally { setActioning(null) }
  }

  const handleRequestComplete = async (id: string) => {
    if (!confirm('Request to complete this rental and return the item?')) return
    setActioning(id)
    try { await initiateReturn.mutateAsync({ id, returnMethod: 'CUSTOMER_DROPOFF' }) }
    finally { setActioning(null) }
  }

  const openExtend = (id: string, currentEnd: string) => {
    setExtendId(id)
    setExtendCurrentEnd(currentEnd)
    setExtendDate(format(addDays(new Date(currentEnd), 1), 'yyyy-MM-dd'))
  }

  const handleExtend = async () => {
    if (!extendId || !extendDate) return
    setActioning(extendId)
    try { await extendRental.mutateAsync({ id: extendId, newEndDate: extendDate }) }
    finally { setActioning(null); setExtendId(null) }
  }

  const handleConfirmReturn = async () => {
    if (!confirmReturnId) return
    setActioning(confirmReturnId)
    try {
      await confirmReturn.mutateAsync({
        id: confirmReturnId,
        condition: returnCondition,
        damageDescription: returnNote || undefined,
      })
      setConfirmReturnId(null)
      setReturnNote('')
      setReturnCondition('GOOD')
    } finally { setActioning(null) }
  }

  return (
    <>
      {/* Extend rental modal */}
      {extendId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-semibold text-ink-900 mb-1 flex items-center gap-2">
              <CalendarPlus size={16} className="text-copper" /> Extend Rental Period
            </h3>
            <p className="text-xs text-ink-400 mb-4">
              Current end date: <span className="font-medium text-ink-700">{format(new Date(extendCurrentEnd), 'dd MMM yyyy')}</span>
            </p>
            <label className="block text-sm font-medium text-ink-700 mb-1">New end date</label>
            <input
              type="date"
              value={extendDate}
              min={format(addDays(new Date(extendCurrentEnd), 1), 'yyyy-MM-dd')}
              onChange={(e) => setExtendDate(e.target.value)}
              className="w-full border border-ink-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-copper/30 mb-5"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setExtendId(null)}
                className="px-4 py-2 text-sm border border-ink-200 rounded-xl text-ink-600 hover:border-ink-300"
              >
                Cancel
              </button>
              <button
                onClick={handleExtend}
                disabled={!extendDate || actioning === extendId}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-copper text-white rounded-xl hover:bg-copper/90 disabled:opacity-50 transition"
              >
                {actioning === extendId && <Loader2 size={13} className="animate-spin" />}
                Confirm Extension
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark Complete modal (vendor) */}
      {confirmReturnId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-semibold text-ink-900 mb-1 flex items-center gap-2">
              <ClipboardCheck size={16} className="text-forest" /> Confirm Return
            </h3>
            <p className="text-xs text-ink-400 mb-4">Confirm that the item has been returned and select its condition.</p>

            <label className="block text-sm font-medium text-ink-700 mb-1">Item condition</label>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { value: 'GOOD',         label: 'Good' },
                { value: 'MINOR_DAMAGE', label: 'Minor Damage' },
                { value: 'MAJOR_DAMAGE', label: 'Major Damage' },
                { value: 'DAMAGED',      label: 'Damaged' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setReturnCondition(opt.value)}
                  className={cn(
                    'px-3 py-2 rounded-xl border text-xs font-medium transition text-left',
                    returnCondition === opt.value
                      ? 'border-forest bg-forest/10 text-forest'
                      : 'border-ink-200 text-ink-600 hover:border-ink-300',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {['MINOR_DAMAGE', 'MAJOR_DAMAGE', 'DAMAGED'].includes(returnCondition) && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-ink-700 mb-1">Damage notes (optional)</label>
                <textarea
                  value={returnNote}
                  onChange={(e) => setReturnNote(e.target.value)}
                  rows={2}
                  placeholder="Describe the damage…"
                  className="w-full border border-ink-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-copper/30 resize-none"
                />
                <p className="mt-1.5 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 leading-relaxed">
                  Damage returns require admin review. Your rent fee and any damage compensation will be credited after the admin resolves the claim.
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setConfirmReturnId(null); setReturnNote(''); setReturnCondition('GOOD') }}
                className="px-4 py-2 text-sm border border-ink-200 rounded-xl text-ink-600 hover:border-ink-300"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReturn}
                disabled={actioning === confirmReturnId}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-forest text-white rounded-xl hover:bg-forest/90 disabled:opacity-50 transition"
              >
                {actioning === confirmReturnId && <Loader2 size={13} className="animate-spin" />}
                Mark Complete
              </button>
            </div>
          </div>
        </div>
      )}

      {isVendor ? <VendorNavbar /> : <Navbar />}
      <div className="flex flex-col min-h-[calc(100vh-0px)]">
        <div className={cn('max-w-4xl mx-auto w-full px-4 sm:px-6 pb-12 grow', !isVendor ? 'pt-28' : 'pt-8')}>
          <h1 className="font-fraunces text-2xl font-bold text-ink-900 mb-1">
            {isVendor ? 'Rental Orders' : 'My Rentals'}
          </h1>
          <p className="text-ink-400 text-sm mb-6">
            {isVendor
              ? 'Review and manage rental requests for your listings.'
              : 'Track all your rental requests and active rentals.'}
          </p>

          {/* Status tabs */}
          <div role="tablist" className="flex gap-1 overflow-x-auto pb-1 scrollbar-none mb-6">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                role="tab"
                aria-selected={activeTab === tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition',
                  activeTab === tab.value
                    ? 'bg-copper text-white shadow-sm'
                    : 'text-ink-500 hover:text-ink-800 hover:bg-ink-100',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-ink-100 p-5 animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 bg-ink-100 rounded-xl flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-ink-100 rounded w-2/3" />
                      <div className="h-4 bg-ink-100 rounded w-1/3" />
                      <div className="h-4 bg-ink-100 rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : !data?.items.length ? (
            <div className="text-center py-20 text-ink-400">
              <Package size={48} className="mx-auto mb-4 opacity-30" aria-hidden />
              <p className="text-lg font-medium text-ink-600">
                {activeTab === 'PENDING_CONFIRMATION'
                  ? (isVendor ? 'No pending requests' : 'No pending rentals')
                  : activeTab === ACTIVE_STATUSES
                  ? (isVendor ? 'No active orders' : 'No active rentals')
                  : activeTab === 'COMPLETED'
                  ? 'No completed rentals yet'
                  : 'No cancelled rentals'}
              </p>
              {activeTab === 'PENDING_CONFIRMATION' && !isVendor && (
                <Link
                  href="/products"
                  className="inline-block mt-5 px-5 py-2.5 bg-copper text-white text-sm font-medium rounded-xl hover:bg-copper/90 transition"
                >
                  Browse products
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {data.items.map((rental) => {
                const isPending   = rental.status === 'PENDING_CONFIRMATION'
                const isActive    = rental.status === 'ACTIVE' || rental.status === 'OVERDUE'
                const isOverdue   = rental.status === 'OVERDUE'
                const busy        = actioning === rental.id
                return (
                  <div key={rental.id}
                    className={cn(
                      'bg-white rounded-2xl border transition p-5',
                      isPending && isVendor
                        ? 'border-amber-200 shadow-sm'
                        : 'border-ink-100 hover:border-ink-200',
                    )}
                  >
                    <div className="flex gap-4">
                      {/* Product image */}
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-ink-100 flex-shrink-0">
                        {rental.productImage
                          ? <img src={rental.productImage} alt={rental.productName} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h2 className="font-semibold text-ink-800 truncate">{rental.productName}</h2>
                            <p className="text-xs text-ink-400 mt-0.5">
                              {isVendor
                                ? `Rented by ${rental.renterName ?? 'Customer'}`
                                : `From ${rental.vendorName}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {isOverdue ? (
                              <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-600">
                                <AlertTriangle size={10} /> Overdue · {rental.lateDays}d
                              </span>
                            ) : !isVendor && rental.status === 'CONFIRMED' ? (
                              <Link
                                href={`/rentals/${rental.id}/pay`}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E2136E] text-white text-xs font-bold rounded-lg hover:bg-[#C4115E] transition whitespace-nowrap"
                              >
                                <span className="text-sm leading-none">🟣</span> Make Payment
                              </Link>
                            ) : (
                              <span className={cn(
                                'text-xs font-medium px-2.5 py-1 rounded-full',
                                STATUS_STYLES[rental.status] ?? 'bg-ink-100 text-ink-600',
                              )}>
                                {STATUS_LABEL[rental.status] ?? rental.status.replace(/_/g, ' ')}
                              </span>
                            )}
                          </div>
                        </div>

                        {isOverdue && (
                          <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5">
                            <AlertTriangle size={11} className="flex-shrink-0" />
                            <span>
                              Late fee {isVendor ? 'collected' : 'deducted'}: {formatBDT(rental.lateFeeAmount)} · Remaining deposit: {formatBDT(Math.max(0, rental.depositAmount - rental.lateFeeAmount))}
                            </span>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2.5 text-xs text-ink-500">
                          <span className="flex items-center gap-1">
                            <Calendar size={11} />
                            {format(new Date(rental.startDate), 'dd MMM')} – {format(new Date(rental.endDate), 'dd MMM yyyy')}
                          </span>
                          <span className="hidden sm:inline text-ink-300">·</span>
                          <span>{rental.totalDays} day{rental.totalDays > 1 ? 's' : ''}</span>
                          <span className="hidden sm:inline text-ink-300">·</span>
                          <span className="font-semibold text-ink-700">{formatBDT(rental.totalAmount)}</span>
                        </div>

                        {/* Actions row */}
                        <div className="flex items-center gap-2 mt-3">
                          {/* Vendor — pending: Accept / Decline */}
                          {isVendor && isPending && (
                            <>
                              <button
                                onClick={() => handleAccept(rental.id)}
                                disabled={busy}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-forest text-white text-xs font-semibold rounded-lg hover:bg-forest/90 transition disabled:opacity-50"
                              >
                                {busy ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
                                Accept
                              </button>
                              <button
                                onClick={() => handleDecline(rental.id)}
                                disabled={busy}
                                className="flex items-center gap-1.5 px-3 py-1.5 border border-amber-300 text-amber-700 text-xs font-semibold rounded-lg hover:bg-amber-50 transition disabled:opacity-50"
                              >
                                {busy ? <Loader2 size={11} className="animate-spin" /> : <XCircle size={11} />}
                                Decline
                              </button>
                              <Link
                                href={`/rentals/${rental.id}`}
                                className="flex items-center gap-1 text-xs text-copper hover:underline font-medium ml-auto"
                              >
                                Full review <ChevronRight size={12} />
                              </Link>
                            </>
                          )}

                          {/* Vendor — non-pending */}
                          {isVendor && !isPending && (
                            <>
                              <Link
                                href={`/rentals/${rental.id}`}
                                className="flex items-center gap-1 text-xs text-copper hover:underline font-medium"
                              >
                                View details <ChevronRight size={12} />
                              </Link>
                              {rental.status === 'RETURN_INITIATED' && (
                                <button
                                  onClick={() => { setConfirmReturnId(rental.id); setReturnCondition('GOOD'); setReturnNote('') }}
                                  disabled={busy}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-forest text-white text-xs font-semibold rounded-lg hover:bg-forest/90 transition disabled:opacity-50 ml-auto"
                                >
                                  {busy ? <Loader2 size={11} className="animate-spin" /> : <ClipboardCheck size={11} />}
                                  Mark Complete
                                </button>
                              )}
                            </>
                          )}

                          {/* Customer */}
                          {!isVendor && (
                            <>
                              <Link
                                href={`/rentals/${rental.id}`}
                                className="flex items-center gap-1 text-xs text-copper hover:underline font-medium"
                              >
                                View details <ChevronRight size={12} />
                              </Link>
                              {/* Request complete (return) when rental is active */}
                              {isActive && (
                                <button
                                  onClick={() => handleRequestComplete(rental.id)}
                                  disabled={busy}
                                  className="flex items-center gap-1.5 px-3 py-1.5 border border-forest text-forest text-xs font-semibold rounded-lg hover:bg-forest/5 transition disabled:opacity-50 ml-auto"
                                >
                                  {busy ? <Loader2 size={11} className="animate-spin" /> : <RotateCcw size={11} />}
                                  Request Complete
                                </button>
                              )}
                              {/* Cancel option while pending */}
                              {isPending && (
                                <button
                                  onClick={() => handleCancel(rental.id)}
                                  disabled={busy}
                                  className="flex items-center gap-1 text-xs text-red-500 hover:underline disabled:opacity-50 ml-auto"
                                >
                                  {busy ? <Loader2 size={11} className="animate-spin" /> : <XCircle size={11} />}
                                  Cancel
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Vendor hint banners */}
                    {isVendor && isPending && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 rounded-xl px-3 py-2">
                        <Clock size={11} />
                        <span>Awaiting your approval — accept or decline to notify the customer</span>
                      </div>
                    )}
                    {isVendor && rental.status === 'RETURN_INITIATED' && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-purple-700 bg-purple-50 rounded-xl px-3 py-2">
                        <RotateCcw size={11} />
                        <span>Customer has requested to return this item — confirm to complete the rental</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
        <Footer />
      </div>
    </>
  )
}
