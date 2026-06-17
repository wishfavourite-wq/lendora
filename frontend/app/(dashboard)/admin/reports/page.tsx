'use client'
import { useState } from 'react'
import { FileText, Download, CheckCircle, Loader2, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Report {
  id:       string
  name:     string
  desc:     string
  category: string
  format:   string
}

const REPORTS: Report[] = [
  { id: 'r1', name: 'Monthly Revenue Summary',    desc: 'Total rental revenue, platform fees, and refunds by month.',               category: 'Financial',   format: 'CSV' },
  { id: 'r2', name: 'Vendor Performance Report',  desc: 'Ratings, rentals completed, earnings, and cancellation rates per vendor.', category: 'Vendors',     format: 'CSV' },
  { id: 'r3', name: 'User Registrations',         desc: 'New renter and vendor sign-ups over the selected date range.',             category: 'Users',       format: 'CSV' },
  { id: 'r4', name: 'Rental Activity Log',        desc: 'Full log of all bookings, statuses, and outcome.',                        category: 'Rentals',     format: 'CSV' },
  { id: 'r5', name: 'Dispute & Resolution Report', desc: 'Open, resolved, and closed disputes with resolution notes.',             category: 'Disputes',    format: 'CSV' },
  { id: 'r6', name: 'Deposit & Refund Summary',   desc: 'Deposits collected, refunded in full, partial deductions.',               category: 'Financial',   format: 'CSV' },
  { id: 'r7', name: 'Category Listing Breakdown', desc: 'Number of listings, active vendors, and rentals per category.',           category: 'Marketplace', format: 'CSV' },
  { id: 'r8', name: 'Payment Method Analysis',    desc: 'Split between bKash and cash payments across all transactions.',          category: 'Financial',   format: 'CSV' },
]

const CAT_COLORS: Record<string, string> = {
  Financial:   'bg-copper/10 text-copper',
  Vendors:     'bg-forest/10 text-forest',
  Users:       'bg-blue-100 text-blue-700',
  Rentals:     'bg-purple-100 text-purple-700',
  Disputes:    'bg-red-100 text-red-600',
  Marketplace: 'bg-amber-100 text-amber-700',
}

export default function AdminReportsPage() {
  const [from, setFrom]           = useState('2026-01-01')
  const [to, setTo]               = useState('2026-06-30')
  const [generating, setGen]      = useState<string | null>(null)
  const [done, setDone]           = useState<Set<string>>(new Set())
  const [catFilter, setCatFilter] = useState('All')

  const categories = ['All', ...Array.from(new Set(REPORTS.map((r) => r.category)))]
  const filtered   = catFilter === 'All' ? REPORTS : REPORTS.filter((r) => r.category === catFilter)

  function generate(id: string) {
    if (generating || done.has(id)) return
    setGen(id)
    setTimeout(() => {
      setDone((prev) => new Set(prev).add(id))
      setGen(null)
    }, 1800)
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="font-fraunces text-2xl font-bold text-ink-900 dark:text-ink-100">Reports</h1>
        <p className="text-ink-400 text-sm mt-0.5">Generate and download platform reports as CSV</p>
      </div>

      {/* Date range */}
      <div className="bg-white dark:bg-surface-base rounded-2xl border border-ink-100 dark:border-surface-raised p-5 mb-6">
        <p className="text-sm font-semibold text-ink-700 dark:text-ink-300 mb-3 flex items-center gap-2">
          <Calendar size={15} className="text-ink-400" /> Date range for all reports
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <label className="block text-xs text-ink-400 mb-1">From</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
              className="border border-ink-200 dark:border-surface-overlay rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-copper/30 bg-white dark:bg-surface-raised text-ink-900 dark:text-ink-100" />
          </div>
          <div>
            <label className="block text-xs text-ink-400 mb-1">To</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
              className="border border-ink-200 dark:border-surface-overlay rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-copper/30 bg-white dark:bg-surface-raised text-ink-900 dark:text-ink-100" />
          </div>
          <div className="mt-4">
            <p className="text-xs text-ink-400">Reports will include data from <strong className="text-ink-700 dark:text-ink-300">{from}</strong> to <strong className="text-ink-700 dark:text-ink-300">{to}</strong></p>
          </div>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-1 flex-wrap mb-5">
        {categories.map((c) => (
          <button key={c} onClick={() => setCatFilter(c)}
            className={cn('px-3 py-2 rounded-lg text-xs font-medium transition', catFilter === c ? 'bg-copper text-white' : 'text-ink-500 hover:bg-ink-100 dark:hover:bg-surface-raised')}>
            {c}
          </button>
        ))}
      </div>

      {/* Report cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((r) => {
          const isGenerating = generating === r.id
          const isDone       = done.has(r.id)
          return (
            <div key={r.id} className="bg-white dark:bg-surface-base rounded-2xl border border-ink-100 dark:border-surface-raised p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="p-2 rounded-xl bg-ink-50 dark:bg-surface-raised">
                  <FileText size={18} className="text-ink-400" />
                </div>
                <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0', CAT_COLORS[r.category])}>
                  {r.category}
                </span>
              </div>
              <div>
                <p className="font-semibold text-ink-800 dark:text-ink-200 text-sm">{r.name}</p>
                <p className="text-xs text-ink-500 dark:text-ink-400 mt-1 leading-relaxed">{r.desc}</p>
              </div>
              <div className="flex items-center justify-between mt-auto pt-2">
                <span className="text-xs text-ink-400 font-medium">{r.format} export</span>
                <button
                  onClick={() => generate(r.id)}
                  disabled={isGenerating}
                  className={cn(
                    'flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition',
                    isDone
                      ? 'bg-forest/10 text-forest cursor-default'
                      : 'bg-copper text-white hover:bg-copper/90 disabled:opacity-60'
                  )}
                >
                  {isGenerating ? (
                    <><Loader2 size={12} className="animate-spin" /> Generating…</>
                  ) : isDone ? (
                    <><CheckCircle size={12} /> Downloaded</>
                  ) : (
                    <><Download size={12} /> Generate</>
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
