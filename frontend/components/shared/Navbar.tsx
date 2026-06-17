'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, ChevronRight, Mail, ChevronDown, LayoutDashboard, FileText, Settings, LogOut } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ContactModal from '@/components/ui/ContactModal'
import NotificationBell from '@/components/shared/NotificationBell'
import { useAuthStore } from '@/store/auth.store'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { href: '/products',      label: 'Browse Items' },
  { href: '/#how-it-works', label: 'How It Works' },
  { href: '/register?role=VENDOR', label: 'Become a Vendor' },
]

export default function Navbar() {
  const [scrolled,      setScrolled]      = useState(false)
  const [mobileOpen,    setMobileOpen]    = useState(false)
  const [contactOpen,   setContactOpen]   = useState(false)
  const [dropOpen,      setDropOpen]      = useState(false)
  const menuRef    = useRef(null as HTMLDivElement | null)
  const menuBtnRef = useRef(null as HTMLButtonElement | null)
  const dropRef    = useRef<HTMLDivElement>(null)
  const router     = useRouter()
  const user       = useAuthStore((s) => s.user)
  const logout     = useAuthStore((s) => s.logout)

  const isCustomer = user?.role === 'CUSTOMER'
  const initials   = user?.name
    ? user.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  const handleLogout = async () => {
    setDropOpen(false)
    await logout()
    router.push('/login')
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* Close on ESC, focus-trap inside mobile menu */
  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileOpen(false)
        menuBtnRef.current?.focus()
        return
      }
      if (e.key !== 'Tab') return
      const focusable = menuRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])'
      )
      if (!focusable?.length) return
      const first = focusable[0]
      const last  = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [mobileOpen])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 dark:bg-surface-bg/90 backdrop-blur-xl border-b border-ink-100 dark:border-surface-raised shadow-warm-sm'
          : 'bg-transparent'
      }`}
      role="banner"
    >
      <a href="#main-content" className="skip-link">Skip to content</a>

      <nav
        className="container-page flex items-center justify-between h-16 md:h-[70px]"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2
                     focus-visible:ring-copper rounded-lg p-1 -m-1"
          aria-label="Lendora BD — home"
        >
          <span className="font-fraunces text-2xl font-bold tracking-tight text-ink-900 dark:text-ink-50">
            Lendora
          </span>
          <span
            className="text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-copper/15 text-copper select-none"
            aria-hidden="true"
          >
            BD
          </span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-1" role="list">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="px-4 py-2 rounded-full text-sm font-medium text-ink-600 dark:text-ink-400
                           hover:text-ink-900 dark:hover:text-ink-100 hover:bg-ink-100 dark:hover:bg-surface-raised
                           transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper"
              >
                {link.label}
              </Link>
            </li>
          ))}
          {isCustomer && (
            <li>
              <Link
                href="/rentals"
                className="px-4 py-2 rounded-full text-sm font-medium text-ink-600 dark:text-ink-400
                           hover:text-ink-900 dark:hover:text-ink-100 hover:bg-ink-100 dark:hover:bg-surface-raised
                           transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper"
              >
                My Rentals
              </Link>
            </li>
          )}
          <li>
            <button
              onClick={() => setContactOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium
                         text-ink-600 dark:text-ink-400
                         hover:text-ink-900 dark:hover:text-ink-100 hover:bg-ink-100 dark:hover:bg-surface-raised
                         transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper"
            >
              <Mail size={14} aria-hidden="true" />
              Contact
            </button>
          </li>
        </ul>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {isCustomer && <div className="hidden md:block"><NotificationBell /></div>}
          {isCustomer ? (
            <div className="relative hidden md:block" ref={dropRef}>
              <button
                onClick={() => setDropOpen((p) => !p)}
                className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-lg hover:bg-ink-100 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper"
                aria-label="Account menu"
                aria-expanded={dropOpen}
              >
                <span className="w-7 h-7 rounded-full bg-copper/15 text-copper text-xs font-bold flex items-center justify-center select-none">
                  {initials}
                </span>
                <span className="text-sm font-medium text-ink-700 max-w-[120px] truncate">{user?.name}</span>
                <ChevronDown size={14} className={cn('text-ink-400 transition-transform', dropOpen && 'rotate-180')} />
              </button>
              {dropOpen && (
                <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-xl border border-ink-100 shadow-lg py-1 z-50">
                  <div className="px-3 py-2 border-b border-ink-100">
                    <p className="text-xs font-medium text-ink-900 truncate">{user?.name}</p>
                    <p className="text-xs text-ink-400 truncate">{user?.email}</p>
                  </div>
                  <Link href="/customer" onClick={() => setDropOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-ink-700 hover:bg-ink-50 transition">
                    <LayoutDashboard size={14} className="text-ink-400" /> Dashboard
                  </Link>
                  <Link href="/rentals" onClick={() => setDropOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-ink-700 hover:bg-ink-50 transition">
                    <FileText size={14} className="text-ink-400" /> My Rentals
                  </Link>
                  <Link href="/customer/settings" onClick={() => setDropOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-ink-700 hover:bg-ink-50 transition">
                    <Settings size={14} className="text-ink-400" /> Account settings
                  </Link>
                  <button onClick={handleLogout}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition w-full text-left">
                    <LogOut size={14} /> Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login"    className="hidden md:flex btn-ghost  text-sm px-4 py-2 min-h-0 h-9">Log in</Link>
              <Link href="/register?role=RENTER" className="hidden md:flex btn-primary text-sm px-5 py-2 min-h-0 h-9">Start renting</Link>
            </>
          )}

          <button
            ref={menuBtnRef}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-full
                       text-ink-700 dark:text-ink-300
                       hover:bg-ink-100 dark:hover:bg-surface-raised transition-colors focus-ring-full"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 top-16 bg-ink-900/40 backdrop-blur-sm md:hidden"
              aria-hidden="true"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              ref={menuRef}
              id="mobile-nav"
              role="dialog"
              aria-label="Navigation menu"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="md:hidden absolute inset-x-0 top-full bg-white dark:bg-surface-base
                         border-t border-ink-100 dark:border-surface-raised
                         shadow-warm-xl px-4 py-4 space-y-1"
            >
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between px-4 py-3 rounded-2xl text-base font-medium
                             text-ink-700 dark:text-ink-300
                             hover:bg-ink-50 dark:hover:bg-surface-raised
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper
                             transition-colors"
                >
                  {link.label}
                  <ChevronRight size={16} className="text-ink-300 dark:text-ink-600" aria-hidden="true" />
                </Link>
              ))}
              <button
                onClick={() => { setMobileOpen(false); setContactOpen(true) }}
                className="flex items-center justify-between px-4 py-3 rounded-2xl text-base font-medium
                           text-ink-700 dark:text-ink-300
                           hover:bg-ink-50 dark:hover:bg-surface-raised
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper
                           transition-colors w-full"
              >
                <span className="flex items-center gap-2">
                  <Mail size={16} aria-hidden="true" />
                  Contact
                </span>
                <ChevronRight size={16} className="text-ink-300 dark:text-ink-600" aria-hidden="true" />
              </button>
              <div className="pt-3 border-t border-ink-100 dark:border-surface-raised flex flex-col gap-2">
                {isCustomer ? (
                  <>
                    <div className="flex items-center gap-3 px-4 py-2">
                      <span className="w-8 h-8 rounded-full bg-copper/15 text-copper text-xs font-bold flex items-center justify-center select-none">{initials}</span>
                      <div>
                        <p className="text-sm font-medium text-ink-800">{user?.name}</p>
                        <p className="text-xs text-ink-400">{user?.email}</p>
                      </div>
                    </div>
                    <Link href="/customer" onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 rounded-2xl text-base font-medium text-ink-700 hover:bg-ink-50 transition">
                      <LayoutDashboard size={16} /> Dashboard
                    </Link>
                    <Link href="/rentals" onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 rounded-2xl text-base font-medium text-ink-700 hover:bg-ink-50 transition">
                      <FileText size={16} /> My Rentals
                    </Link>
                    <Link href="/customer/settings" onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 rounded-2xl text-base font-medium text-ink-700 hover:bg-ink-50 transition">
                      <Settings size={16} /> Account settings
                    </Link>
                    <button onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-3 rounded-2xl text-base font-medium text-red-600 hover:bg-red-50 transition w-full text-left">
                      <LogOut size={16} /> Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/register?role=RENTER" onClick={() => setMobileOpen(false)} className="btn-primary w-full justify-center">
                      Start renting — it&apos;s free
                    </Link>
                    <Link href="/login" onClick={() => setMobileOpen(false)} className="btn-ghost w-full justify-center">
                      Log in
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </header>
  )
}
