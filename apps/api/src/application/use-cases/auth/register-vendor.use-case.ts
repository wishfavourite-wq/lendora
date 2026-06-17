import type { PrismaClient } from '@prisma/client'
import type { IUserRepository } from '@/application/ports/repositories/user.repository.port.js'
import { UserRole, UserStatus } from '@lendora/shared'
import { ConflictError } from '@/domain/errors/index.js'
import bcrypt from 'bcryptjs'

export interface RegisterVendorInput {
  // Personal info
  name:        string
  email:       string
  phone:       string
  password:    string
  address?:    string
  // Verification
  nidNumber:         string
  profilePictureUrl?: string
  nidFrontImageUrl?:  string
  nidBackImageUrl?:   string
  // Shop info
  businessName:        string
  businessDescription?: string
  businessAddress?:    string
  division:            string
  district:            string
  // Payment
  bkashNumber?: string
}

interface Deps {
  userRepo: IUserRepository
  prisma:   PrismaClient
}

export class RegisterVendorUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: RegisterVendorInput): Promise<{ message: string }> {
    const { userRepo, prisma } = this.deps

    const existing = await userRepo.findByEmail(input.email)
    if (existing) throw new ConflictError('Email is already registered', 'email')

    const passwordHash = await bcrypt.hash(input.password, 12)

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email:        input.email,
          phone:        input.phone ?? null,
          passwordHash,
          name:         input.name,
          address:      input.address ?? null,
          avatarUrl:    input.profilePictureUrl ?? null,
          role:         UserRole.VENDOR,
          status:       UserStatus.ACTIVE,
        },
      })

      await tx.vendorProfile.create({
        data: {
          userId:              user.id,
          businessName:        input.businessName,
          businessDescription: input.businessDescription ?? null,
          businessAddress:     input.businessAddress ?? null,
          district:            input.district,
          division:            input.division,
          bkashNumber:         input.bkashNumber ?? null,
          nidNumber:           input.nidNumber,
          nidFrontImageUrl:    input.nidFrontImageUrl ?? null,
          nidBackImageUrl:     input.nidBackImageUrl  ?? null,
          status:              'PENDING_VERIFICATION',
        },
      })
    })

    return { message: 'Registration submitted. Your account is awaiting admin approval.' }
  }
}
