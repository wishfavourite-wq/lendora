'use client'
import Link             from 'next/link'
import { usePathname }  from 'next/navigation'
import { useState }     from 'react'
import {
  LayoutDashboard, Users, Store,
  Package, LogOut, ChevronRight, Tag, ShoppingBag,
  RotateCcw, RefreshCw, CreditCard, BarChart2,
  Settings, Menu, X, CheckSquare, TrendingUp, Gavel, Star,
} from 'lucide-react'
import { useAuthStore }       from '@/store/auth.store'
import { ProtectedRoute }     from '@/components/shared/ProtectedRoute'
import NotificationBell       from '@/components/shared/NotificationBell'
import { cn }                 from '@/lib/utils'

const NAV = [
  { href: '/admin',              label: 'Dashboard',          icon: LayoutDashboard },
  { href: '/admin/users',        label: 'Customers',          icon: Users },
  { href: '/admin/vendors',      label: 'Sellers',            icon: Store },
  { href: '/admin/products',     label: 'Product Approval',   icon: CheckSquare },
  { href: '/admin/categories',   label: 'Categories',         icon: Tag },
  { href: '/admin/rentals',      label: 'Rentals',            icon: ShoppingBag },
  { href: '/admin/returns',      label: 'Returns',            icon: RotateCcw },
  { href: '/admin/damage-claims', label: 'Damage Claims',     icon: Gavel },
  { href: '/admin/refunds',      label: 'Refunds',            icon: RefreshCw },
  { href: '/admin/payments',     label: 'Payments',           icon: CreditCard },
  { href: '/admin/commissions',  label: 'Commissions',        icon: TrendingUp },
  { href: '/admin/reviews',      label: 'Reviews',            icon: Star },
  { href: '/admin/analytics',    label: 'Analytics',          icon: BarChart2 },
  { href: '/admin/settings',     label: 'Platform Settings',  icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname    = usePathname()
  const logout      = useAuthStore((s) => s.logout)
  const user        = useAuthStore((s) => s.user)
  const [sideOpen, setSideOpen] = useState(false)

  const SidebarContent = () => (
    <>
      <div className="px-5 py-4 border-b border-ink-100 flex items-center justify-between">
        <div>
          <span className="font-fraunces text-lg font-bold text-forest">LENDORA</span>
          <p className="text-[11px] text-ink-400 mt-0.5">Admin Console</p>
        </div>
        <button className="md:hidden text-ink-400 hover:text-ink-700" onClick={() => setSideOpen(false)}>
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 px-3 py-3 overflow-y-auto" aria-label="Admin navigation">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setSideOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition mb-0.5',
                active
                  ? 'bg-copper/10 text-copper'
                  : 'text-ink-600 hover:bg-ink-50 hover:text-ink-800'
              )}
              aria-current={active ? 'page' : undefined}
            >
              <Icon size={16} className="flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight size={13} className="opacity-40" />}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-ink-100">
        <div className="px-3 mb-3">
          <p className="text-xs font-medium text-ink-700 truncate">{user?.name ?? 'Admin'}</p>
          <p className="text-xs text-ink-400 truncate">{user?.email}</p>
        </div>
        <button
          onClick={() => logout()}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-ink-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
        >
          <LogOut size={15} /> Sign out
        </button>
      </div>
    </>
  )

  return (
    <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
      <div className="min-h-screen flex bg-ink-50 dark:bg-surface-bg">

        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-56 flex-shrink-0 bg-white dark:bg-surface-base border-r border-ink-100 dark:border-surface-raised flex-col">
          <SidebarContent />
        </aside>

        {/* Mobile sidebar overlay */}
        {sideOpen && (
          <div className="md:hidden fixed inset-0 z-40" onClick={() => setSideOpen(false)}>
            <div className="absolute inset-0 bg-black/40" />
            <aside className="absolute left-0 top-0 bottom-0 w-56 bg-white flex flex-col z-50" onClick={(e) => e.stopPropagation()}>
              <SidebarContent />
            </aside>
          </div>
        )}

        {/* Main */}
        <div className="flex-1 min-w-0 flex flex-col overflow-auto">
          {/* Mobile top bar */}
          <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-ink-100 sticky top-0 z-30">
            <button onClick={() => setSideOpen(true)} className="text-ink-600">
              <Menu size={20} />
            </button>
            <span className="flex-1 font-fraunces font-bold text-forest text-base">Admin Console</span>
            <NotificationBell />
          </div>
          {/* Desktop top bar */}
          <div className="hidden md:flex items-center justify-end px-6 py-3 bg-white border-b border-ink-100 sticky top-0 z-30">
            <NotificationBell />
          </div>

          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
