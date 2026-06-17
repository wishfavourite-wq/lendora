'use client'

import { useState, useRef, useEffect } from 'react'
import Link                             from 'next/link'
import { usePathname, useRouter }       from 'next/navigation'
import {
  LayoutDashboard, Package, FileText, Wallet,
  LogOut, ChevronDown, Menu, X, PlusCircle, User,
} from 'lucide-react'
import { useAuthStore }   from '@/store/auth.store'
import NotificationBell  from '@/components/shared/NotificationBell'
import { cn }            from '@/lib/utils'

const NAV = [
  { href: '/vendor',          label: 'Overview',  icon: LayoutDashboard },
  { href: '/vendor/products', label: 'Listings',  icon: Package          },
  { href: '/rentals',         label: 'Rentals',   icon: FileText         },
  { href: '/vendor/payouts',  label: 'Payouts',   icon: Wallet           },
]

export default function VendorNavbar() {
  const pathname    = usePathname()
  const router      = useRouter()
  const user        = useAuthStore((s) => s.user)
  const logout      = useAuthStore((s) => s.logout)
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [dropOpen,    setDropOpen]    = useState(false)
  const [scrolled,    setScrolled]    = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : 'V'

  const isActive = (href: string) =>
    href === '/vendor' ? pathname === '/vendor' : pathname.startsWith(href)

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-all duration-200',
        scrolled
          ? 'bg-white/95 backdrop-blur-xl border-b border-ink-100 shadow-sm'
          : 'bg-white border-b border-ink-100',
      )}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">

          {/* Logo → vendor dashboard */}
          <Link
            href="/vendor"
            className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper rounded-lg"
          >
            <span className="font-fraunces text-xl font-bold tracking-tight text-ink-900">
              Lendora
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-copper/15 text-copper select-none">
              Seller
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5" aria-label="Vendor navigation">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive(href)
                    ? 'bg-copper/10 text-copper'
                    : 'text-ink-500 hover:text-ink-900 hover:bg-ink-50',
                )}
              >
                <Icon size={15} />
                {label}
              </Link>
            ))}
          </nav>

          {/* Right: new listing + user menu */}
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Link
              href="/vendor/products/new"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-copper text-white text-sm font-medium rounded-lg hover:bg-copper/90 transition"
            >
              <PlusCircle size={14} />
              New listing
            </Link>

            {/* User dropdown */}
            <div className="relative" ref={dropRef}>
              <button
                onClick={() => setDropOpen((p) => !p)}
                className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-lg hover:bg-ink-50 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper"
                aria-label="Account menu"
                aria-expanded={dropOpen}
              >
                <span className="w-7 h-7 rounded-full bg-copper/15 text-copper text-xs font-bold flex items-center justify-center select-none">
                  {initials}
                </span>
                <span className="hidden sm:block text-sm font-medium text-ink-700 max-w-[120px] truncate">
                  {user?.name ?? 'Vendor'}
                </span>
                <ChevronDown size={14} className={cn('text-ink-400 transition-transform', dropOpen && 'rotate-180')} />
              </button>

              {dropOpen && (
                <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-xl border border-ink-100 shadow-lg py-1 z-50">
                  <div className="px-3 py-2 border-b border-ink-100">
                    <p className="text-xs font-medium text-ink-900 truncate">{user?.name}</p>
                    <p className="text-xs text-ink-400 truncate">{user?.email}</p>
                  </div>
                  <Link
                    href="/vendor/settings"
                    onClick={() => setDropOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-ink-700 hover:bg-ink-50 transition"
                  >
                    <User size={14} className="text-ink-400" />
                    Account settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition w-full text-left"
                  >
                    <LogOut size={14} />
                    Sign out
                  </button>
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-ink-600 hover:bg-ink-100 transition"
              onClick={() => setMobileOpen((p) => !p)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-ink-100 bg-white px-4 py-3 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                isActive(href)
                  ? 'bg-copper/10 text-copper'
                  : 'text-ink-600 hover:bg-ink-50',
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
          <div className="pt-2 border-t border-ink-100">
            <Link
              href="/vendor/products/new"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-copper hover:bg-copper/5 rounded-xl transition"
            >
              <PlusCircle size={16} />
              New listing
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition w-full text-left"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
