import Link from 'next/link'

export default function Footer() {
  return (
    <footer
      className="bg-ink-900 dark:bg-surface-base border-t border-ink-800 dark:border-surface-raised
                 text-ink-400"
      role="contentinfo"
    >
      {/* Bottom bar */}
      <div className="border-t border-white/5">
        <div className="container-page py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-ink-600">
            © {new Date().getFullYear()} Lendora. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="text-xs text-ink-600 hover:text-ink-400 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-xs text-ink-600 hover:text-ink-400 transition-colors">
              Terms of Service
            </Link>
            <Link href="/cookies" className="text-xs text-ink-600 hover:text-ink-400 transition-colors">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
