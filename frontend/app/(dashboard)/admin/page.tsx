'use client'
import {
  useAdminStats, usePendingVendors, useApproveVendor,
  usePendingCustomers, useApproveCustomer,
} from '@/lib/hooks/use-admin'
import { formatBDT, cn } from '@/lib/utils'
import { format }        from 'date-fns'
import {
  Users, Store, Package, UserCheck,
  TrendingUp, Clock, CheckCircle, ArrowRight, ShoppingBag,
} from 'lucide-react'
import Link from 'next/link'

function StatCard({ label, value, icon: Icon, delta, accent = false }: {
  label: string; value: string | number
  icon: React.ComponentType<{ size?: number; className?: string }>
  delta?: string; accent?: boolean
}) {
  return (
    <div className={cn('bg-white rounded-2xl border p-5', accent ? 'border-copper/20' : 'border-ink-100')}>
      <div className="flex items-start justify-between mb-3">
        <div className={cn('p-2 rounded-xl', accent ? 'bg-copper/10' : 'bg-ink-50')}>
          <Icon size={18} className={accent ? 'text-copper' : 'text-ink-400'} />
        </div>
        {delta && (
          <span className="text-xs font-medium text-forest bg-forest/10 px-2 py-0.5 rounded-full">
            {delta}
          </span>
        )}
      </div>
      <p className="font-fraunces text-2xl font-bold text-ink-900">{value}</p>
      <p className="text-xs text-ink-400 mt-0.5">{label}</p>
    </div>
  )
}

export default function AdminOverviewPage() {
  const { data: stats, isLoading: statsLoading } = useAdminStats()
  const { data: pendingVendors }  = usePendingVendors(1, 5)
  const { data: pendingCustomers} = usePendingCustomers(1, 5)
  const approveVendor             = useApproveVendor()
  const approveCustomer           = useApproveCustomer()

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="font-fraunces text-2xl font-bold text-ink-900">Overview</h1>
        <p className="text-ink-400 text-sm mt-1">Platform health at a glance</p>
      </div>

      {/* Row 1: Users / Vendors / Active Customers / Products */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard label="Total users"      value={statsLoading ? '…' : (stats?.totalUsers      ?? 0)} icon={Users}     />
        <StatCard label="Active vendors"   value={statsLoading ? '…' : (stats?.totalVendors    ?? 0)} icon={Store}     />
        <StatCard label="Active customers" value={statsLoading ? '…' : (stats?.activeCustomers ?? 0)} icon={UserCheck} />
        <StatCard label="Listed products"  value={statsLoading ? '…' : (stats?.totalProducts   ?? 0)} icon={Package}   />
      </div>

      {/* Row 2: Rental activity + earnings */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total rentals"     value={statsLoading ? '…' : (stats?.totalRentals   ?? 0)} icon={ShoppingBag} />
        <StatCard label="Active rentals"    value={statsLoading ? '…' : (stats?.activeRentals  ?? 0)} icon={ShoppingBag} />
        <StatCard label="Pending rentals"   value={statsLoading ? '…' : (stats?.pendingRentals ?? 0)} icon={Clock} accent={!!(stats?.pendingRentals)} />
        <StatCard label="Commission earned" value={statsLoading ? '…' : (stats ? formatBDT(stats.totalCommission) : '৳0')} icon={TrendingUp} accent />
      </div>

      {/* Pending approvals — side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Vendor approvals */}
        <div className="bg-white rounded-2xl border border-ink-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-ink-800 flex items-center gap-2">
              <Clock size={16} className="text-amber-500" />
              Pending vendor approvals
              {(pendingVendors?.total ?? 0) > 0 && (
                <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {pendingVendors!.total}
                </span>
              )}
            </h2>
            <Link href="/admin/vendors" className="text-xs text-copper hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>

          {!pendingVendors?.items.length ? (
            <div className="text-center py-8 text-ink-300">
              <CheckCircle size={32} className="mx-auto mb-2" />
              <p className="text-sm">No pending approvals</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingVendors.items.map((v) => (
                <div key={v.id} className="flex items-center justify-between p-3 bg-ink-50 rounded-xl">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink-800 truncate">{v.businessName}</p>
                    <p className="text-xs text-ink-400">
                      {v.district}, {v.division} · {format(new Date(v.createdAt), 'dd MMM yyyy')}
                    </p>
                  </div>
                  <button
                    onClick={() => approveVendor.mutate(v.id)}
                    disabled={approveVendor.isPending}
                    className="ml-3 flex-shrink-0 text-xs font-medium px-3 py-1.5 bg-forest text-white rounded-lg hover:bg-forest/90 disabled:opacity-50 transition"
                  >
                    Approve
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Customer approvals */}
        <div className="bg-white rounded-2xl border border-ink-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-ink-800 flex items-center gap-2">
              <Clock size={16} className="text-blue-500" />
              Pending customer approvals
              {(pendingCustomers?.total ?? 0) > 0 && (
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {pendingCustomers!.total}
                </span>
              )}
            </h2>
            <Link href="/admin/users" className="text-xs text-copper hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>

          {!pendingCustomers?.items.length ? (
            <div className="text-center py-8 text-ink-300">
              <CheckCircle size={32} className="mx-auto mb-2" />
              <p className="text-sm">No pending approvals</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingCustomers.items.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 bg-ink-50 rounded-xl">
                  <div className="flex items-center gap-3 min-w-0">
                    {c.avatarUrl ? (
                      <img src={c.avatarUrl} alt={c.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-blue-600">{c.name[0]?.toUpperCase()}</span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink-800 truncate">{c.name}</p>
                      <p className="text-xs text-ink-400 truncate">{c.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => approveCustomer.mutate(c.id)}
                    disabled={approveCustomer.isPending}
                    className="ml-3 flex-shrink-0 text-xs font-medium px-3 py-1.5 bg-forest text-white rounded-lg hover:bg-forest/90 disabled:opacity-50 transition"
                  >
                    Approve
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
