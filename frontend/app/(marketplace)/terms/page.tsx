import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = { title: 'Terms of Service — Lendora' }

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p className="text-sm text-ink-400 mb-10">Last updated: June 2026</p>

        <div className="prose prose-sm max-w-none text-ink-700 dark:text-ink-300 space-y-8">

          <section>
            <h2 className="font-fraunces text-xl font-semibold text-ink-900 dark:text-ink-100 mb-3">1. Acceptance of Terms</h2>
            <p>By registering or using Lendora, you agree to these Terms of Service. If you do not agree, please do not use the platform. These terms apply to all users — renters, vendors, and visitors.</p>
          </section>

          <section>
            <h2 className="font-fraunces text-xl font-semibold text-ink-900 dark:text-ink-100 mb-3">2. The Platform</h2>
            <p>Lendora is a marketplace that connects renters with vendors across Bangladesh. We facilitate the connection and provide tools for booking, deposit management, and dispute resolution. Lendora is not the owner of any listed item and is not a party to the rental agreement between renter and vendor.</p>
          </section>

          <section>
            <h2 className="font-fraunces text-xl font-semibold text-ink-900 dark:text-ink-100 mb-3">3. Renter Responsibilities</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Use rented items only for their intended lawful purpose</li>
              <li>Return items on the agreed date and in the same condition as received</li>
              <li>Report any pre-existing damage to the vendor before using the item</li>
              <li>Pay the rental fee and deposit as agreed at the time of booking</li>
              <li>Not sub-rent or lend a rented item to any third party</li>
            </ul>
          </section>

          <section>
            <h2 className="font-fraunces text-xl font-semibold text-ink-900 dark:text-ink-100 mb-3">4. Vendor Responsibilities</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>List only items you own or have the legal right to rent out</li>
              <li>Provide accurate descriptions, photos, and pricing for all listings</li>
              <li>Confirm bookings within 24 hours and honour confirmed bookings</li>
              <li>Provide items in clean, working condition at the agreed handover time</li>
              <li>Return the deposit in full within the same day of item return, provided no damage occurred</li>
              <li>Not list prohibited items (see Section 8)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-fraunces text-xl font-semibold text-ink-900 dark:text-ink-100 mb-3">5. Deposits</h2>
            <p>A refundable security deposit is collected for every rental. The deposit amount is set by the vendor and displayed on the product listing. Deposits are refunded in full when the item is returned undamaged. If damage occurs, the vendor may claim a deduction. Disputed deductions are reviewed by Lendora's support team and resolved within 2–3 business days.</p>
          </section>

          <section>
            <h2 className="font-fraunces text-xl font-semibold text-ink-900 dark:text-ink-100 mb-3">6. Payments</h2>
            <p>Lendora currently accepts payment via bKash and cash on delivery / in-store pickup. By completing a payment you confirm the amount is correct. Lendora does not charge renters any platform or service fee at this time. A small platform commission is deducted from vendor earnings on completed rentals.</p>
          </section>

          <section>
            <h2 className="font-fraunces text-xl font-semibold text-ink-900 dark:text-ink-100 mb-3">7. Cancellations</h2>
            <p className="mb-2">Cancellation terms depend on who cancels:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Renter cancels before confirmation:</strong> full refund of any payment made</li>
              <li><strong>Renter cancels after vendor confirmation:</strong> subject to the vendor's cancellation policy shown on the listing</li>
              <li><strong>Vendor cancels after confirmation:</strong> renter receives a full refund; vendor's account is flagged</li>
            </ul>
          </section>

          <section>
            <h2 className="font-fraunces text-xl font-semibold text-ink-900 dark:text-ink-100 mb-3">8. Prohibited Items</h2>
            <p className="mb-2">The following may not be listed on Lendora:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Weapons, firearms, or explosive materials</li>
              <li>Illegal substances or drug paraphernalia</li>
              <li>Items that violate intellectual property rights</li>
              <li>Medical devices requiring prescription</li>
              <li>Any item whose rental is prohibited under Bangladesh law</li>
            </ul>
          </section>

          <section>
            <h2 className="font-fraunces text-xl font-semibold text-ink-900 dark:text-ink-100 mb-3">9. Limitation of Liability</h2>
            <p>Lendora acts as an intermediary only. We are not liable for damage to or loss of rented items, injuries arising from item use, or disputes between renters and vendors beyond the scope of our mediation process. Our maximum liability in any circumstance is limited to the platform commission collected on the relevant transaction.</p>
          </section>

          <section>
            <h2 className="font-fraunces text-xl font-semibold text-ink-900 dark:text-ink-100 mb-3">10. Account Termination</h2>
            <p>Lendora may suspend or permanently ban any account that violates these terms, engages in fraudulent behaviour, or receives repeated legitimate complaints. Users may also close their own account at any time via account settings.</p>
          </section>

          <section>
            <h2 className="font-fraunces text-xl font-semibold text-ink-900 dark:text-ink-100 mb-3">11. Governing Law</h2>
            <p>These terms are governed by the laws of the People's Republic of Bangladesh. Any disputes shall be subject to the jurisdiction of courts in Dhaka, Bangladesh.</p>
          </section>

          <section>
            <h2 className="font-fraunces text-xl font-semibold text-ink-900 dark:text-ink-100 mb-3">12. Contact</h2>
            <p>For questions about these terms, reach us via the support chat on our homepage or at support@lendora.com.bd.</p>
          </section>

        </div>
      </div>
    </main>
  )
}
