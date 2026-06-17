import { PrismaClient } from '@prisma/client'
import { seedCategories } from './categories.seed.js'
import { seedUsers }      from './users.seed.js'
import { seedProducts }   from './products.seed.js'

const db = new PrismaClient()

async function main(): Promise<void> {
  console.log('\n🌱 LENDORA — Database Seed\n')

  await seedCategories(db)
  const ids = await seedUsers(db)
  await seedProducts(db, ids)

  console.log('\n✅ Seed complete\n')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
