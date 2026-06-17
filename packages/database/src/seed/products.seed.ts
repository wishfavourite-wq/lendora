import type { PrismaClient } from '@prisma/client'

interface ProductSeedInput {
  vendorId:         string
  categorySlug:     string
  name:             string
  description:      string
  pricePerDay:      number
  depositAmount:    number
  condition:        'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR'
  brand?:           string
  model?:           string
  district:         string
  division:         string
  deliveryAvailable: boolean
  deliveryFee?:     number
  tags:             string[]
  specifications?:  Record<string, string>
  averageRating:    number
  reviewCount:      number
  totalRentals:     number
  isInstantBooking: boolean
}

const PRODUCTS: ProductSeedInput[] = [
  // ── Photography ────────────────────────────────────────────────────────────
  {
    vendorId:         'VENDOR1',
    categorySlug:     'dslr-cameras',
    name:             'Canon EOS 5D Mark IV DSLR',
    description:      'Professional full-frame DSLR camera. Perfect for weddings, portraits, and commercial shoots. Includes 2 batteries, 2x 64GB CF cards, and camera bag.',
    pricePerDay:      1500,
    depositAmount:    15000,
    condition:        'LIKE_NEW',
    brand:            'Canon',
    model:            'EOS 5D Mark IV',
    district:         'Dhaka',
    division:         'Dhaka',
    deliveryAvailable: true,
    deliveryFee:      100,
    tags:             ['photography', 'dslr', 'fullframe', 'canon', 'wedding'],
    specifications:   {
      'Sensor':        '30.4MP Full-Frame CMOS',
      'ISO Range':     '100–32000',
      'Video':         '4K 30fps',
      'Included':      'Body + 24-105mm f/4L lens',
    },
    averageRating:    4.9,
    reviewCount:      34,
    totalRentals:     42,
    isInstantBooking: false,
  },
  {
    vendorId:         'VENDOR1',
    categorySlug:     'dslr-cameras',
    name:             'Sony A7 III Mirrorless Camera',
    description:      'Full-frame mirrorless with exceptional low-light performance. Ideal for events, documentary, and street photography. Includes FE 28-70mm kit lens.',
    pricePerDay:      1800,
    depositAmount:    18000,
    condition:        'LIKE_NEW',
    brand:            'Sony',
    model:            'Alpha A7 III',
    district:         'Dhaka',
    division:         'Dhaka',
    deliveryAvailable: true,
    deliveryFee:      100,
    tags:             ['photography', 'mirrorless', 'sony', 'lowlight', 'events'],
    specifications:   {
      'Sensor':        '24.2MP BSI Full-Frame',
      'ISO Range':     '100–51200',
      'Stabilization': '5-axis in-body',
      'Battery Life':  '710 shots',
    },
    averageRating:    4.8,
    reviewCount:      22,
    totalRentals:     31,
    isInstantBooking: true,
  },
  {
    vendorId:         'VENDOR1',
    categorySlug:     'drones',
    name:             'DJI Mavic 3 Pro Drone',
    description:      'Triple-camera professional drone with 4/3 Hasselblad sensor. Perfect for aerial photography, real estate, and events. Includes Fly More Combo (3 batteries).',
    pricePerDay:      3500,
    depositAmount:    35000,
    condition:        'LIKE_NEW',
    brand:            'DJI',
    model:            'Mavic 3 Pro',
    district:         'Dhaka',
    division:         'Dhaka',
    deliveryAvailable: true,
    deliveryFee:      150,
    tags:             ['drone', 'aerial', 'dji', '4k', 'real-estate'],
    specifications:   {
      'Camera':        '4/3 CMOS Hasselblad',
      'Max Flight':    '43 minutes',
      'Range':         '15 km',
      'Wind Resistance': 'Level 6',
    },
    averageRating:    4.9,
    reviewCount:      18,
    totalRentals:     24,
    isInstantBooking: false,
  },
  {
    vendorId:         'VENDOR1',
    categorySlug:     'lenses',
    name:             'Canon 70-200mm f/2.8L IS III USM',
    description:      'The legendary Canon L-series telephoto zoom. Razor-sharp from corner to corner, ideal for sports, wildlife, and events. EF mount.',
    pricePerDay:      800,
    depositAmount:    8000,
    condition:        'GOOD',
    brand:            'Canon',
    model:            '70-200mm f/2.8L IS III',
    district:         'Dhaka',
    division:         'Dhaka',
    deliveryAvailable: true,
    deliveryFee:      80,
    tags:             ['lens', 'telephoto', 'canon', 'sports', 'wildlife'],
    specifications:   {
      'Focal Length':  '70–200mm',
      'Aperture':      'f/2.8',
      'Stabilization': 'IS III (3 stops)',
      'Mount':         'Canon EF',
    },
    averageRating:    4.7,
    reviewCount:      29,
    totalRentals:     56,
    isInstantBooking: true,
  },

  // ── Event & Party ──────────────────────────────────────────────────────────
  {
    vendorId:         'VENDOR2',
    categorySlug:     'tents-canopies',
    name:             'Professional Shamiyana Tent 20×30 ft',
    description:      'Premium waterproof shamiyana tent with aluminum frame. Seats up to 100 guests. Perfect for weddings, gayes holud, and outdoor events. Setup team available.',
    pricePerDay:      4500,
    depositAmount:    10000,
    condition:        'GOOD',
    district:         'Dhaka',
    division:         'Dhaka',
    deliveryAvailable: true,
    deliveryFee:      500,
    tags:             ['tent', 'shamiyana', 'wedding', 'outdoor', 'event'],
    specifications:   {
      'Size':         '20 × 30 feet',
      'Capacity':     'Up to 100 guests',
      'Material':     'Waterproof PVC',
      'Setup':        'Included',
    },
    averageRating:    4.5,
    reviewCount:      41,
    totalRentals:     38,
    isInstantBooking: false,
  },
  {
    vendorId:         'VENDOR2',
    categorySlug:     'sound-systems',
    name:             'JBL Professional PA System 2000W',
    description:      'Full PA system with 2x JBL 15" main speakers, 1x 18" subwoofer, 8-channel mixer, and wireless mics. Covers events up to 500 people.',
    pricePerDay:      3000,
    depositAmount:    20000,
    condition:        'GOOD',
    brand:            'JBL',
    district:         'Dhaka',
    division:         'Dhaka',
    deliveryAvailable: true,
    deliveryFee:      400,
    tags:             ['sound-system', 'pa', 'jbl', 'event', 'concert'],
    specifications:   {
      'Total Power':  '2000W RMS',
      'Coverage':     'Up to 500 people',
      'Includes':     '2x Main + 1x Sub + Mixer + 2x Wireless Mic',
      'Setup':        'Operator available (extra cost)',
    },
    averageRating:    4.6,
    reviewCount:      27,
    totalRentals:     33,
    isInstantBooking: false,
  },
  {
    vendorId:         'VENDOR2',
    categorySlug:     'lighting',
    name:             'LED Dance Floor & Stage Lighting Kit',
    description:      'Complete stage lighting package: 8x moving heads, LED wash bars, fog machine, and lighting controller. Transform any venue into a professional stage.',
    pricePerDay:      2500,
    depositAmount:    15000,
    condition:        'GOOD',
    district:         'Dhaka',
    division:         'Dhaka',
    deliveryAvailable: true,
    deliveryFee:      300,
    tags:             ['lighting', 'led', 'stage', 'event', 'wedding'],
    specifications:   {
      'Moving Heads': '8x 60W RGBW',
      'Wash Bars':    '4x LED',
      'Fog Machine':  'Included',
      'Controller':   'DMX 512',
    },
    averageRating:    4.7,
    reviewCount:      19,
    totalRentals:     28,
    isInstantBooking: false,
  },

  // ── Electronics ────────────────────────────────────────────────────────────
  {
    vendorId:         'VENDOR1',
    categorySlug:     'projectors',
    name:             'Epson EB-L200F Full HD Laser Projector',
    description:      'Bright laser projector for conferences, presentations, and outdoor screenings. 4500 lumen, no lamp replacement needed. Includes 3m HDMI cable and portable screen.',
    pricePerDay:      2000,
    depositAmount:    20000,
    condition:        'LIKE_NEW',
    brand:            'Epson',
    model:            'EB-L200F',
    district:         'Dhaka',
    division:         'Dhaka',
    deliveryAvailable: true,
    deliveryFee:      150,
    tags:             ['projector', 'presentation', 'conference', 'outdoor', 'laser'],
    specifications:   {
      'Brightness':   '4500 lm',
      'Resolution':   '1920×1080 Full HD',
      'Light Source': 'Laser (20,000h)',
      'Connectivity': 'HDMI, VGA, USB, LAN',
    },
    averageRating:    4.6,
    reviewCount:      15,
    totalRentals:     22,
    isInstantBooking: true,
  },
]

function slugify(text: string, suffix: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + suffix
}

export async function seedProducts(
  db:     PrismaClient,
  ids:    { vendorProfile1Id: string; vendorProfile2Id: string },
): Promise<void> {
  console.log('  Seeding products...')

  const categoryMap = new Map<string, string>()
  const categories = await db.category.findMany({ select: { id: true, slug: true } })
  categories.forEach((c) => categoryMap.set(c.slug, c.id))

  let created = 0

  for (const p of PRODUCTS) {
    const vendorId   = p.vendorId === 'VENDOR1' ? ids.vendorProfile1Id : ids.vendorProfile2Id
    const categoryId = categoryMap.get(p.categorySlug)
    if (!categoryId) {
      console.warn(`    Category not found: ${p.categorySlug}`)
      continue
    }

    const slug = slugify(p.name, vendorId.slice(-6))

    const existing = await db.product.findFirst({ where: { slug } })
    if (existing) continue

    const product = await db.product.create({
      data: {
        vendorId,
        categoryId,
        name:              p.name,
        slug,
        description:       p.description,
        pricePerDay:       p.pricePerDay,
        depositAmount:     p.depositAmount,
        condition:         p.condition,
        status:            'ACTIVE',
        brand:             p.brand,
        model:             p.model,
        district:          p.district,
        division:          p.division,
        deliveryAvailable: p.deliveryAvailable,
        deliveryFee:       p.deliveryFee,
        tags:              p.tags,
        specifications:    p.specifications,
        averageRating:     p.averageRating,
        reviewCount:       p.reviewCount,
        totalRentals:      p.totalRentals,
        isInstantBooking:  p.isInstantBooking,
        minRentalDays:     1,
      },
    })

    // Primary media placeholder (real uploads come via the API)
    await db.productMedia.create({
      data: {
        productId: product.id,
        url:       `https://placehold.co/800x600/C87941/FFFFFF?text=${encodeURIComponent(p.name.slice(0, 20))}`,
        altText:   p.name,
        sortOrder: 0,
        isPrimary: true,
      },
    })

    created++
  }

  console.log(`  ✓ ${created} products seeded`)
}
