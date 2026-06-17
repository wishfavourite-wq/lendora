import type { Metadata } from 'next'
import Navbar          from '@/components/shared/Navbar'
import HeroSection     from '@/components/home/HeroSection'
import FeaturedRentals from '@/components/home/FeaturedRentals'
import Categories      from '@/components/home/Categories'
import HowItWorks      from '@/components/home/HowItWorks'
import Benefits        from '@/components/home/Benefits'
import TopSellers      from '@/components/home/TopSellers'
import FAQ             from '@/components/home/FAQ'
import Newsletter      from '@/components/home/Newsletter'
import Footer          from '@/components/home/Footer'

export const metadata: Metadata = {
  title:       'Lendora',
  description: 'Browse 1,200+ rental items from verified vendors across Dhaka, Chittagong & Sylhet. Cameras, fashion, tools, electronics and more.',
}

export default function HomePage() {
  return (
    <>
      <Navbar />
      <HeroSection />
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
