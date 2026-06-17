import type { PrismaClient } from '@prisma/client'
import type { IUserRepository } from '@/application/ports/repositories/user.repository.port.js'
import { UserRole, UserStatus } from '@lendora/shared'
import { ConflictError } from '@/domain/errors/index.js'
import bcrypt from 'bcryptjs'

export interface RegisterCustomerInput {
  name:              string
  email:             string
  phone:             string
  password:          string
  address?:          string
  nidNumber:         string
  profilePictureUrl?: string
  nidFrontImageUrl?:  string
  nidBackImageUrl?:   string
  bkashNumber?:      string
}

interface Deps {
  userRepo: IUserRepository
  prisma:   PrismaClient
}

export class RegisterCustomerUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: RegisterCustomerInput): Promise<{ message: string }> {
    const { userRepo, prisma } = this.deps

    const existing = await userRepo.findByEmail(input.email)
    if (existing) throw new ConflictError('Email is already registered', 'email')

    const passwordHash = await bcrypt.hash(input.password, 12)

    await prisma.user.create({
      data: {
        email:            input.email,
        phone:            input.phone ?? null,
        passwordHash,
        name:             input.name,
        address:          input.address          ?? null,
        avatarUrl:        input.profilePictureUrl ?? null,
        nidNumber:        input.nidNumber,
        nidFrontImageUrl: input.nidFrontImageUrl  ?? null,
        nidBackImageUrl:  input.nidBackImageUrl   ?? null,
        bkashNumber:      input.bkashNumber       ?? null,
        role:             UserRole.CUSTOMER,
        status:           UserStatus.PENDING_VERIFICATION,
      },
    })

    return { message: 'Registration submitted. Your account is awaiting admin verification.' }
  }
}
