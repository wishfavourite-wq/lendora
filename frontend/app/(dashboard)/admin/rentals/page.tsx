'use client'
import { useState } from 'react'
import { ShoppingBag, Search, AlertTriangle, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { useAdminRentals, useAdjustLateFee } from '@/lib/hooks/use-admin'

const TABS = [
  { label: 'Pending',   value: 'PENDING_CONFIRMATION' },
  { label: 'Active',    value: 'ACTIVE,CONFIRMED,READY_FOR_PICKUP,SHIPPED' },
  { label: 'Overdue',   value: 'OVERDUE' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
]

const STATUS_LABEL: Record<string, string> = {
  PENDING_CONFIRMATION: 'Pending',
  CONFIRMED:            'Confirmed',
  READY_FOR_PICKUP:     'Ready',
  SHIPPED:              'Shipped',
  ACTIVE:               'Active',
  OVERDUE:              'Overdue',
  RETURN_INITIATED:     'Return',
  RETURN_RECEIVED:      'Returned',
  DEPOSIT_PROCESSING:   'Deposit',
  COMPLETED:            'Completed',
  CANCELLED:            'Cancelled',
}
const STATUS_BADGE: Record<string, string> = {
  PENDING_CONFIRMATION: 'bg-amber-100 text-amber-700',
  CONFIRMED:            'bg-forest/10 text-forest',
  READY_FOR_PICKUP:     'bg-forest/10 text-forest',
  SHIPPED:              'bg-sky-100 text-sky-700',
  ACTIVE:               'bg-forest/10 text-forest',
  OVERDUE:              'bg-red-100 text-red-600',
  RETURN_INITIATED:     'bg-purple-100 text-purple-700',
  RETURN_RECEIVED:      'bg-teal-100 text-teal-700',
  DEPOSIT_PROCESSING:   'bg-orange-100 text-orange-700',
  COMPLETED:            'bg-ink-100 text-ink-600',
  CANCELLED:            'bg-red-100 text-red-500',
}

export default function AdminRentalsPage() {
  const [tab,    setTab]    = useState(TABS[0]!.value)
  const [search, setSearch] = useState('')
  const [input,  setInput]  = useState('')
  const [page,   setPage]   = useState(1)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editAmount, setEditAmount] = useState('')

  const { data, isLoading } = useAdminRentals(tab, search, page)
  const adjustLateFee       = useAdjustLateFee()

  const openEdit = (id: string, currentAmount: number) => {
    setEditingId(id)
    setEditAmount(String(currentAmount))
  }

  const saveEdit = async () => {
    if (!editingId) return
    const amount = Number(editAmount)
    if (Number.isNaN(amount) || amount < 0) return
    await adjustLateFee.mutateAsync({ id: editingId, lateFeeAmount: amount })
    setEditingId(null)
  }

  const items   = data?.items ?? []
  const total   = data?.total ?? 0

  const handleSearch = () => { setSearch(input); setPage(1) }
  const handleTab    = (v: string) => { setTab(v); setSearch(''); setInput(''); setPage(1) }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <div>
          <h1 className="font-fraunces text-2xl font-bold text-ink-900 dark:text-ink-100">Rental Management</h1>
          <p className="text-ink-400 text-sm mt-0.5">
            {isLoading ? 'Loading…' : `${total} total rentals`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative max-w-xs flex">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            type="search"
            placeholder="Renter, product, vendor…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-ink-200 rounded-l-xl outline-none focus:ring-2 focus:ring-copper/30 bg-white dark:bg-surface-raised dark:border-surface-overlay"
          />
          <button onClick={handleSearch} className="px-3 text-sm bg-copper text-white rounded-r-xl hover:bg-copper/90 transition">Go</button>
        </div>
        <div className="flex gap-1 flex-wrap">
          {TABS.map((t) => (
            <button key={t.value} onClick={() => handleTab(t.value)}
              className={cn('px-3 py-2 rounded-lg text-xs font-medium transition whitespace-nowrap',
                tab === t.value ? 'bg-copper text-white' : 'text-ink-500 hover:bg-ink-100 dark:hover:bg-surface-raised')}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-surface-base rounded-2xl border border-ink-100 dark:border-surface-raised overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 dark:border-surface-raised bg-ink-50 dark:bg-surface-raised">
                {['Renter', 'Vendor', 'Product', 'Dates', 'Amount', 'Deposit', 'Late Fee', 'Status', 'Created'].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-ink-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50 dark:divide-surface-raised">
              {isLoading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[...Array(9)].map((__, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 bg-ink-100 rounded" style={{ width: j === 0 ? '120px' : j === 8 ? '80px' : '90px' }} />
                        {j === 0 && <div className="h-3 bg-ink-100 rounded mt-1 w-24" />}
                      </td>
                    ))}
                  </tr>
                ))
              ) : !items.length ? (
                <tr>
                  <td colSpan={9} className="px-5 py-16 text-center text-ink-400">
                    <ShoppingBag size={32} className="mx-auto mb-3 opacity-30" />
                    No rentals found
                  </td>
                </tr>
              ) : items.map((r) => (
                <tr key={r.id} className="hover:bg-ink-50/50 dark:hover:bg-surface-raised/50 transition">
                  <td className="px-5 py-4">
                    <p className="font-medium text-ink-800 dark:text-ink-200 whitespace-nowrap">{r.renterName}</p>
                    <p className="text-xs text-ink-400">{r.renterEmail}</p>
                  </td>
                  <td className="px-5 py-4 text-ink-500 whitespace-nowrap">{r.vendorName}</td>
                  <td className="px-5 py-4 text-ink-700 dark:text-ink-300 max-w-[160px] truncate">{r.productName}</td>
                  <td className="px-5 py-4 text-ink-500 text-xs whitespace-nowrap">
                    {format(new Date(r.startDate), 'dd MMM')} → {format(new Date(r.endDate), 'dd MMM yy')}
                    <span className="block text-ink-300">{r.totalDays}d</span>
                  </td>
                  <td className="px-5 py-4 font-medium text-ink-800 dark:text-ink-200 whitespace-nowrap">৳{r.totalAmount.toLocaleString()}</td>
                  <td className="px-5 py-4 text-ink-500 whitespace-nowrap">
                    ৳{r.depositAmount.toLocaleString()}
                    {r.lateFeeAmount > 0 && (
                      <span className="block text-[10px] text-ink-400">Remaining ৳{r.depositRemaining.toLocaleString()}</span>
                    )}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    {editingId === r.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number" min={0} value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          className="w-20 px-2 py-1 text-xs border border-ink-200 rounded-lg outline-none focus:ring-2 focus:ring-copper/30"
                        />
                        <button onClick={saveEdit} disabled={adjustLateFee.isPending}
                          className="text-xs font-medium text-forest hover:underline disabled:opacity-50">
                          {adjustLateFee.isPending ? <Loader2 size={11} className="animate-spin" /> : 'Save'}
                        </button>
                        <button onClick={() => setEditingId(null)} className="text-xs text-ink-400 hover:underline">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        {r.lateDays > 0 ? (
                          <span className="flex items-center gap-1 text-xs font-medium text-red-600">
                            <AlertTriangle size={10} /> ৳{r.lateFeeAmount.toLocaleString()} ({r.lateDays}d)
                          </span>
                        ) : (
                          <span className="text-xs text-ink-300">—</span>
                        )}
                        <button onClick={() => openEdit(r.id, r.lateFeeAmount)} className="text-[10px] text-copper underline">Adjust</button>
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap',
                      STATUS_BADGE[r.status] ?? 'bg-ink-100 text-ink-600')}>
                      {STATUS_LABEL[r.status] ?? r.status}
                    </span>
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
