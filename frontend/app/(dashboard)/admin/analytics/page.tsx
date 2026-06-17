'use client'
import { BarChart2, TrendingUp, Users, ShoppingBag, Star, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAdminStats, useAdminAnalytics } from '@/lib/hooks/use-admin'

function BarChart({ monthly }: { monthly: { month: string; rentals: number; revenue: number }[] }) {
  const maxRev = Math.max(...monthly.map((m) => m.revenue), 1)
  return (
    <div className="flex items-end gap-2 h-40 mt-4">
      {monthly.map((m) => {
        const pct = (m.revenue / maxRev) * 100
        return (
          <div key={m.month} className="flex-1 flex flex-col items-center gap-1 group">
            <div className="w-full relative">
              <div
                className="w-full bg-copper/20 group-hover:bg-copper/30 rounded-t-lg transition-all duration-300"
                style={{ height: `${Math.max((pct / 100) * 140, m.revenue > 0 ? 4 : 0)}px` }}
                title={`৳${m.revenue.toLocaleString()}`}
              />
            </div>
            <span className="text-[10px] text-ink-400">{m.month}</span>
          </div>
        )
      })}
    </div>
  )
}

function DonutRing({ pct, color }: { pct: number; color: string }) {
  const r = 18, circ = 2 * Math.PI * r
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" className="flex-shrink-0">
      <circle cx="22" cy="22" r={r} fill="none" stroke="#f0ede8" strokeWidth="5" />
      <circle cx="22" cy="22" r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={`${(pct / 100) * circ} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 22 22)" />
    </svg>
  )
}

const CAT_COLORS = ['#C87941', '#2D6A4F', '#e76f51', '#457b9d', '#adb5bd']

export default function AdminAnalyticsPage() {
  const { data: stats,     isLoading: statsLoading }     = useAdminStats()
  const { data: analytics, isLoading: analyticsLoading } = useAdminAnalytics()

  const isLoading = statsLoading || analyticsLoading

  const monthly    = analytics?.monthly     ?? []
  const categories = analytics?.categories  ?? []
  const topVendors = analytics?.topVendors  ?? []

  const ytdRevenue   = monthly.reduce((s, m) => s + m.revenue, 0)
  const ytdRentals   = monthly.reduce((s, m) => s + m.rentals, 0)
  const avgPerRental = ytdRentals > 0 ? Math.round(ytdRevenue / ytdRentals) : 0

  const currentYear = new Date().getFullYear()

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 size={28} className="animate-spin text-copper" />
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="font-fraunces text-2xl font-bold text-ink-900">Analytics</h1>
        <p className="text-ink-400 text-sm mt-0.5">Platform performance overview</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total rentals',  value: stats?.totalRentals ?? ytdRentals,       icon: <ShoppingBag size={18} className="text-copper" /> },
          { label: 'Revenue (YTD)',  value: `৳${ytdRevenue.toLocaleString()}`,        icon: <TrendingUp  size={18} className="text-forest" /> },
          { label: 'Avg per rental', value: `৳${avgPerRental.toLocaleString()}`,      icon: <BarChart2   size={18} className="text-blue-500" /> },
          { label: 'Active vendors', value: stats?.totalVendors ?? 0,                 icon: <Users       size={18} className="text-ink-500" /> },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-2xl border border-ink-100 p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-xl bg-ink-50">{c.icon}</div>
            </div>
            <p className="font-fraunces text-2xl font-bold text-ink-900">{c.value}</p>
            <p className="text-xs text-ink-400 mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue chart */}
        <div className="bg-white rounded-2xl border border-ink-100 p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-semibold text-ink-800">Monthly Revenue</h2>
            <span className="text-xs text-ink-400">{currentYear}</span>
          </div>
          <p className="text-2xl font-fraunces font-bold text-copper mb-1">৳{ytdRevenue.toLocaleString()}</p>
          <p className="text-xs text-ink-400 mb-4">Year to date</p>
          {monthly.length > 0
            ? <BarChart monthly={monthly} />
            : <div className="h-40 flex items-center justify-center text-ink-300 text-sm">No rental data yet</div>
          }
          {monthly.length > 0 && (
            <>
              <div className="flex justify-between mt-3">
                {monthly.map((m) => (
                  <div key={m.month} className="flex-1 text-center">
                    <p className="text-[10px] font-medium text-ink-700">{m.rentals}</p>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-ink-300 text-center mt-1">rentals per month</p>
            </>
          )}
        </div>

        {/* Category breakdown */}
        <div className="bg-white rounded-2xl border border-ink-100 p-6">
          <h2 className="font-semibold text-ink-800 mb-5">Listings by Category</h2>
          {categories.length > 0 ? (
            <div className="space-y-4">
              {categories.map((c, i) => (
                <div key={c.name} className="flex items-center gap-4">
                  <DonutRing pct={c.pct} color={CAT_COLORS[i] ?? '#adb5bd'} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-ink-700 truncate">{c.name}</span>
                      <span className="text-sm font-semibold text-ink-900 ml-2 flex-shrink-0">{c.pct}%</span>
                    </div>
                    <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${c.pct}%`, backgroundColor: CAT_COLORS[i] }} />
                    </div>
                    <p className="text-[10px] text-ink-400 mt-0.5">{c.count} listing{c.count !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-ink-300 text-sm">No category data yet</div>
          )}
        </div>
      </div>

      {/* Top vendors */}
      <div className="bg-white rounded-2xl border border-ink-100 p-6">
        <h2 className="font-semibold text-ink-800 mb-5">Top Vendors by Revenue</h2>
        {topVendors.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100">
                  {['Rank', 'Vendor', 'Rentals', 'Revenue', 'Rating'].map((h) => (
                    <th key={h} className="text-left pb-3 pr-6 text-xs font-semibold text-ink-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50">
                {topVendors.map((v, i) => (
                  <tr key={v.name} className="hover:bg-ink-50/50 transition">
                    <td className="py-3 pr-6">
                      <span className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                        i === 0 ? 'bg-amber-100 text-amber-600' : i === 1 ? 'bg-ink-100 text-ink-600' : 'bg-ink-50 text-ink-400')}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="py-3 pr-6 font-medium text-ink-800">{v.name}</td>
                    <td className="py-3 pr-6 text-ink-600">{v.rentals}</td>
                    <td className="py-3 pr-6 font-semibold text-ink-900">৳{v.revenue.toLocaleString()}</td>
                    <td className="py-3 pr-6">
                      <span className="flex items-center gap-1 text-ink-700">
                        <Star size={12} className="text-amber-400 fill-amber-400" />
                        {v.rating > 0 ? v.rating.toFixed(1) : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex items-center justify-center h-24 text-ink-300 text-sm">No active vendors yet</div>
        )}
      </div>
    </div>
  )
}
