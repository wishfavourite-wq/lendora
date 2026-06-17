'use client'
import { useState }     from 'react'
import { format }       from 'date-fns'
import { Loader2, Scale } from 'lucide-react'
import { useDisputes, useResolveDispute } from '@/lib/hooks/use-admin'
import { formatBDT, cn } from '@/lib/utils'

const STATUS_TABS = ['', 'OPEN', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED'] as const
const STATUS_BADGE: Record<string, string> = {
  OPEN:         'bg-red-100 text-red-600',
  UNDER_REVIEW: 'bg-amber-100 text-amber-700',
  RESOLVED:     'bg-forest/10 text-forest',
  CLOSED:       'bg-ink-100 text-ink-500',
}

interface ResolveForm {
  id:               string
  resolution:       string
  depositDeduction: string
  note:             string
}

export default function AdminDisputesPage() {
  const [status, setStatus] = useState<string>('')
  const [page, setPage]     = useState(1)
  const [resolving, setResolving] = useState<ResolveForm | null>(null)

  const { data, isLoading }  = useDisputes(status, page)
  const resolveDispute       = useResolveDispute()

  const handleResolve = async () => {
    if (!resolving) return
    const deduction = resolving.depositDeduction ? Number(resolving.depositDeduction) : null
    await resolveDispute.mutateAsync({
      id:               resolving.id,
      resolution:       resolving.resolution,
      depositDeduction: deduction,
      note:             resolving.note,
    })
    setResolving(null)
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="font-fraunces text-2xl font-bold text-ink-900">Disputes</h1>
        <p className="text-ink-400 text-sm mt-0.5">Review and resolve rental disputes</p>
      </div>

      {/* Status filter */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            onClick={() => { setStatus(s); setPage(1) }}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition',
              status === s ? 'bg-copper text-white' : 'text-ink-500 hover:bg-ink-100'
            )}
          >
            {s === '' ? 'All' : s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="grid">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50">
                {['Type', 'Description', 'Claimed', 'Status', 'Filed', 'Actions'].map((h) => (
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
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 bg-ink-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : !data?.items.length ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-ink-400">
                    <Scale size={32} className="mx-auto mb-3 opacity-30" />
                    No disputes found
                  </td>
                </tr>
              ) : (
                data.items.map((d) => (
                  <tr key={d.id} className="hover:bg-ink-50/50 transition">
                    <td className="px-5 py-4 font-medium text-ink-800 whitespace-nowrap">
                      {d.type.replace(/_/g, ' ')}
                    </td>
                    <td className="px-5 py-4 text-ink-500 max-w-xs">
                      <p className="truncate">{d.description}</p>
                    </td>
                    <td className="px-5 py-4 text-ink-600 whitespace-nowrap">
                      {d.claimedAmount ? formatBDT(d.claimedAmount) : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full', STATUS_BADGE[d.status] ?? 'bg-ink-100 text-ink-500')}>
                        {d.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-ink-400 text-xs whitespace-nowrap">
                      {format(new Date(d.createdAt), 'dd MMM yyyy')}
                    </td>
                    <td className="px-5 py-4">
                      {d.status === 'OPEN' || d.status === 'UNDER_REVIEW' ? (
                        <button
                          onClick={() => setResolving({ id: d.id, resolution: '', depositDeduction: '', note: '' })}
                          className="text-xs font-medium text-copper hover:underline flex items-center gap-1"
                        >
                          <Scale size={12} /> Resolve
                        </button>
                      ) : (
                        <span className="text-xs text-ink-300">
                          {d.resolvedAt ? format(new Date(d.resolvedAt), 'dd MMM') : '—'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data && data.total > 20 && (
          <div className="px-5 py-3 border-t border-ink-100 flex items-center justify-between text-sm text-ink-500">
            <span>{data.total} total disputes</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
                className="px-3 py-1.5 border border-ink-200 rounded-lg disabled:opacity-40 text-xs hover:border-copper/50 transition">
                Previous
              </button>
              <button onClick={() => setPage((p) => p + 1)} disabled={page * 20 >= data.total}
                className="px-3 py-1.5 border border-ink-200 rounded-lg disabled:opacity-40 text-xs hover:border-copper/50 transition">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Resolve modal */}
      {resolving && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
            <h3 className="font-semibold text-ink-900 mb-5">Resolve dispute</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">Resolution decision</label>
                <textarea
                  value={resolving.resolution}
                  onChange={(e) => setResolving({ ...resolving, resolution: e.target.value })}
                  rows={3}
                  placeholder="Describe the outcome and reasoning…"
                  className="w-full border border-ink-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-copper/30 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">
                  Deposit deduction (৳) <span className="text-ink-400 font-normal">— leave blank to refund in full</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={resolving.depositDeduction}
                  onChange={(e) => setResolving({ ...resolving, depositDeduction: e.target.value })}
                  placeholder="0"
                  className="w-full border border-ink-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-copper/30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">Internal note</label>
                <textarea
                  value={resolving.note}
                  onChange={(e) => setResolving({ ...resolving, note: e.target.value })}
                  rows={2}
                  placeholder="Notes visible only to admins…"
                  className="w-full border border-ink-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-copper/30 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-5 justify-end">
              <button
                onClick={() => setResolving(null)}
                className="px-4 py-2 text-sm text-ink-600 border border-ink-200 rounded-xl hover:border-ink-300"
              >
                Cancel
              </button>
              <button
                onClick={handleResolve}
                disabled={resolving.resolution.length < 10 || resolving.note.length < 5 || resolveDispute.isPending}
                className="px-5 py-2 text-sm font-medium bg-copper text-white rounded-xl hover:bg-copper/90 disabled:opacity-50 transition flex items-center gap-2"
              >
                {resolveDispute.isPending && <Loader2 size={14} className="animate-spin" />}
                Confirm resolution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
