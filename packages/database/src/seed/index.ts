import { PrismaClient } from '@prisma/client'
import { seedCategories } from './categories.seed.js'
import { seedUsers }      from './users.seed.js'

const db = new PrismaClient()

async function main(): Promise<void> {
  console.log('\n🌱 LENDORA — Database Seed\n')

  // Clear products + categories using raw SQL to bypass FK constraints
  await db.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0')
  await db.$executeRawUnsafe('TRUNCATE TABLE product_media')
  await db.$executeRawUnsafe('TRUNCATE TABLE product_blocked_dates')
  await db.$executeRawUnsafe('TRUNCATE TABLE wishlists')
  await db.$executeRawUnsafe('TRUNCATE TABLE products')
  await db.$executeRawUnsafe('TRUNCATE TABLE categories')
  await db.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1')
  console.log('  ✓ Cleared products and categories')

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
