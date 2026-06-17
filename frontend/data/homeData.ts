export interface Product {
  id:              number
  name:            string
  category:        string
  pricePerDay:     number
  deposit:         number
  rating:          number
  reviews:         number
  location:        string
  vendor:          string
  vendorVerified:  boolean
  badge:           string | null
  emoji:           string
  image:           string
}

const DRILL_IMG    = 'http://localhost:4000/uploads/products/drill.jpg'
const STROLLER_IMG = 'http://localhost:4000/uploads/products/stroller.png'

export const FEATURED_PRODUCTS: Product[] = [
  {
    id: 1, name: 'Bosch 18V Cordless Drill Pro', category: 'Power Tools',
    pricePerDay: 380, deposit: 1500, rating: 4.8, reviews: 42,
    location: 'Mirpur, Dhaka', vendor: 'ToolRent BD', vendorVerified: true,
    badge: 'Top Pick', emoji: '🔧',
    image: DRILL_IMG,
  },
  {
    id: 2, name: 'Stroller', category: 'Baby Products',
    pricePerDay: 280, deposit: 1200, rating: 4.9, reviews: 88,
    location: 'Banani, Dhaka', vendor: 'BabyRent BD', vendorVerified: true,
    badge: 'Most Loved', emoji: '🍼',
    image: STROLLER_IMG,
  },
]

export const CATEGORIES = [
  { id: 1, name: 'Power Tools',        emoji: '🔧', count: 203, color: 'from-orange-100 to-orange-50 dark:from-surface-raised dark:to-surface-base', textColor: 'text-orange-700 dark:text-orange-300' },
  { id: 2, name: 'Event Equipment',    emoji: '🎪', count: 318, color: 'from-purple-100 to-purple-50 dark:from-surface-raised dark:to-surface-base', textColor: 'text-purple-700 dark:text-purple-300' },
  { id: 3, name: 'Baby Products',      emoji: '🍼', count: 154, color: 'from-pink-100  to-pink-50   dark:from-surface-raised dark:to-surface-base', textColor: 'text-pink-700   dark:text-pink-300'   },
  { id: 4, name: 'Camping & Travel',   emoji: '🏕️', count: 127, color: 'from-green-100 to-green-50  dark:from-surface-raised dark:to-surface-base', textColor: 'text-green-700  dark:text-green-300'  },
]

export const HOW_IT_WORKS = [
  { step: 1, title: 'Browse',  desc: 'Search items across Dhaka. Filter by category, price, and location.', emoji: '🔍' },
  { step: 2, title: 'Book',    desc: 'Select your dates, pay securely via bKash. Vendor confirms within 24 hours.', emoji: '📅' },
  { step: 3, title: 'Receive', desc: 'Get it delivered to your door or pick it up from the vendor. Use it for as long as you need.', emoji: '📦' },
  { step: 4, title: 'Return',  desc: 'Hand it back, get your deposit refunded the same day. Review the vendor and item.', emoji: '🔄' },
]

export const TOP_SELLERS = [
  {
    id: 1, name: 'ProLens BD', avatar: '📸',
    tagline: 'Professional camera gear for creators',
    district: 'Gulshan, Dhaka', rating: 4.9, reviews: 127, items: 34,
    topItems: ['📷 Sony A7 IV', '📷 Canon 90D', '🔭 Sigma Lens'],
    verified: true, badge: 'Top Vendor', responseTime: '< 1 hr',
  },
  {
    id: 2, name: 'DressCircle', avatar: '👗',
    tagline: 'Premium fashion for every occasion',
    district: 'Mirpur, Dhaka', rating: 4.8, reviews: 204, items: 89,
    topItems: ['👗 Sarees', '👰 Lehenga', '🤵 Sherwani'],
    verified: true, badge: 'Most Reviewed', responseTime: '< 2 hrs',
  },
  {
    id: 3, name: 'TechRent', avatar: '💻',
    tagline: 'Latest tech, short-term & long-term',
    district: 'Mohakhali, Dhaka', rating: 4.7, reviews: 88, items: 22,
    topItems: ['💻 MacBook Pro', '📱 iPad Pro', '🖥 Monitor'],
    verified: true, badge: null, responseTime: '< 3 hrs',
  },
  {
    id: 4, name: 'SkyGear BD', avatar: '🚁',
    tagline: 'Drones & aerial photography kits',
    district: 'Banani, Dhaka', rating: 4.8, reviews: 61, items: 14,
    topItems: ['🚁 DJI Mini 4', '📡 DJI Avata', '🔋 Batteries'],
    verified: true, badge: null, responseTime: '< 2 hrs',
  },
]

export const TESTIMONIALS = [
  {
    id: 1, name: 'Rakib Hassan', role: 'Home Renovator', district: 'Dhaka',
    rating: 5, avatar: 'R', verified: true, daysAgo: 12,
    quote: 'Rented a Bosch cordless drill for my apartment renovation. Saved me ৳8,000 vs buying. Drill was in perfect condition and deposit was returned same day.',
    item: 'Bosch Cordless Drill Set',
  },
  {
    id: 2, name: 'Nusrat Jahan', role: 'Event Organiser', district: 'Chittagong',
    rating: 5, avatar: 'N', verified: true, daysAgo: 5,
    quote: 'Rented the party tent and PA sound system together for my sister\'s wedding. Vendor delivered and set up everything on time. Excellent service!',
    item: 'Party Tent 20×30 ft',
  },
  {
    id: 3, name: 'Tanvir Ahmed', role: 'New Parent', district: 'Sylhet',
    rating: 5, avatar: 'T', verified: true, daysAgo: 23,
    quote: 'Rented a baby stroller for 2 months while visiting family. The transparent deposit system gave me full confidence my money would be safe. Got it back same day.',
    item: 'Baby Stroller — Lightweight',
  },
  {
    id: 4, name: 'Fatema Khatun', role: 'Travel Enthusiast', district: 'Dhaka',
    rating: 5, avatar: 'F', verified: true, daysAgo: 3,
    quote: 'Rented a 4-person camping tent for our Cox\'s Bazar trip. Gear was clean, packed well, and the vendor was super responsive. Already booked again!',
    item: 'Camping Tent — 4 Person',
  },
]

export const FAQ_ITEMS = [
  {
    question: 'How does the deposit system work?',
    answer: 'When you book an item, a refundable security deposit is collected along with the rental fee. The deposit is held until the item is returned in good condition. Once the vendor confirms the return, your deposit is refunded in full — usually within the same day.',
  },
  {
    question: 'What if the item is damaged during rental?',
    answer: 'If an item is damaged, the vendor will assess the damage and may deduct a repair cost from your deposit. Both renter and vendor can submit photos as evidence. Our support team steps in to resolve any disagreement fairly, usually within 2–3 business days.',
  },
  {
    question: 'Which payment methods are accepted?',
    answer: 'We currently accept bKash (send money to vendor\'s bKash number before pickup) and cash on delivery / in-store pickup (pay when you collect the item in person). More payment options will be added as we grow.',
  },
  {
    question: 'How do I become a vendor and list my items?',
    answer: 'Register as a vendor, fill in your business details, and submit for quick verification. Once approved, you can start listing your items immediately. There are no listing fees — Lendora only takes a small platform fee when a rental is completed.',
  },
  {
    question: 'Is my item insured while rented out?',
    answer: 'At this stage we are a new platform and do not yet offer a formal insurance plan. The security deposit collected from renters provides a financial buffer for damage. We strongly recommend vendors photograph their items before and after each rental as evidence.',
  },
  {
    question: 'What happens if a vendor cancels my booking?',
    answer: 'If a vendor cancels after confirmation, you will receive a full refund of both the rental fee and deposit. Repeated cancellations by a vendor are flagged by our team and may result in account suspension.',
  },
  {
    question: 'Can I extend my rental period?',
    answer: 'Yes — contact the vendor directly through our platform to request extra days. If the item is available, you can extend and pay the additional rental fee via bKash or cash at the agreed time.',
  },
  {
    question: 'What areas does Lendora currently cover?',
    answer: 'We are currently serving Dhaka and surrounding areas. We are a new and growing platform — more districts and divisions across Bangladesh will be added very soon. Vendors and renters from all areas are welcome to register.',
  },
]

export const HERO_STATS = [
  { value: '1,200+', label: 'Items available' },
  { value: '318',    label: 'Verified vendors' },
  { value: '42+',    label: 'Cities covered'   },
  { value: '৳4.2M+', label: 'Saved by renters' },
]

export const QUICK_CATEGORIES = [
  { label: 'Cameras',     emoji: '📷' },
  { label: 'Electronics', emoji: '💻' },
  { label: 'Fashion',     emoji: '👗' },
  { label: 'Tools',       emoji: '🔧' },
  { label: 'Outdoor',     emoji: '⛺' },
  { label: 'Instruments', emoji: '🎸' },
]
