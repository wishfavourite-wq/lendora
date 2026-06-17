import type { PrismaClient } from '@prisma/client'

export const CATEGORIES = [
  {
    slug: 'cameras-photography',
    name: 'Cameras & Photography',
    emoji: '📷',
    sortOrder: 1,
    children: [
      { slug: 'dslr-cameras',       name: 'DSLR Cameras',            emoji: '📸', sortOrder: 1 },
      { slug: 'mirrorless-cameras', name: 'Mirrorless Cameras',       emoji: '📸', sortOrder: 2 },
      { slug: 'lenses',             name: 'Lenses',                   emoji: '🔭', sortOrder: 3 },
      { slug: 'camera-accessories', name: 'Camera Accessories',       emoji: '🎒', sortOrder: 4 },
      { slug: 'drones',             name: 'Drones',                   emoji: '🚁', sortOrder: 5 },
    ],
  },
  {
    slug: 'audio-equipment',
    name: 'Audio Equipment',
    emoji: '🎙️',
    sortOrder: 2,
    children: [
      { slug: 'microphones',       name: 'Microphones',               emoji: '🎤', sortOrder: 1 },
      { slug: 'sound-systems',     name: 'Sound Systems',             emoji: '🔊', sortOrder: 2 },
      { slug: 'mixers-amplifiers', name: 'Mixers & Amplifiers',       emoji: '🎛️', sortOrder: 3 },
      { slug: 'studio-monitors',   name: 'Studio Monitors',           emoji: '🎵', sortOrder: 4 },
    ],
  },
  {
    slug: 'event-party',
    name: 'Event & Party',
    emoji: '🎉',
    sortOrder: 3,
    children: [
      { slug: 'tents-canopies',    name: 'Tents & Canopies',          emoji: '⛺', sortOrder: 1 },
      { slug: 'lighting',          name: 'Lighting',                  emoji: '💡', sortOrder: 2 },
      { slug: 'decoration',        name: 'Decoration',                emoji: '🎊', sortOrder: 3 },
      { slug: 'furniture-rental',  name: 'Furniture',                 emoji: '🪑', sortOrder: 4 },
      { slug: 'tableware',         name: 'Tableware',                 emoji: '🍽️', sortOrder: 5 },
    ],
  },
  {
    slug: 'sports-outdoor',
    name: 'Sports & Outdoor',
    emoji: '⚽',
    sortOrder: 4,
    children: [
      { slug: 'camping-gear',      name: 'Camping Gear',              emoji: '🏕️', sortOrder: 1 },
      { slug: 'cycling',           name: 'Cycling',                   emoji: '🚴', sortOrder: 2 },
      { slug: 'water-sports',      name: 'Water Sports',              emoji: '🏄', sortOrder: 3 },
      { slug: 'fitness',           name: 'Fitness Equipment',         emoji: '🏋️', sortOrder: 4 },
      { slug: 'cricket-gear',      name: 'Cricket Gear',              emoji: '🏏', sortOrder: 5 },
    ],
  },
  {
    slug: 'construction-tools',
    name: 'Tools & Construction',
    emoji: '🔧',
    sortOrder: 5,
    children: [
      { slug: 'power-tools',            name: 'Power Tools',          emoji: '⚡', sortOrder: 1 },
      { slug: 'hand-tools',             name: 'Hand Tools',           emoji: '🔨', sortOrder: 2 },
      { slug: 'ladders-scaffolding',    name: 'Ladders & Scaffolding',emoji: '🪜', sortOrder: 3 },
      { slug: 'generators',             name: 'Generators',           emoji: '🔋', sortOrder: 4 },
    ],
  },
  {
    slug: 'electronics',
    name: 'Electronics',
    emoji: '💻',
    sortOrder: 6,
    children: [
      { slug: 'laptops',           name: 'Laptops',                   emoji: '💻', sortOrder: 1 },
      { slug: 'projectors',        name: 'Projectors',                emoji: '📽️', sortOrder: 2 },
      { slug: 'gaming',            name: 'Gaming',                    emoji: '🎮', sortOrder: 3 },
      { slug: 'tablets',           name: 'Tablets',                   emoji: '📱', sortOrder: 4 },
    ],
  },
  {
    slug: 'fashion-accessories',
    name: 'Fashion & Accessories',
    emoji: '👗',
    sortOrder: 7,
    children: [
      { slug: 'bridal-wear',       name: 'Bridal Wear',               emoji: '👰', sortOrder: 1 },
      { slug: 'traditional-wear',  name: 'Traditional Wear',          emoji: '👘', sortOrder: 2 },
      { slug: 'jewelry',           name: 'Jewelry',                   emoji: '💍', sortOrder: 3 },
      { slug: 'bags-luggage',      name: 'Bags & Luggage',            emoji: '🧳', sortOrder: 4 },
    ],
  },
  {
    slug: 'vehicles',
    name: 'Vehicles',
    emoji: '🚗',
    sortOrder: 8,
    children: [
      { slug: 'cars',              name: 'Cars',                      emoji: '🚗', sortOrder: 1 },
      { slug: 'motorcycles',       name: 'Motorcycles',               emoji: '🏍️', sortOrder: 2 },
      { slug: 'bicycles',          name: 'Bicycles',                  emoji: '🚲', sortOrder: 3 },
    ],
  },
] as const

const FEATURED_CATEGORIES = [
  { slug: 'power-tools',        name: 'Power Tools',            emoji: '⚡', sortOrder: 101 },
  { slug: 'event-equipment',    name: 'Event Equipment',        emoji: '🎪', sortOrder: 102 },
  { slug: 'baby-products',      name: 'Baby Products',          emoji: '👶', sortOrder: 103 },
  { slug: 'camping-travel-gear',name: 'Camping & Travel Gear',  emoji: '🏕️', sortOrder: 104 },
] as const

export async function seedCategories(db: PrismaClient): Promise<void> {
  console.log('  Seeding categories...')

  // Ensure the 4 featured home-page categories always exist as root categories
  for (const cat of FEATURED_CATEGORIES) {
    await db.category.upsert({
      where:  { slug: cat.slug },
      update: {},
      create: { name: cat.name, slug: cat.slug, emoji: cat.emoji, sortOrder: cat.sortOrder, isActive: true },
    })
  }

  for (const parent of CATEGORIES) {
    const parentRow = await db.category.upsert({
      where:  { slug: parent.slug },
      update: {},
      create: {
        name:      parent.name,
        slug:      parent.slug,
        emoji:     parent.emoji,
        sortOrder: parent.sortOrder,
        isActive:  true,
      },
    })

    for (const child of parent.children) {
      await db.category.upsert({
        where:  { slug: child.slug },
        update: {},
        create: {
          parentId:  parentRow.id,
          name:      child.name,
          slug:      child.slug,
          emoji:     child.emoji,
          sortOrder: child.sortOrder,
          isActive:  true,
        },
      })
    }
  }

  console.log(`  ✓ ${CATEGORIES.length} parent + ${CATEGORIES.reduce((s, c) => s + c.children.length, 0)} child categories`)
}
