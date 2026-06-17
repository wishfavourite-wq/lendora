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

  // ── Power Tools ────────────────────────────────────────────────────────────
  {
    vendorId:         'VENDOR2',
    categorySlug:     'power-tools',
    name:             'Bosch 18V Cordless Drill Pro',
    description:      'Professional cordless drill with 2 batteries and charger. Perfect for home renovation, carpentry, and construction work. Includes 25-piece drill bit set.',
    pricePerDay:      400,
    depositAmount:    3000,
    condition:        'GOOD',
    brand:            'Bosch',
    model:            'GSB 18V-55',
    district:         'Dhaka',
    division:         'Dhaka',
    deliveryAvailable: true,
    deliveryFee:      80,
    tags:             ['drill', 'power-tool', 'bosch', 'cordless', 'construction'],
    specifications:   {
      'Voltage':    '18V',
      'Max Torque': '55 Nm',
      'Chuck':      '13mm Keyless',
      'Includes':   '2x Battery + Charger + 25pc Bit Set',
    },
    averageRating:    4.8,
    reviewCount:      42,
    totalRentals:     67,
    isInstantBooking: true,
  },
  {
    vendorId:         'VENDOR2',
    categorySlug:     'power-tools',
    name:             'DeWalt Circular Saw 7-1/4 inch',
    description:      'Heavy-duty circular saw for cutting wood, plywood, and boards. Ideal for construction and renovation projects. Includes blade guard and rip fence.',
    pricePerDay:      350,
    depositAmount:    4000,
    condition:        'GOOD',
    brand:            'DeWalt',
    model:            'DWE575',
    district:         'Dhaka',
    division:         'Dhaka',
    deliveryAvailable: true,
    deliveryFee:      80,
    tags:             ['saw', 'circular-saw', 'dewalt', 'woodworking', 'construction'],
    specifications:   {
      'Blade Size':  '7-1/4 inch',
      'Power':       '1600W',
      'Bevel':       '0–57°',
      'Blade Speed': '5200 RPM',
    },
    averageRating:    4.6,
    reviewCount:      28,
    totalRentals:     39,
    isInstantBooking: false,
  },

  // ── Event Equipment ────────────────────────────────────────────────────────
  {
    vendorId:         'VENDOR2',
    categorySlug:     'event-equipment',
    name:             'Folding Tables & Chairs Set (50 Guests)',
    description:      'Complete furniture set for 50 guests. Includes 10 folding tables (6ft) and 50 plastic chairs. Perfect for weddings, seminars, and corporate events.',
    pricePerDay:      2500,
    depositAmount:    5000,
    condition:        'GOOD',
    district:         'Dhaka',
    division:         'Dhaka',
    deliveryAvailable: true,
    deliveryFee:      600,
    tags:             ['tables', 'chairs', 'furniture', 'event', 'wedding', 'seminar'],
    specifications:   {
      'Tables':    '10x Folding Tables (6ft)',
      'Chairs':    '50x Plastic Chairs',
      'Capacity':  '50 Guests',
      'Delivery':  'Setup & takedown included',
    },
    averageRating:    4.5,
    reviewCount:      31,
    totalRentals:     44,
    isInstantBooking: false,
  },
  {
    vendorId:         'VENDOR2',
    categorySlug:     'event-equipment',
    name:             'Portable Stage Platform 16x12 ft',
    description:      'Modular portable stage for events, concerts, and ceremonies. Steel frame with non-slip surface. Height adjustable. Setup crew available.',
    pricePerDay:      5000,
    depositAmount:    15000,
    condition:        'GOOD',
    district:         'Dhaka',
    division:         'Dhaka',
    deliveryAvailable: true,
    deliveryFee:      800,
    tags:             ['stage', 'platform', 'event', 'concert', 'ceremony'],
    specifications:   {
      'Size':       '16 × 12 feet',
      'Height':     '24 inches (adjustable)',
      'Material':   'Steel frame + Non-slip deck',
      'Capacity':   '500 kg/m²',
    },
    averageRating:    4.7,
    reviewCount:      17,
    totalRentals:     21,
    isInstantBooking: false,
  },

  // ── Baby Products ──────────────────────────────────────────────────────────
  {
    vendorId:         'VENDOR1',
    categorySlug:     'baby-products',
    name:             'Baby Stroller / Pram (0–3 Years)',
    description:      'Lightweight foldable baby stroller with adjustable backrest, sun canopy, and storage basket. Suitable for newborns to 3 years. Sanitized before every rental.',
    pricePerDay:      250,
    depositAmount:    3000,
    condition:        'LIKE_NEW',
    brand:            'Chicco',
    district:         'Dhaka',
    division:         'Dhaka',
    deliveryAvailable: true,
    deliveryFee:      100,
    tags:             ['stroller', 'pram', 'baby', 'infant', 'chicco'],
    specifications:   {
      'Age Range':   '0–3 years (up to 15 kg)',
      'Foldable':    'Yes, one-hand fold',
      'Recline':     '3-position adjustable',
      'Includes':    'Rain cover + Mosquito net',
    },
    averageRating:    4.9,
    reviewCount:      88,
    totalRentals:     112,
    isInstantBooking: true,
  },
  {
    vendorId:         'VENDOR1',
    categorySlug:     'baby-products',
    name:             'Baby Crib / Cot with Mattress',
    description:      'Wooden baby crib with convertible side rail and spring mattress. Includes fitted sheet. Fully sanitized. Suitable for 0–2 years.',
    pricePerDay:      300,
    depositAmount:    4000,
    condition:        'GOOD',
    district:         'Dhaka',
    division:         'Dhaka',
    deliveryAvailable: true,
    deliveryFee:      200,
    tags:             ['crib', 'cot', 'baby-bed', 'baby', 'infant'],
    specifications:   {
      'Age Range':    '0–2 years',
      'Material':     'Solid wood',
      'Mattress':     'Spring mattress included',
      'Dimensions':   '120 × 60 cm',
    },
    averageRating:    4.7,
    reviewCount:      53,
    totalRentals:     78,
    isInstantBooking: false,
  },

  // ── Camping & Travel Gear ──────────────────────────────────────────────────
  {
    vendorId:         'VENDOR1',
    categorySlug:     'camping-travel-gear',
    name:             '4-Person Camping Tent (Waterproof)',
    description:      'Spacious 4-person dome tent with waterproof rainfly and mesh ventilation panels. Easy 10-minute setup. Includes tent poles, stakes, and carry bag.',
    pricePerDay:      600,
    depositAmount:    4000,
    condition:        'GOOD',
    brand:            'Quechua',
    district:         'Dhaka',
    division:         'Dhaka',
    deliveryAvailable: true,
    deliveryFee:      150,
    tags:             ['tent', 'camping', 'outdoor', '4-person', 'waterproof'],
    specifications:   {
      'Capacity':     '4 persons',
      'Waterproof':   '2000mm hydrostatic head',
      'Setup Time':   '~10 minutes',
      'Packed Size':  '58 × 20 cm',
    },
    averageRating:    4.6,
    reviewCount:      34,
    totalRentals:     51,
    isInstantBooking: true,
  },
  {
    vendorId:         'VENDOR1',
    categorySlug:     'camping-travel-gear',
    name:             'Sleeping Bags Set (2 pcs)',
    description:      'Pair of mummy-style sleeping bags rated to 5°C. Lightweight, compressible, and warm. Ideal for camping trips and outdoor adventures in Bangladesh.',
    pricePerDay:      300,
    depositAmount:    2000,
    condition:        'GOOD',
    district:         'Dhaka',
    division:         'Dhaka',
    deliveryAvailable: true,
    deliveryFee:      100,
    tags:             ['sleeping-bag', 'camping', 'outdoor', 'travel', 'hiking'],
    specifications:   {
      'Quantity':     '2 sleeping bags',
      'Rating':       '5°C comfort',
      'Fill':         'Hollow fiber',
      'Packed Size':  '35 × 20 cm each',
    },
    averageRating:    4.4,
    reviewCount:      22,
    totalRentals:     37,
    isInstantBooking: true,
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
