'use client'
import { useState } from 'react'
import { TrendingUp, Loader2, DollarSign, Receipt } from 'lucide-react'
import { format } from 'date-fns'
import { cn, formatBDT } from '@/lib/utils'
import { useAdminCommissions } from '@/lib/hooks/use-admin'


export default function AdminCommissionsPage() {
  const [page, setPage] = useState(1)

  const { data, isLoading } = useAdminCommissions(page)
  const items           = data?.items ?? []
  const total           = data?.total ?? 0
  const totalCommission = data?.totalCommission ?? 0

  const pageCommission  = items.reduce((s, r) => s + r.platformFee, 0)
  const avgRate         = items.length
    ? (items.reduce((s, r) => s + r.platformFeeRate, 0) / items.length * 100)
    : 0

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="font-fraunces text-2xl font-bold text-ink-900 dark:text-ink-100">Commissions</h1>
        <p className="text-ink-400 text-sm mt-0.5">
          {isLoading ? 'Loading…' : `${total} completed rentals · ${formatBDT(totalCommission)} total commission collected (2% per rental)`}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total commission',    value: formatBDT(totalCommission), color: 'text-copper' },
          { label: 'This page',          value: formatBDT(pageCommission),  color: 'text-forest' },
          { label: 'Completed rentals',  value: total,                      color: 'text-ink-800 dark:text-ink-100' },
          { label: 'Commission rate',    value: `${avgRate.toFixed(0)}%`,   color: 'text-ink-800 dark:text-ink-100' },
        ].map((c) => (
          <div key={c.label} className="bg-white dark:bg-surface-base rounded-2xl border border-ink-100 dark:border-surface-raised p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={14} className="text-copper" />
              <p className="text-xs text-ink-400">{c.label}</p>
            </div>
            <p className={cn('font-fraunces text-2xl font-bold', c.color)}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Commission info banner */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 rounded-2xl mb-4 text-sm text-amber-800 dark:text-amber-300">
        <Receipt size={16} className="flex-shrink-0 mt-0.5 text-amber-600" />
        <span>
          Lendora charges a <strong>2% platform commission</strong> on each completed rental's fee.
          This is automatically deducted from the seller's payout and credited to the platform wallet.
        </span>
      </div>

      <div className="bg-white dark:bg-surface-base rounded-2xl border border-ink-100 dark:border-surface-raised overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 dark:border-surface-raised bg-ink-50 dark:bg-surface-raised">
                {['Vendor', 'Product', 'Rental Fee', 'Rate', 'Commission Earned', 'Vendor Net', 'Completed'].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-ink-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50 dark:divide-surface-raised">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-ink-400">
                    <Loader2 size={28} className="mx-auto mb-3 animate-spin opacity-40" />
                    Loading commissions…
                  </td>
                </tr>
              ) : !items.length ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-ink-400">
                    <DollarSign size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No commission records yet</p>
                    <p className="text-xs mt-1 text-ink-300">Commissions are collected when rentals complete.</p>
                  </td>
                </tr>
              ) : items.map((r) => (
                <tr key={r.id} className="hover:bg-ink-50/50 dark:hover:bg-surface-raised/50 transition">
                  <td className="px-5 py-4 font-medium text-ink-800 dark:text-ink-200 whitespace-nowrap">{r.vendorName}</td>
                  <td className="px-5 py-4 text-ink-700 dark:text-ink-300 max-w-[160px] truncate">{r.productName}</td>
                  <td className="px-5 py-4 text-ink-700 dark:text-ink-300 whitespace-nowrap">৳{r.rentalFee.toLocaleString()}</td>
                  <td className="px-5 py-4 text-ink-500 whitespace-nowrap">{(r.platformFeeRate * 100).toFixed(0)}%</td>
                  <td className="px-5 py-4 font-bold text-copper whitespace-nowrap">৳{r.platformFee.toLocaleString()}</td>
                  <td className="px-5 py-4 font-medium text-forest whitespace-nowrap">
                    ৳{(r.rentalFee - r.platformFee).toLocaleString()}
                  </td>
                  <td className="px-5 py-4 text-ink-400 text-xs whitespace-nowrap">
                    {format(new Date(r.createdAt), 'dd MMM yy')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-ink-100 dark:border-surface-raised text-xs text-ink-500 flex justify-between items-center">
          <span>Page {page} · {total} total records · All-time: {formatBDT(totalCommission)}</span>
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
