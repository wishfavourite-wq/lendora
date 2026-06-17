import { PrismaClient } from '@prisma/client'
import { seedCategories } from './categories.seed.js'
import { seedUsers }      from './users.seed.js'

const db = new PrismaClient()

async function main(): Promise<void> {
  console.log('\n🌱 LENDORA — Database Seed\n')

  // Clear products first (FK dependency on categories)
  await db.productMedia.deleteMany({})
  await db.product.deleteMany({})
  console.log('  ✓ Cleared demo products')

  // Clear all categories and recreate only the 4 main ones
  await db.category.deleteMany({ where: { parentId: { not: null } } })
  await db.category.deleteMany({})
  console.log('  ✓ Cleared old categories')

  await seedCategories(db)
  await seedUsers(db)

  console.log('\n✅ Seed complete\n')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
