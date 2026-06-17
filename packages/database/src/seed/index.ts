import { PrismaClient } from '@prisma/client'
import { seedCategories } from './categories.seed.js'
import { seedUsers }      from './users.seed.js'

const db = new PrismaClient()

async function main(): Promise<void> {
  console.log('\n🌱 LENDORA — Database Seed\n')

  // Clear any previously seeded demo products so vendors start fresh
  await db.productMedia.deleteMany({})
  await db.product.deleteMany({})
  console.log('  ✓ Cleared demo products')

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
