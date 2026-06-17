import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = { title: 'Cookie Policy — Lendora' }

export default function CookiesPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-surface-base pt-24 pb-20">
      <div className="container-page max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-ink-500 hover:text-copper mb-8 transition-colors"
        >
          <ArrowLeft size={15} />
          Back
        </Link>

        <h1 className="font-fraunces text-4xl font-bold text-ink-900 dark:text-ink-100 mb-2">
          Cookie Policy
        </h1>
        <p className="text-sm text-ink-400 mb-10">Last updated: June 2026</p>

        <div className="prose prose-sm max-w-none text-ink-700 dark:text-ink-300 space-y-8">

          <section>
            <h2 className="font-fraunces text-xl font-semibold text-ink-900 dark:text-ink-100 mb-3">1. What Are Cookies</h2>
            <p>Cookies are small text files stored on your device when you visit a website. They help the site remember your preferences and understand how you use it. Lendora uses cookies to keep you logged in, remember your settings, and improve performance.</p>
          </section>

          <section>
            <h2 className="font-fraunces text-xl font-semibold text-ink-900 dark:text-ink-100 mb-3">2. Cookies We Use</h2>

            <h3 className="font-semibold text-ink-800 dark:text-ink-200 mt-4 mb-2">Essential Cookies</h3>
            <p className="mb-2">These are required for the platform to function. You cannot opt out of these.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>auth_token</strong> — keeps you signed in across pages</li>
              <li><strong>session_id</strong> — maintains your active session</li>
              <li><strong>csrf_token</strong> — protects forms against cross-site request forgery</li>
            </ul>

            <h3 className="font-semibold text-ink-800 dark:text-ink-200 mt-4 mb-2">Preference Cookies</h3>
            <p className="mb-2">These remember your settings to improve your experience.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>theme</strong> — stores your light or dark mode preference</li>
              <li><strong>locale</strong> — remembers your language preference</li>
            </ul>

            <h3 className="font-semibold text-ink-800 dark:text-ink-200 mt-4 mb-2">Analytics Cookies</h3>
            <p className="mb-2">These help us understand how visitors use Lendora so we can improve it. No personally identifiable information is collected.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>_analytics_id</strong> — anonymously tracks pages visited and features used</li>
              <li><strong>_perf</strong> — measures page load times and errors</li>
            </ul>
          </section>

          <section>
            <h2 className="font-fraunces text-xl font-semibold text-ink-900 dark:text-ink-100 mb-3">3. Third-Party Cookies</h2>
            <p>Lendora does not currently use third-party advertising cookies. If you use bKash payment on our platform, bKash may set its own cookies subject to their privacy policy. We do not control or have access to those cookies.</p>
          </section>

          <section>
            <h2 className="font-fraunces text-xl font-semibold text-ink-900 dark:text-ink-100 mb-3">4. Cookie Duration</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Session cookies</strong> — deleted automatically when you close your browser</li>
              <li><strong>Persistent cookies</strong> — remain on your device for up to 30 days (auth) or 1 year (preferences) unless cleared manually</li>
            </ul>
          </section>

          <section>
            <h2 className="font-fraunces text-xl font-semibold text-ink-900 dark:text-ink-100 mb-3">5. Managing Cookies</h2>
            <p className="mb-3">You can control cookies through your browser settings. Most browsers allow you to view, block, or delete cookies. Note that blocking essential cookies will prevent you from logging in and using core features of Lendora.</p>
            <p>Common browser cookie settings:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Chrome:</strong> Settings → Privacy and Security → Cookies</li>
              <li><strong>Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data</li>
              <li><strong>Safari:</strong> Preferences → Privacy → Manage Website Data</li>
              <li><strong>Edge:</strong> Settings → Cookies and Site Permissions</li>
            </ul>
          </section>

          <section>
            <h2 className="font-fraunces text-xl font-semibold text-ink-900 dark:text-ink-100 mb-3">6. Changes to This Policy</h2>
            <p>We may update this cookie policy as we add new features. Any significant changes will be communicated to registered users. Continued use of Lendora after changes means you accept the updated policy.</p>
          </section>

          <section>
            <h2 className="font-fraunces text-xl font-semibold text-ink-900 dark:text-ink-100 mb-3">7. Contact</h2>
            <p>For questions about our use of cookies, contact us via the support chat on our homepage or at support@lendora.com.bd.</p>
          </section>

        </div>
      </div>
    </main>
  )
}
