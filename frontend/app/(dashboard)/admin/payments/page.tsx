'use client'
import { useState } from 'react'
import { CreditCard, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { useAdminPayments } from '@/lib/hooks/use-admin'

const STATUS_ICON: Record<string, React.ReactNode> = {
  COMPLETED: <CheckCircle size={13} className="text-forest" />,
  PENDING:   <Clock size={13} className="text-amber-500" />,
  FAILED:    <XCircle size={13} className="text-red-500" />,
  CANCELLED: <XCircle size={13} className="text-ink-400" />,
}
const METHOD_BADGE: Record<string, string> = {
  BKASH: 'bg-pink-100 text-pink-700',
  CASH:  'bg-ink-100 text-ink-600',
  CARD:  'bg-blue-100 text-blue-700',
}
const TYPE_LABEL: Record<string, string> = {
  RENTAL_PAYMENT:   'Rental',
  DEPOSIT:          'Deposit',
  DEPOSIT_REFUND:   'Deposit Refund',
  VENDOR_PAYOUT:    'Vendor Payout',
  DAMAGE_DEDUCTION: 'Damage',
  PLATFORM_FEE:     'Platform Fee',
}

export default function AdminPaymentsPage() {
  const [page, setPage] = useState(1)

  const { data, isLoading } = useAdminPayments(page)
  const items = data?.items ?? []
  const total = data?.total ?? 0

  const totalIn      = items.filter((p) => p.type !== 'DEPOSIT_REFUND' && p.status === 'COMPLETED').reduce((s, p) => s + p.amount, 0)
  const totalRefunds = items.filter((p) => p.type === 'DEPOSIT_REFUND' && p.status === 'COMPLETED').reduce((s, p) => s + p.amount, 0)
  const pending      = items.filter((p) => p.status === 'PENDING').reduce((s, p) => s + p.amount, 0)

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="font-fraunces text-2xl font-bold text-ink-900 dark:text-ink-100">Payments</h1>
        <p className="text-ink-400 text-sm mt-0.5">
          {isLoading ? 'Loading…' : `${total} transactions`}
        </p>
      </div>

      {/* Stats — page-level summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Collected (page)',  value: `৳${totalIn.toLocaleString()}`,      color: 'text-forest'      },
          { label: 'Refunded (page)',   value: `৳${totalRefunds.toLocaleString()}`,  color: 'text-red-500'     },
          { label: 'Pending (page)',    value: `৳${pending.toLocaleString()}`,        color: 'text-amber-600'   },
          { label: 'Total records',     value: total,                                color: 'text-ink-800'     },
        ].map((c) => (
          <div key={c.label} className="bg-white dark:bg-surface-base rounded-2xl border border-ink-100 dark:border-surface-raised p-4">
            <p className={cn('font-fraunces text-2xl font-bold dark:text-ink-100', c.color)}>{c.value}</p>
            <p className="text-xs text-ink-400 mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-surface-base rounded-2xl border border-ink-100 dark:border-surface-raised overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 dark:border-surface-raised bg-ink-50 dark:bg-surface-raised">
                {['Payer', 'Vendor', 'Type', 'Amount', 'Method', 'Reference', 'Status', 'Date'].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-ink-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50 dark:divide-surface-raised">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center text-ink-400">
                    <Loader2 size={28} className="mx-auto mb-3 animate-spin opacity-40" />
                    Loading payments…
                  </td>
                </tr>
              ) : !items.length ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center text-ink-400">
                    <CreditCard size={28} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No transactions found</p>
                  </td>
                </tr>
              ) : items.map((p) => (
                <tr key={p.id} className="hover:bg-ink-50/50 dark:hover:bg-surface-raised/50 transition">
                  <td className="px-5 py-4 text-ink-700 dark:text-ink-300 whitespace-nowrap">{p.payerName}</td>
                  <td className="px-5 py-4 text-ink-500 whitespace-nowrap">{p.vendorName}</td>
                  <td className="px-5 py-4 text-ink-500 text-xs whitespace-nowrap">{TYPE_LABEL[p.type] ?? p.type}</td>
                  <td className="px-5 py-4 font-semibold text-ink-900 dark:text-ink-100 whitespace-nowrap">৳{p.amount.toLocaleString()}</td>
                  <td className="px-5 py-4">
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', METHOD_BADGE[p.method] ?? 'bg-ink-100 text-ink-600')}>
                      {p.method}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-ink-400">{p.reference ?? '—'}</td>
                  <td className="px-5 py-4">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-ink-700 dark:text-ink-300">
                      {STATUS_ICON[p.status] ?? <Clock size={13} className="text-ink-400" />}
                      {p.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-ink-400 text-xs whitespace-nowrap">
                    {format(new Date(p.createdAt), 'dd MMM yy')}
                  </td>
                </tr>
              ))}
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
