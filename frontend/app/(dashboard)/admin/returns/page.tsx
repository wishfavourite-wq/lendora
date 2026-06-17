'use client'
import { useState } from 'react'
import { RotateCcw, CheckCircle, AlertCircle, Clock, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { useAdminReturns } from '@/lib/hooks/use-admin'
import { useAdminRentals } from '@/lib/hooks/use-admin'

const CONDITION_BADGE: Record<string, string> = {
  PERFECT:      'bg-forest/10 text-forest',
  GOOD:         'bg-forest/10 text-forest',
  MINOR_DAMAGE: 'bg-amber-100 text-amber-700',
  MAJOR_DAMAGE: 'bg-orange-100 text-orange-700',
  DAMAGED:      'bg-red-100 text-red-600',
}
const DEPOSIT_STATUS_BADGE: Record<string, string> = {
  HELD:                   'bg-blue-100 text-blue-700',
  FULL_REFUND_PENDING:    'bg-amber-100 text-amber-700',
  PARTIAL_REFUND_PENDING: 'bg-amber-100 text-amber-700',
  FULLY_REFUNDED:         'bg-forest/10 text-forest',
  PARTIALLY_REFUNDED:     'bg-teal-100 text-teal-700',
  FORFEITED:              'bg-red-100 text-red-600',
}

export default function AdminReturnsPage() {
  const [tab,           setTab]  = useState<'pending' | 'completed'>('pending')
  const [completedPage, setCPage] = useState(1)
  const [pendingPage,   setPPage] = useState(1)

  const { data: completedData, isLoading: loadingCompleted } = useAdminReturns(completedPage)
  const { data: pendingData,   isLoading: loadingPending }   = useAdminRentals('RETURN_INITIATED', '', pendingPage, 20)

  const completedItems = completedData?.items ?? []
  const completedTotal = completedData?.total ?? 0
  const pendingItems   = pendingData?.items   ?? []
  const pendingTotal   = pendingData?.total   ?? 0

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="font-fraunces text-2xl font-bold text-ink-900 dark:text-ink-100">Return Management</h1>
        <p className="text-ink-400 text-sm mt-0.5">
          {pendingTotal > 0 && `${pendingTotal} pending · `}{completedTotal} completed
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-ink-50 p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab('pending')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition',
            tab === 'pending' ? 'bg-white shadow-sm text-ink-900' : 'text-ink-500 hover:text-ink-700',
          )}
        >
          <Clock size={14} />
          Pending Requests
          {pendingTotal > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full">{pendingTotal}</span>
          )}
        </button>
        <button
          onClick={() => setTab('completed')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition',
            tab === 'completed' ? 'bg-white shadow-sm text-ink-900' : 'text-ink-500 hover:text-ink-700',
          )}
        >
          <CheckCircle size={14} />
          Completed Returns
        </button>
      </div>

      {tab === 'pending' ? (
        /* ── Pending return requests ── */
        <div className="bg-white dark:bg-surface-base rounded-2xl border border-ink-100 dark:border-surface-raised overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 dark:border-surface-raised bg-ink-50 dark:bg-surface-raised">
                  {['Renter', 'Vendor', 'Product', 'Rental Period', 'Amount', 'Requested On'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-ink-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50 dark:divide-surface-raised">
                {loadingPending ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center text-ink-400">
                      <Loader2 size={28} className="mx-auto mb-3 animate-spin opacity-40" />
                      Loading…
                    </td>
                  </tr>
                ) : !pendingItems.length ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center text-ink-400">
                      <RotateCcw size={28} className="mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No pending return requests</p>
                    </td>
                  </tr>
                ) : pendingItems.map((r) => (
                  <tr key={r.id} className="hover:bg-ink-50/50 dark:hover:bg-surface-raised/50 transition">
                    <td className="px-5 py-4">
                      <p className="font-medium text-ink-800 dark:text-ink-200 whitespace-nowrap">{r.renterName}</p>
                      <p className="text-xs text-ink-400">{r.renterEmail}</p>
                    </td>
                    <td className="px-5 py-4 text-ink-500 whitespace-nowrap">{r.vendorName}</td>
                    <td className="px-5 py-4 text-ink-700 dark:text-ink-300 max-w-[150px] truncate">{r.productName}</td>
                    <td className="px-5 py-4 text-ink-500 text-xs whitespace-nowrap">
                      {format(new Date(r.startDate), 'dd MMM')} → {format(new Date(r.endDate), 'dd MMM yy')}
                      <span className="block text-ink-300">{r.totalDays}d</span>
                    </td>
                    <td className="px-5 py-4 font-medium text-ink-800 dark:text-ink-200 whitespace-nowrap">৳{r.totalAmount.toLocaleString()}</td>
                    <td className="px-5 py-4 text-ink-400 text-xs whitespace-nowrap">{format(new Date(r.createdAt), 'dd MMM yy')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-ink-100 dark:border-surface-raised text-xs text-ink-500 flex justify-between items-center">
            <span>Page {pendingPage} · {pendingTotal} total</span>
            <div className="flex gap-2">
              <button onClick={() => setPPage((p) => Math.max(1, p - 1))} disabled={pendingPage === 1}
                className="px-3 py-1 rounded-lg border border-ink-200 disabled:opacity-40 hover:bg-ink-50 transition">Prev</button>
              <button onClick={() => setPPage((p) => p + 1)} disabled={pendingItems.length < 20}
                className="px-3 py-1 rounded-lg border border-ink-200 disabled:opacity-40 hover:bg-ink-50 transition">Next</button>
            </div>
          </div>
        </div>
      ) : (
        /* ── Completed return records ── */
        <div className="bg-white dark:bg-surface-base rounded-2xl border border-ink-100 dark:border-surface-raised overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 dark:border-surface-raised bg-ink-50 dark:bg-surface-raised">
                  {['Renter', 'Vendor', 'Product', 'Date', 'Condition', 'Damage', 'Deposit', 'Deduction', 'Refund', 'Deposit Status'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-ink-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50 dark:divide-surface-raised">
                {loadingCompleted ? (
                  <tr>
                    <td colSpan={10} className="px-5 py-16 text-center text-ink-400">
                      <Loader2 size={28} className="mx-auto mb-3 animate-spin opacity-40" />
                      Loading returns…
                    </td>
                  </tr>
                ) : !completedItems.length ? (
                  <tr>
                    <td colSpan={10} className="px-5 py-16 text-center text-ink-400">
                      <RotateCcw size={28} className="mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No return records found</p>
                    </td>
                  </tr>
                ) : completedItems.map((r) => (
                  <tr key={r.id} className="hover:bg-ink-50/50 dark:hover:bg-surface-raised/50 transition">
                    <td className="px-5 py-4 font-medium text-ink-800 dark:text-ink-200 whitespace-nowrap">{r.renterName}</td>
                    <td className="px-5 py-4 text-ink-500 whitespace-nowrap">{r.vendorName}</td>
                    <td className="px-5 py-4 text-ink-700 dark:text-ink-300 max-w-[140px] truncate">{r.productName}</td>
                    <td className="px-5 py-4 text-ink-500 text-xs whitespace-nowrap">{format(new Date(r.createdAt), 'dd MMM yy')}</td>
                    <td className="px-5 py-4">
                      <span className={cn('flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full w-fit',
                        CONDITION_BADGE[r.condition] ?? 'bg-ink-100 text-ink-600')}>
                        {['GOOD', 'PERFECT'].includes(r.condition) ? <CheckCircle size={11} /> : <AlertCircle size={11} />}
                        {r.condition.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-ink-500 text-xs max-w-[120px] truncate">
                      {r.damageDescription ?? '—'}
                    </td>
                    <td className="px-5 py-4 text-ink-700 dark:text-ink-300 whitespace-nowrap">৳{r.depositPaid.toLocaleString()}</td>
                    <td className="px-5 py-4 text-red-600 whitespace-nowrap">
                      {r.depositDeduction > 0 ? `−৳${r.depositDeduction.toLocaleString()}` : '—'}
                    </td>
                    <td className="px-5 py-4 text-forest font-medium whitespace-nowrap">৳{r.depositRefund.toLocaleString()}</td>
                    <td className="px-5 py-4">
                      <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap',
                        DEPOSIT_STATUS_BADGE[r.depositStatus] ?? 'bg-ink-100 text-ink-600')}>
                        {r.depositStatus.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-ink-100 dark:border-surface-raised text-xs text-ink-500 flex justify-between items-center">
            <span>Page {completedPage} · {completedTotal} total</span>
            <div className="flex gap-2">
              <button onClick={() => setCPage((p) => Math.max(1, p - 1))} disabled={completedPage === 1}
                className="px-3 py-1 rounded-lg border border-ink-200 disabled:opacity-40 hover:bg-ink-50 transition">Prev</button>
              <button onClick={() => setCPage((p) => p + 1)} disabled={completedItems.length < 20}
                className="px-3 py-1 rounded-lg border border-ink-200 disabled:opacity-40 hover:bg-ink-50 transition">Next</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
