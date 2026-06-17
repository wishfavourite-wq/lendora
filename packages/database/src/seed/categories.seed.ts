import type { PrismaClient } from '@prisma/client'

const CATEGORIES = [
  { slug: 'power-tools',         name: 'Power Tools',           emoji: '⚡', sortOrder: 1 },
  { slug: 'event-equipment',     name: 'Event Equipment',       emoji: '🎪', sortOrder: 2 },
  { slug: 'baby-products',       name: 'Baby Products',         emoji: '👶', sortOrder: 3 },
  { slug: 'camping-travel-gear', name: 'Camping & Travel Gear', emoji: '🏕️', sortOrder: 4 },
]

export async function seedCategories(db: PrismaClient): Promise<void> {
  console.log('  Seeding categories...')

  for (const cat of CATEGORIES) {
    await db.category.upsert({
      where:  { slug: cat.slug },
      update: { name: cat.name, emoji: cat.emoji, sortOrder: cat.sortOrder, isActive: true },
      create: { name: cat.name, slug: cat.slug, emoji: cat.emoji, sortOrder: cat.sortOrder, isActive: true },
    })
  }

  console.log(`  ✓ ${CATEGORIES.length} categories`)
}
