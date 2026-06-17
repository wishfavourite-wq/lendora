import type { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const HASH_ROUNDS = 12

export async function seedUsers(db: PrismaClient): Promise<{
  adminId:    string
  vendor1Id:  string
  vendor2Id:  string
  renter1Id:  string
  renter2Id:  string
  vendorProfile1Id: string
  vendorProfile2Id: string
}> {
  console.log('  Seeding users...')

  const passwordHash = await bcrypt.hash('Password123!', HASH_ROUNDS)

  const admin = await db.user.upsert({
    where:  { email: 'admin@lendora.com.bd' },
    update: {},
    create: {
      email:           'admin@lendora.com.bd',
      name:            'LENDORA Admin',
      passwordHash,
      role:            'ADMIN',
      status:          'ACTIVE',
      phone:           '+8801700000001',
      emailVerifiedAt: new Date(),
    },
  })

  const vendor1User = await db.user.upsert({
    where:  { email: 'rahul.photo@gmail.com' },
    update: {},
    create: {
      email:           'rahul.photo@gmail.com',
      name:            'Rahul Ahmed',
      passwordHash,
      role:            'VENDOR',
      status:          'ACTIVE',
      phone:           '+8801711111111',
      emailVerifiedAt: new Date(),
    },
  })

  const vendor2User = await db.user.upsert({
    where:  { email: 'fatema.events@gmail.com' },
    update: {},
    create: {
      email:           'fatema.events@gmail.com',
      name:            'Fatema Begum',
      passwordHash,
      role:            'VENDOR',
      status:          'ACTIVE',
      phone:           '+8801722222222',
      emailVerifiedAt: new Date(),
    },
  })

  const renter1 = await db.user.upsert({
    where:  { email: 'karim.renter@gmail.com' },
    update: {},
    create: {
      email:           'karim.renter@gmail.com',
      name:            'Abdul Karim',
      passwordHash,
      role:            'CUSTOMER',
      status:          'ACTIVE',
      phone:           '+8801733333333',
      emailVerifiedAt: new Date(),
    },
  })

  const renter2 = await db.user.upsert({
    where:  { email: 'nadia.renter@gmail.com' },
    update: {},
    create: {
      email:           'nadia.renter@gmail.com',
      name:            'Nadia Islam',
      passwordHash,
      role:            'CUSTOMER',
      status:          'ACTIVE',
      phone:           '+8801744444444',
      emailVerifiedAt: new Date(),
    },
  })

  const vendorProfile1 = await db.vendorProfile.upsert({
    where:  { userId: vendor1User.id },
    update: {},
    create: {
      userId:              vendor1User.id,
      businessName:        'Rahul Photography Studio',
      businessDescription: 'Professional photography and videography equipment rental. 5+ years of experience serving Dhaka\'s creative community.',
      businessAddress:     'House 12, Road 5, Dhanmondi, Dhaka',
      district:            'Dhaka',
      division:            'Dhaka',
      bkashNumber:         '+8801711111111',
      nagadNumber:         '+8801711111111',
      status:              'ACTIVE',
      verifiedAt:          new Date(),
      averageRating:       4.8,
      totalRentals:        127,
      totalEarnings:       285000,
      responseTimeMinutes: 45,
    },
  })

  const vendorProfile2 = await db.vendorProfile.upsert({
    where:  { userId: vendor2User.id },
    update: {},
    create: {
      userId:              vendor2User.id,
      businessName:        'Fatema Event Solutions',
      businessDescription: 'Complete event management equipment — tents, lighting, sound systems, and decor for weddings, corporate events, and celebrations.',
      businessAddress:     'Plot 7, Sector 11, Uttara, Dhaka',
      district:            'Dhaka',
      division:            'Dhaka',
      bkashNumber:         '+8801722222222',
      status:              'ACTIVE',
      verifiedAt:          new Date(),
      averageRating:       4.6,
      totalRentals:        89,
      totalEarnings:       198000,
      responseTimeMinutes: 30,
    },
  })

  console.log('  ✓ 5 users + 2 vendor profiles')

  return {
    adminId:          admin.id,
    vendor1Id:        vendor1User.id,
    vendor2Id:        vendor2User.id,
    renter1Id:        renter1.id,
    renter2Id:        renter2.id,
    vendorProfile1Id: vendorProfile1.id,
    vendorProfile2Id: vendorProfile2.id,
  }
}
