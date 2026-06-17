import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = { title: 'Privacy Policy — Lendora' }

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p className="text-sm text-ink-400 mb-10">Last updated: June 2026</p>

        <div className="prose prose-sm max-w-none text-ink-700 dark:text-ink-300 space-y-8">

          <section>
            <h2 className="font-fraunces text-xl font-semibold text-ink-900 dark:text-ink-100 mb-3">1. Who We Are</h2>
            <p>Lendora is a multi-vendor rental marketplace operating in Bangladesh. We connect renters with verified local vendors so people can rent what they need without buying.</p>
          </section>

          <section>
            <h2 className="font-fraunces text-xl font-semibold text-ink-900 dark:text-ink-100 mb-3">2. Information We Collect</h2>
            <p className="mb-2">We collect information you provide directly:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Name, email address, and phone number when you register</li>
              <li>Delivery address and district when placing a rental order</li>
              <li>bKash transaction references when you make a payment</li>
              <li>Photos or descriptions you upload when listing a product</li>
            </ul>
            <p className="mt-3">We also collect usage data automatically — pages visited, search queries, device type, and browser — to improve the platform.</p>
          </section>

          <section>
            <h2 className="font-fraunces text-xl font-semibold text-ink-900 dark:text-ink-100 mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To process rental bookings and coordinate between renters and vendors</li>
              <li>To verify vendor identities and maintain platform trust</li>
              <li>To manage deposit payments and refunds</li>
              <li>To send booking confirmations and important account notifications</li>
              <li>To resolve disputes between renters and vendors</li>
              <li>To improve and develop Lendora features based on usage patterns</li>
            </ul>
          </section>

          <section>
            <h2 className="font-fraunces text-xl font-semibold text-ink-900 dark:text-ink-100 mb-3">4. Payment Information</h2>
            <p>Lendora currently supports bKash payments and cash on delivery / in-store pickup. We do not store your full bKash PIN or any card details. Payment confirmations are referenced by transaction ID only. All financial transactions are subject to bKash's own privacy and security terms.</p>
          </section>

          <section>
            <h2 className="font-fraunces text-xl font-semibold text-ink-900 dark:text-ink-100 mb-3">5. Sharing of Information</h2>
            <p className="mb-2">We do not sell your personal data. We share it only as necessary:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>With the vendor you book from (name, phone, delivery area)</li>
              <li>With the renter who books your item (name, contact details)</li>
              <li>With our support team to resolve disputes</li>
              <li>With third-party service providers who help operate the platform (hosting, email delivery) under strict data processing agreements</li>
              <li>When required by law or regulatory authorities in Bangladesh</li>
            </ul>
          </section>

          <section>
            <h2 className="font-fraunces text-xl font-semibold text-ink-900 dark:text-ink-100 mb-3">6. Data Retention</h2>
            <p>We retain your account data for as long as your account is active. After account deletion, we keep transaction records for up to 3 years for legal and dispute-resolution purposes. You may request deletion of non-essential data at any time by contacting our support team.</p>
          </section>

          <section>
            <h2 className="font-fraunces text-xl font-semibold text-ink-900 dark:text-ink-100 mb-3">7. Your Rights</h2>
            <p className="mb-2">You have the right to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Access the personal data we hold about you</li>
              <li>Correct inaccurate information in your profile</li>
              <li>Request deletion of your account and associated data</li>
              <li>Withdraw consent for marketing communications at any time</li>
            </ul>
            <p className="mt-3">To exercise any of these rights, contact us through the support chat on our homepage.</p>
          </section>

          <section>
            <h2 className="font-fraunces text-xl font-semibold text-ink-900 dark:text-ink-100 mb-3">8. Changes to This Policy</h2>
            <p>We may update this policy as the platform grows. Significant changes will be notified to registered users by email. Continued use of Lendora after changes constitutes acceptance of the updated policy.</p>
          </section>

          <section>
            <h2 className="font-fraunces text-xl font-semibold text-ink-900 dark:text-ink-100 mb-3">9. Contact</h2>
            <p>For any privacy-related questions, reach us via the support chat on our homepage or email us at support@lendora.com.bd.</p>
          </section>

        </div>
      </div>
    </main>
  )
}
