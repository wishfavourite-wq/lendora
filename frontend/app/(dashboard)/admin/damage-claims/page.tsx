'use client'
import { useState } from 'react'
import {
  Gavel, Loader2, CheckCircle, AlertCircle, ChevronDown, ChevronUp,
  ImageOff, Clock, AlertTriangle,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn, formatBDT } from '@/lib/utils'
import {
  useAdminDamageClaims, useResolveDamageClaim,
  type AdminDamageClaim,
} from '@/lib/hooks/use-admin'

/* ── Helpers ────────────────────────────────────────────────────────────── */

function inputCls(focus?: string) {
  return `w-full border border-ink-200 dark:border-surface-raised rounded-xl px-3 py-2 text-sm outline-none
    focus:ring-2 ${focus ?? 'focus:ring-copper/40'} bg-white dark:bg-surface-base`
}

/* ── Single claim card ──────────────────────────────────────────────────── */

function ClaimCard({ claim, onResolved }: { claim: AdminDamageClaim; onResolved: () => void }) {
  const [open,          setOpen]   = useState(false)
  const [lateInput,     setLate]   = useState(String(claim.latePenalty))
  const [damageInput,   setDmg]    = useState(String(claim.damageAmount))
  const resolve                    = useResolveDamageClaim()

  const deposit       = claim.depositAmount
  const lateNum       = Math.max(Number(lateInput)   || 0, 0)
  const damageNum     = Math.max(Number(damageInput)  || 0, 0)
  const totalDeduct   = lateNum + damageNum
  const actualDeduct  = Math.min(totalDeduct, deposit)
  const outstanding   = Math.max(0, totalDeduct - deposit)
  const refundNum     = deposit - actualDeduct

  const outcomeLabel = actualDeduct === 0         ? 'Full Refund to Renter'
    : outstanding > 0                             ? 'Exceeds Deposit — Outstanding Due'
    : actualDeduct >= deposit                     ? 'Full Forfeit'
    : 'Partial Split'

  const outcomeCls = actualDeduct === 0 ? 'text-forest'
    : outstanding > 0                   ? 'text-red-700'
    : actualDeduct >= deposit           ? 'text-red-600'
    : 'text-amber-700'

  const isLate   = claim.lateDays > 0
  const isDamage = claim.damageAmount > 0

  const handleResolve = async () => {
    await resolve.mutateAsync({ id: claim.id, lateDeduction: lateNum, damageDeduction: damageNum })
    onResolved()
  }

  return (
    <div className="bg-white dark:bg-surface-base rounded-2xl border border-ink-100 dark:border-surface-raised overflow-hidden">
      {/* ── Summary row ── */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <p className="font-semibold text-ink-800 dark:text-ink-100 truncate">{claim.productName}</p>
              {isLate && (
                <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 whitespace-nowrap">
                  <Clock size={10} /> {claim.lateDays} day{claim.lateDays !== 1 ? 's' : ''} late
                </span>
              )}
              {isDamage && (
                <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 whitespace-nowrap">
                  <AlertTriangle size={10} /> Damaged
                </span>
              )}
            </div>
            <p className="text-xs text-ink-400">
              Renter: <span className="text-ink-600 dark:text-ink-300">{claim.renterName}</span>
              {' · '}
              Vendor: <span className="text-ink-600 dark:text-ink-300">{claim.vendorName}</span>
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-bold text-ink-900 dark:text-ink-100">{formatBDT(deposit)}</p>
            <p className="text-xs text-ink-400">deposit held</p>
          </div>
        </div>

        {/* Late return info */}
        {isLate && (
          <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-xl mb-3">
            <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1 flex items-center gap-1">
              <Clock size={11} /> Late Return Details
            </p>
            <div className="grid grid-cols-3 gap-2 text-xs text-ink-700 dark:text-ink-300">
              <div>
                <p className="text-ink-400">Due date</p>
                <p className="font-medium">{format(new Date(claim.endDate), 'dd MMM yyyy')}</p>
              </div>
              <div>
                <p className="text-ink-400">Days late</p>
                <p className="font-bold text-red-600">{claim.lateDays}</p>
              </div>
              <div>
                <p className="text-ink-400">Calculated penalty</p>
                <p className="font-bold text-red-600">{formatBDT(claim.latePenalty)}</p>
              </div>
            </div>
            <p className="text-xs text-ink-400 mt-1.5">
              {claim.lateDays} × {formatBDT(claim.pricePerDay)}/day = {formatBDT(claim.latePenalty)}
            </p>
          </div>
        )}

        {/* Damage report */}
        {isDamage && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl mb-3">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1 flex items-center gap-1">
              <AlertCircle size={11} /> Vendor damage report
            </p>
            <p className="text-sm text-ink-700 dark:text-ink-300">
              {claim.damageDescription ?? '(no description provided)'}
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1.5 font-medium">
              Vendor claimed: {formatBDT(claim.damageAmount)}
            </p>
          </div>
        )}

        {/* Evidence photos */}
        {claim.evidence.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-3">
            {claim.evidence.map((e) => (
              <a key={e.id} href={e.fileUrl} target="_blank" rel="noopener noreferrer"
                className="block w-14 h-14 rounded-xl overflow-hidden border border-ink-100 hover:opacity-80 transition flex-shrink-0">
                <img src={e.fileUrl} alt="evidence" className="w-full h-full object-cover" />
              </a>
            ))}
            <p className="self-center text-xs text-ink-400 ml-1">
              {claim.evidence.length} photo{claim.evidence.length !== 1 ? 's' : ''}
            </p>
          </div>
        ) : isDamage && (
          <div className="flex items-center gap-2 text-xs text-ink-300 mb-3">
            <ImageOff size={13} /> No evidence photos uploaded
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-xs text-ink-400">
            Reported {format(new Date(claim.createdAt), 'dd MMM yyyy, HH:mm')}
          </p>
          <button onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-1.5 text-xs font-semibold text-copper hover:text-copper/80 transition">
            {open
              ? <><ChevronUp size={13} /> Hide form</>
              : <><ChevronDown size={13} /> Review & Resolve</>}
          </button>
        </div>
      </div>

      {/* ── Resolution form ── */}
      {open && (
        <div className="border-t border-ink-100 dark:border-surface-raised bg-ink-50/50 dark:bg-surface-raised/20 p-5">
          <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-4">Admin Decision</p>

          {/* Two deduction inputs side-by-side */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-xs font-semibold text-ink-600 dark:text-ink-400 mb-1.5 block">
                Late penalty (৳)
                {!isLate && <span className="font-normal text-ink-400 ml-1">— none reported</span>}
              </label>
              <input type="number" value={lateInput} onChange={(e) => setLate(e.target.value)}
                min={0} placeholder="0" disabled={!isLate && lateNum === 0}
                className={inputCls('focus:ring-red-200')} />
              {isLate && lateNum !== claim.latePenalty && (
                <button onClick={() => setLate(String(claim.latePenalty))}
                  className="text-xs text-copper hover:underline mt-1">
                  Reset to calculated ({formatBDT(claim.latePenalty)})
                </button>
              )}
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-600 dark:text-ink-400 mb-1.5 block">
                Damage compensation (৳)
                {!isDamage && <span className="font-normal text-ink-400 ml-1">— none reported</span>}
              </label>
              <input type="number" value={damageInput} onChange={(e) => setDmg(e.target.value)}
                min={0} placeholder="0" disabled={!isDamage && damageNum === 0}
                className={inputCls('focus:ring-amber-200')} />
              {isDamage && damageNum !== claim.damageAmount && (
                <button onClick={() => setDmg(String(claim.damageAmount))}
                  className="text-xs text-copper hover:underline mt-1">
                  Reset to vendor's ask ({formatBDT(claim.damageAmount)})
                </button>
              )}
            </div>
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => { setLate('0'); setDmg('0') }}
              className={cn('px-3 py-1.5 text-xs font-medium rounded-lg border transition',
                lateNum === 0 && damageNum === 0
                  ? 'bg-forest text-white border-forest'
                  : 'border-ink-200 text-ink-600 hover:bg-ink-100')}>
              Full refund (no deductions)
            </button>
            {(isLate || isDamage) && (
              <button
                onClick={() => { setLate(String(claim.latePenalty)); setDmg(String(claim.damageAmount)) }}
                className={cn('px-3 py-1.5 text-xs font-medium rounded-lg border transition',
                  lateNum === claim.latePenalty && damageNum === claim.damageAmount
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'border-ink-200 text-ink-600 hover:bg-ink-100')}>
                Full reported amounts
              </button>
            )}
          </div>

          {/* Live split preview */}
          <div className={cn('rounded-xl border p-3 mb-4',
            outstanding > 0
              ? 'border-red-200 bg-red-50 dark:bg-red-950/20'
              : 'border-ink-100 dark:border-surface-raised bg-white dark:bg-surface-base')}>
            <p className={cn('text-xs font-semibold mb-2', outcomeCls)}>{outcomeLabel}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <p className="text-ink-400 mb-0.5">Late deduction</p>
                <p className={cn('font-semibold', lateNum > 0 ? 'text-red-600' : 'text-ink-300')}>
                  {formatBDT(lateNum)}
                </p>
              </div>
              <div>
                <p className="text-ink-400 mb-0.5">Damage deduction</p>
                <p className={cn('font-semibold', damageNum > 0 ? 'text-amber-600' : 'text-ink-300')}>
                  {formatBDT(damageNum)}
                </p>
              </div>
              <div>
                <p className="text-ink-400 mb-0.5">Vendor payout</p>
                <p className={cn('font-bold', actualDeduct > 0 ? 'text-copper' : 'text-ink-300')}>
                  {formatBDT(actualDeduct)}
                </p>
              </div>
              <div>
                <p className="text-ink-400 mb-0.5">Renter refund</p>
                <p className={cn('font-bold', refundNum > 0 ? 'text-forest' : 'text-ink-300')}>
                  {formatBDT(refundNum)}
                </p>
              </div>
            </div>
            {outstanding > 0 && (
              <div className="mt-2 pt-2 border-t border-red-200 flex items-center gap-2 text-xs text-red-700 font-medium">
                <AlertTriangle size={12} />
                Outstanding due (exceeds deposit): {formatBDT(outstanding)} — admin tracks separately
              </div>
            )}
          </div>

          <button
            onClick={handleResolve}
            disabled={resolve.isPending}
            className="flex items-center gap-2 px-6 py-2.5 bg-copper text-white text-sm font-semibold rounded-xl hover:bg-copper/90 transition disabled:opacity-50"
          >
            {resolve.isPending
              ? <Loader2 size={14} className="animate-spin" />
              : <Gavel size={14} />}
            Apply Decision & Complete Rental
          </button>
        </div>
      )}
    </div>
  )
}

/* ── Page ───────────────────────────────────────────────────────────────── */

export default function AdminDamageClaimsPage() {
  const [page, setPage]    = useState(1)
  const [resolved, setRes] = useState<string[]>([])
  const { data, isLoading, refetch } = useAdminDamageClaims(page)

  const allItems = data?.items ?? []
  const total    = data?.total ?? 0
  const visible  = allItems.filter((c) => !resolved.includes(c.id))

  const lateCount   = allItems.filter((c) => c.lateDays > 0).length
  const damageCount = allItems.filter((c) => c.damageAmount > 0).length

  const markResolved = (id: string) => {
    setRes((prev) => [...prev, id])
    refetch()
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="font-fraunces text-2xl font-bold text-ink-900 dark:text-ink-100">
          Return Claims
        </h1>
        <p className="text-ink-400 text-sm mt-0.5">
          {isLoading
            ? 'Loading…'
            : `${total} pending · ${lateCount} late return${lateCount !== 1 ? 's' : ''} · ${damageCount} damage claim${damageCount !== 1 ? 's' : ''}`}
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24 text-ink-400">
          <Loader2 size={28} className="animate-spin opacity-40 mr-3" />
          Loading claims…
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-24 text-ink-400">
          <CheckCircle size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No pending return claims</p>
          <p className="text-xs mt-1 text-ink-300">
            Claims appear here for late returns and damage reports that require admin review.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map((claim) => (
            <ClaimCard key={claim.id} claim={claim} onResolved={() => markResolved(claim.id)} />
          ))}
        </div>
      )}

      {total > 0 && (
        <div className="flex justify-between items-center mt-6 text-xs text-ink-500">
          <span>Page {page} · {total} total</span>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1 rounded-lg border border-ink-200 disabled:opacity-40 hover:bg-ink-50 transition">
              Prev
            </button>
            <button onClick={() => setPage((p) => p + 1)} disabled={allItems.length < 20}
              className="px-3 py-1 rounded-lg border border-ink-200 disabled:opacity-40 hover:bg-ink-50 transition">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
