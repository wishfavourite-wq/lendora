'use client'
import { useState }     from 'react'
import { format }       from 'date-fns'
import {
  Wallet, TrendingUp, Loader2, ArrowDownRight,
  AlertTriangle, CheckCircle2, Clock, Receipt,
} from 'lucide-react'
import { useMyPayouts } from '@/lib/hooks/use-payments'
import { formatBDT, cn } from '@/lib/utils'
import type { VendorPayout } from '@/lib/hooks/use-payments'

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function payoutType(ref: string | null): 'rental' | 'damage' | 'late' | 'late_damage' | 'other' {
  if (!ref) return 'other'
  if (ref.startsWith('RENTAL_PAYOUT'))   return 'rental'
  if (ref.startsWith('DAMAGE_DEDUCTION')) return 'damage'
  if (ref.startsWith('LATE_FEE'))         return 'late'
  if (ref.startsWith('LATE_AND_DAMAGE'))  return 'late_damage'
  return 'other'
}

const TYPE_LABEL: Record<string, string> = {
  rental:      'Rent Fee Credited',
  damage:      'Damage Fee Credited',
  late:        'Late Fee Credited',
  late_damage: 'Late & Damage Fee Credited',
  other:       'Payout',
}

const TYPE_CLS: Record<string, string> = {
  rental:      'bg-forest/10 text-forest',
  damage:      'bg-amber-100 text-amber-700',
  late:        'bg-red-100 text-red-600',
  late_damage: 'bg-red-100 text-red-700',
  other:       'bg-ink-100 text-ink-600',
}

const STATUS_CLS: Record<string, string> = {
  COMPLETED: 'bg-forest text-white',
  PENDING:   'bg-amber-100 text-amber-700',
  FAILED:    'bg-red-100 text-red-600',
}

/* ── Row component ───────────────────────────────────────────────────────── */

function PayoutRow({ p }: { p: VendorPayout }) {
  const [open, setOpen] = useState(false)
  const type   = payoutType(p.transactionRef)
  const isRent = type === 'rental'
  const commissionPct = isRent && p.platformFeeRate
    ? (p.platformFeeRate * 100).toFixed(0)
    : null

  return (
    <>
      <tr
        className={cn(
          'hover:bg-ink-50/50 transition cursor-pointer',
          open && 'bg-ink-50/50',
        )}
        onClick={() => isRent && setOpen((o) => !o)}
      >
        <td className="px-5 py-4">
          <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', TYPE_CLS[type])}>
            {TYPE_LABEL[type]}
          </span>
        </td>
        <td className="px-5 py-4 text-ink-600 text-sm max-w-[140px] truncate">
          {p.productName ?? `#${p.rentalId.slice(-8).toUpperCase()}`}
        </td>
        <td className="px-5 py-4 font-bold text-ink-900">
          {formatBDT(p.amount)}
          {isRent && commissionPct && (
            <span className="text-xs font-normal text-ink-400 ml-1">net of {commissionPct}%</span>
          )}
        </td>
        <td className="px-5 py-4">
          <span
            title={p.status === 'PENDING' ? 'Customer payment received — your earning is secured. Funds are credited to your account once the rental completes and return is confirmed.' : undefined}
            className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', STATUS_CLS[p.status] ?? 'bg-ink-100 text-ink-600')}
          >
            {p.status === 'COMPLETED' ? 'Completed' : p.status === 'PENDING' ? 'In Progress' : p.status}
          </span>
        </td>
        <td className="px-5 py-4 text-ink-400 text-xs whitespace-nowrap">
          {p.processedAt ? format(new Date(p.processedAt), 'dd MMM yyyy') : '—'}
        </td>
      </tr>

      {/* Expandable commission breakdown — rental type only */}
      {open && isRent && (
        <tr className="bg-forest/5">
          <td colSpan={5} className="px-6 py-4">
            {p.status === 'PENDING' && (
              <div className="flex items-center gap-2 text-xs text-forest bg-forest/5 border border-forest/20 rounded-xl px-4 py-2.5 mb-4">
                <CheckCircle2 size={14} className="flex-shrink-0" />
                <span>Customer payment received — your earning is secured. Funds will be credited to your account automatically once the rental completes and the return is confirmed.</span>
              </div>
            )}
            <div className="flex flex-wrap gap-6 text-sm">
              <div>
                <p className="text-xs text-ink-400 mb-0.5">Rental fee (gross)</p>
                <p className="font-semibold text-ink-800">{formatBDT(p.rentalFee)}</p>
              </div>
              <div className="flex items-center text-red-500 gap-1 self-end pb-1">
                <ArrowDownRight size={14} />
              </div>
              <div>
                <p className="text-xs text-ink-400 mb-0.5">
                  Platform commission ({commissionPct}%)
                </p>
                <p className="font-semibold text-red-600">− {formatBDT(p.platformFee)}</p>
              </div>
              <div className="self-end pb-1 text-ink-400">=</div>
              <div>
                <p className="text-xs text-ink-400 mb-0.5">Your net payout</p>
                <p className="font-bold text-forest">{formatBDT(p.amount)}</p>
              </div>
              <div className="ml-auto self-end">
                <p className="text-xs text-ink-300 font-mono">{p.transactionRef}</p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function VendorPayoutsPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useMyPayouts(page)

  const items       = data?.items ?? []
  const total       = data?.total ?? 0

  // Summary calcs — rental payouts only for earnings/commission
  const rentalItems     = items.filter((p) => payoutType(p.transactionRef) === 'rental')
  const totalGross      = rentalItems.reduce((s, p) => s + p.rentalFee, 0)
  const totalCommission = rentalItems.reduce((s, p) => s + p.platformFee, 0)
  const totalNet        = rentalItems.reduce((s, p) => s + p.amount, 0)
  const bonusItems      = items.filter((p) => payoutType(p.transactionRef) !== 'rental')
  const totalBonus      = bonusItems.reduce((s, p) => s + p.amount, 0)

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="font-fraunces text-2xl font-bold text-ink-900">Payouts</h1>
        <p className="text-ink-400 text-sm mt-0.5">Your rental earnings, commissions, and payout history</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-ink-100 p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-forest/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <TrendingUp size={20} className="text-forest" />
          </div>
          <div>
            <p className="text-xs text-ink-400 uppercase tracking-wide">Gross earnings</p>
            <p className="text-xl font-bold text-ink-900 mt-0.5">{formatBDT(totalGross)}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-ink-100 p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Receipt size={20} className="text-red-500" />
          </div>
          <div>
            <p className="text-xs text-ink-400 uppercase tracking-wide">Commission (2%)</p>
            <p className="text-xl font-bold text-red-600 mt-0.5">− {formatBDT(totalCommission)}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-ink-100 p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-copper/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Wallet size={20} className="text-copper" />
          </div>
          <div>
            <p className="text-xs text-ink-400 uppercase tracking-wide">Net paid out</p>
            <p className="text-xl font-bold text-copper mt-0.5">{formatBDT(totalNet)}</p>
          </div>
        </div>

        {totalBonus > 0 && (
          <div className="bg-white rounded-2xl border border-ink-100 p-5 flex items-center gap-4">
            <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={20} className="text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-ink-400 uppercase tracking-wide">Damage & Late Fees</p>
              <p className="text-xl font-bold text-amber-600 mt-0.5">{formatBDT(totalBonus)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Commission info banner */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl mb-6 text-sm text-amber-800">
        <Receipt size={16} className="flex-shrink-0 mt-0.5 text-amber-600" />
        <div>
          <strong>Platform Commission: 2% per completed rental.</strong>{' '}
          Automatically deducted from your rental earnings and transferred to the Lendora platform wallet.
          Click any "Rent Fee Credited" row to see the full breakdown.
        </div>
      </div>

      {/* Payout table */}
      <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="grid">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50">
                {['Type', 'Product', 'Amount', 'Status', 'Processed'].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-ink-400 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 bg-ink-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : !items.length ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center text-ink-400">
                    <Wallet size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">No payouts yet</p>
                    <p className="text-xs mt-1 text-ink-300">
                      Payouts are created automatically when a rental completes.
                    </p>
                  </td>
                </tr>
              ) : (
                items.map((p) => <PayoutRow key={p.id} p={p} />)
              )}
            </tbody>
          </table>
        </div>

        {total > 0 && (
          <div className="px-5 py-3 border-t border-ink-100 flex items-center justify-between text-xs text-ink-500">
            <span>Page {page} · {total} total payout{total !== 1 ? 's' : ''}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
                className="px-3 py-1.5 border border-ink-200 rounded-lg disabled:opacity-40 hover:border-copper/50 transition">
                Previous
              </button>
              <button onClick={() => setPage((p) => p + 1)} disabled={items.length < 20}
                className="px-3 py-1.5 border border-ink-200 rounded-lg disabled:opacity-40 hover:border-copper/50 transition">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
