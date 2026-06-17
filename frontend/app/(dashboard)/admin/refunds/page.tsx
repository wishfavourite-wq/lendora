'use client'
import { useState } from 'react'
import { RefreshCw, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { useAdminDeposits } from '@/lib/hooks/use-admin'

const DEPOSIT_STATUS_LABEL: Record<string, string> = {
  FULL_REFUND_PENDING:    'Refund Pending',
  PARTIAL_REFUND_PENDING: 'Partial Pending',
  FULLY_REFUNDED:         'Refunded',
  PARTIALLY_REFUNDED:     'Partial Refund',
  FORFEITED:              'Forfeited',
}
const DEPOSIT_STATUS_BADGE: Record<string, { cls: string; icon: React.ReactNode }> = {
  FULL_REFUND_PENDING:    { cls: 'bg-amber-100 text-amber-700', icon: <Clock size={11} /> },
  PARTIAL_REFUND_PENDING: { cls: 'bg-amber-100 text-amber-700', icon: <Clock size={11} /> },
  FULLY_REFUNDED:         { cls: 'bg-forest/10 text-forest',    icon: <CheckCircle size={11} /> },
  PARTIALLY_REFUNDED:     { cls: 'bg-teal-100 text-teal-700',   icon: <CheckCircle size={11} /> },
  FORFEITED:              { cls: 'bg-red-100 text-red-600',      icon: <AlertCircle size={11} /> },
}

export default function AdminRefundsPage() {
  const [page, setPage] = useState(1)

  const { data, isLoading } = useAdminDeposits(page)
  const items = data?.items ?? []
  const total = data?.total ?? 0

  const pendingCount    = items.filter((r) => r.depositStatus.endsWith('PENDING')).length
  const pendingAmount   = items.filter((r) => r.depositStatus.endsWith('PENDING')).reduce((s, r) => s + r.depositRefund, 0)
  const refundedAmount  = items.filter((r) => r.depositStatus.includes('REFUNDED')).reduce((s, r) => s + r.depositRefund, 0)
  const forfeitedAmount = items.filter((r) => r.depositStatus === 'FORFEITED').reduce((s, r) => s + r.depositDeduction, 0)

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="font-fraunces text-2xl font-bold text-ink-900 dark:text-ink-100">Deposit & Refunds</h1>
        <p className="text-ink-400 text-sm mt-0.5">
          {isLoading ? 'Loading…' : `${total} deposits being tracked · ${pendingCount} pending on this page`}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total tracked',  value: total },
          { label: 'Pending (page)', value: pendingCount },
          { label: 'Pending amount', value: `৳${pendingAmount.toLocaleString()}` },
          { label: 'Refunded (page)',value: `৳${refundedAmount.toLocaleString()}` },
        ].map((c) => (
          <div key={c.label} className="bg-white dark:bg-surface-base rounded-2xl border border-ink-100 dark:border-surface-raised p-4">
            <p className="font-fraunces text-2xl font-bold text-ink-900 dark:text-ink-100">{c.value}</p>
            <p className="text-xs text-ink-400 mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-surface-base rounded-2xl border border-ink-100 dark:border-surface-raised overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 dark:border-surface-raised bg-ink-50 dark:bg-surface-raised">
                {['Renter', 'Vendor', 'Product', 'Deposit', 'Deduction', 'Refund', 'Condition', 'Status', 'Updated'].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-ink-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50 dark:divide-surface-raised">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-5 py-16 text-center text-ink-400">
                    <Loader2 size={28} className="mx-auto mb-3 animate-spin opacity-40" />
                    Loading deposits…
                  </td>
                </tr>
              ) : !items.length ? (
                <tr>
                  <td colSpan={9} className="px-5 py-16 text-center text-ink-400">
                    <RefreshCw size={28} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No deposit records found</p>
                  </td>
                </tr>
              ) : items.map((r) => {
                const badge = DEPOSIT_STATUS_BADGE[r.depositStatus]
                return (
                  <tr key={r.id} className="hover:bg-ink-50/50 dark:hover:bg-surface-raised/50 transition">
                    <td className="px-5 py-4 font-medium text-ink-800 dark:text-ink-200 whitespace-nowrap">{r.renterName}</td>
                    <td className="px-5 py-4 text-ink-500 whitespace-nowrap">{r.vendorName}</td>
                    <td className="px-5 py-4 text-ink-600 dark:text-ink-400 max-w-[140px] truncate">{r.productName}</td>
                    <td className="px-5 py-4 font-semibold text-ink-900 dark:text-ink-100 whitespace-nowrap">৳{r.depositAmount.toLocaleString()}</td>
                    <td className="px-5 py-4 text-red-600 whitespace-nowrap">
                      {r.depositDeduction > 0 ? `−৳${r.depositDeduction.toLocaleString()}` : '—'}
                    </td>
                    <td className="px-5 py-4 text-forest font-medium whitespace-nowrap">৳{r.depositRefund.toLocaleString()}</td>
                    <td className="px-5 py-4 text-ink-500 text-xs">{r.condition ?? '—'}</td>
                    <td className="px-5 py-4">
                      {badge && (
                        <span className={cn('flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full w-fit whitespace-nowrap', badge.cls)}>
                          {badge.icon}
                          {DEPOSIT_STATUS_LABEL[r.depositStatus] ?? r.depositStatus}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-ink-400 text-xs whitespace-nowrap">
                      {format(new Date(r.updatedAt), 'dd MMM yy')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-ink-100 dark:border-surface-raised text-xs text-ink-500 flex justify-between items-center">
          <span>Page {page} · {total} total</span>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1 rounded-lg border border-ink-200 disabled:opacity-40 hover:bg-ink-50 transition">Prev</button>
            <button onClick={() => setPage((p) => p + 1)} disabled={items.length < 20}
              className="px-3 py-1 rounded-lg border border-ink-200 disabled:opacity-40 hover:bg-ink-50 transition">Next</button>
          </div>
        </div>
      </div>
    </div>
  )
}
