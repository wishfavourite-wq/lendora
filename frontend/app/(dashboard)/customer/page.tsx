'use client'
import Link           from 'next/link'
import Navbar         from '@/components/shared/Navbar'
import HeroSection    from '@/components/home/HeroSection'
import FeaturedRentals from '@/components/home/FeaturedRentals'
import Categories     from '@/components/home/Categories'
import HowItWorks     from '@/components/home/HowItWorks'
import Benefits       from '@/components/home/Benefits'
import TopSellers     from '@/components/home/TopSellers'
import FAQ            from '@/components/home/FAQ'
import Newsletter     from '@/components/home/Newsletter'
import Footer         from '@/components/home/Footer'
import { useMyRentals } from '@/lib/hooks/use-rentals'
import { useAuthStore } from '@/store/auth.store'
import { cn }          from '@/lib/utils'

function RentalStatsSection() {
  const user      = useAuthStore((s) => s.user)
  const { data: activeData }    = useMyRentals('ACTIVE,CONFIRMED,READY_FOR_PICKUP,RETURN_INITIATED')
  const { data: pendingData }   = useMyRentals('PENDING_CONFIRMATION')
  const { data: completedData } = useMyRentals('COMPLETED')
  const active    = activeData?.total    ?? 0
  const pending   = pendingData?.total   ?? 0
  const completed = completedData?.total ?? 0

  if (!user) return null

  const stats = [
    { label: 'Active rentals',    value: active,    dot: 'bg-forest',     href: '/rentals?status=ACTIVE'               },
    { label: 'Pending rentals',   value: pending,   dot: 'bg-amber-400',  href: '/rentals?status=PENDING_CONFIRMATION' },
    { label: 'Completed rentals', value: completed, dot: 'bg-ink-300',    href: '/rentals?status=COMPLETED'            },
  ]

  return (
    <section className="bg-ink-50 border-y border-ink-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-xs font-semibold text-ink-400 uppercase tracking-widest mb-5">
          Your rentals
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map(({ label, value, dot, href }) => (
            <Link key={label} href={href}
              className="bg-white rounded-2xl border border-ink-100 hover:border-copper/40 hover:shadow-sm transition px-5 py-5 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', dot)} />
                <span className="text-sm text-ink-500">{label}</span>
              </div>
              <span className="font-fraunces text-4xl font-bold text-ink-900">{value}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function CustomerDashboardPage() {
  return (
    <>
      <Navbar />
      <HeroSection />
      <RentalStatsSection />
      <FeaturedRentals />
      <Categories />
      <HowItWorks />
      <Benefits />
      <TopSellers />
      <FAQ />
      <Newsletter />
      <Footer />
    </>
  )
}
