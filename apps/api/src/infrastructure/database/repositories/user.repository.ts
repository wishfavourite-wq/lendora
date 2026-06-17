import type { PrismaClient, Prisma } from '@prisma/client'
import type {
  IUserRepository, FindUsersOptions,
} from '@/application/ports/repositories/user.repository.port.js'
import type { User, UserId, VendorId, VendorProfile } from '@lendora/shared'
import { asId } from '@lendora/shared'

type PrismaUser = Prisma.UserGetPayload<Record<string, never>>
type PrismaVendor = Prisma.VendorProfileGetPayload<Record<string, never>>

export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: UserId): Promise<User | null> {
    const row = await this.db.user.findUnique({ where: { id } })
    return row ? this.mapUser(row) : null
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.db.user.findUnique({ where: { email } })
    return row ? this.mapUser(row) : null
  }

  async findByPhone(phone: string): Promise<User | null> {
    const row = await this.db.user.findUnique({ where: { phone } })
    return row ? this.mapUser(row) : null
  }

  async findMany(opts: FindUsersOptions): Promise<{ items: User[]; total: number }> {
    const where: Prisma.UserWhereInput = {
      ...(opts.status && { status: opts.status }),
      ...(opts.role   && { role:   opts.role   }),
      ...(opts.search && {
        OR: [
          { name:  { contains: opts.search } },
          { email: { contains: opts.search } },
          { phone: { contains: opts.search } },
        ],
      }),
    }

    const page  = opts.page  ?? 1
    const limit = opts.limit ?? 20

    const [rows, total] = await this.db.$transaction([
      this.db.user.findMany({
        where,
        skip:    (page - 1) * limit,
        take:    limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.db.user.count({ where }),
    ])

    return { items: rows.map(this.mapUser), total }
  }

  async create(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & {
    passwordHash:     string
    emailVerifyToken?: string
  }): Promise<User> {
    const row = await this.db.user.create({
      data: {
        email:            data.email,
        name:             data.name,
        passwordHash:     data.passwordHash,
        role:             data.role,
        status:           data.status,
        phone:            data.phone            ?? undefined,
        avatarUrl:        data.avatarUrl        ?? undefined,
        emailVerifyToken: data.emailVerifyToken ?? undefined,
      },
    })
    return this.mapUser(row)
  }

  async update(id: UserId, data: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User> {
    const row = await this.db.user.update({
      where: { id },
      data:  {
        ...(data.name            !== undefined && { name:            data.name }),
        ...(data.phone           !== undefined && { phone:           data.phone ?? undefined }),
        ...(data.avatarUrl       !== undefined && { avatarUrl:       data.avatarUrl ?? undefined }),
        ...(data.status          !== undefined && { status:          data.status }),
        ...(data.role            !== undefined && { role:            data.role }),
        ...(data.emailVerifiedAt !== undefined && { emailVerifiedAt: data.emailVerifiedAt }),
        ...(data.phoneVerifiedAt !== undefined && { phoneVerifiedAt: data.phoneVerifiedAt }),
        ...(data.lastLoginAt     !== undefined && { lastLoginAt:     data.lastLoginAt }),
      },
    })
    return this.mapUser(row)
  }

  async delete(id: UserId): Promise<void> {
    await this.db.user.delete({ where: { id } })
  }

  async findByEmailWithPassword(email: string): Promise<(User & { passwordHash: string; refreshTokenHash: string | null; resetToken: string | null; emailVerifyToken: string | null }) | null> {
    const row = await this.db.user.findUnique({ where: { email } })
    if (!row) return null
    return {
      ...this.mapUser(row),
      passwordHash:     row.passwordHash,
      refreshTokenHash: row.refreshTokenHash,
      resetToken:       row.resetToken,
      emailVerifyToken: row.emailVerifyToken,
    }
  }

  async updateRefreshToken(id: UserId, hash: string | null): Promise<void> {
    await this.db.user.update({ where: { id }, data: { refreshTokenHash: hash } })
  }

  async updateResetToken(id: UserId, token: string | null, expiry: Date | null): Promise<void> {
    await this.db.user.update({ where: { id }, data: { resetToken: token, resetTokenExpiry: expiry } })
  }

  async findByResetToken(token: string): Promise<User | null> {
    const row = await this.db.user.findUnique({ where: { resetToken: token } })
    if (!row) return null
    if (row.resetTokenExpiry && row.resetTokenExpiry < new Date()) return null
    return this.mapUser(row)
  }

  async updatePassword(id: UserId, passwordHash: string): Promise<void> {
    await this.db.user.update({
      where: { id },
      data:  { passwordHash, resetToken: null, resetTokenExpiry: null, refreshTokenHash: null },
    })
  }

  async markEmailVerified(id: UserId): Promise<void> {
    await this.db.user.update({
      where: { id },
      data:  { emailVerifiedAt: new Date(), emailVerifyToken: null },
    })
  }

  async findByEmailVerifyToken(token: string): Promise<User | null> {
    const row = await this.db.user.findUnique({ where: { emailVerifyToken: token } })
    return row ? this.mapUser(row) : null
  }

  async findVendorProfileByUserId(userId: UserId): Promise<VendorProfile | null> {
    const row = await this.db.vendorProfile.findUnique({ where: { userId } })
    return row ? this.mapVendor(row) : null
  }

  async findVendorProfileById(id: VendorId): Promise<VendorProfile | null> {
    const row = await this.db.vendorProfile.findUnique({ where: { id } })
    return row ? this.mapVendor(row) : null
  }

  private mapUser(row: PrismaUser): User {
    return {
      id:               asId<UserId>(row.id),
      email:            row.email,
      emailVerifiedAt:  row.emailVerifiedAt,
      phone:            row.phone,
      phoneVerifiedAt:  row.phoneVerifiedAt,
      name:             row.name,
      address:          row.address          ?? null,
      avatarUrl:        row.avatarUrl        ?? null,
      nidNumber:        row.nidNumber        ?? null,
      nidFrontImageUrl: row.nidFrontImageUrl ?? null,
      nidBackImageUrl:  row.nidBackImageUrl  ?? null,
      bkashNumber:      row.bkashNumber      ?? null,
      role:             row.role   as import('@lendora/shared').UserRole,
      status:           row.status as import('@lendora/shared').UserStatus,
      lastLoginAt:      row.lastLoginAt,
      createdAt:        row.createdAt,
      updatedAt:        row.updatedAt,
    }
  }

  private mapVendor(row: PrismaVendor): VendorProfile {
    return {
      id:                  asId<VendorId>(row.id),
      userId:              asId<UserId>(row.userId),
      businessName:        row.businessName,
      businessDescription: row.businessDescription,
      businessAddress:     row.businessAddress,
      district:            row.district,
      division:            row.division,
      bankAccountName:     row.bankAccountName,
      bankAccountNumber:   row.bankAccountNumber,
      bankName:            row.bankName,
      bkashNumber:         row.bkashNumber,
      nagadNumber:         row.nagadNumber,
      status:              row.status as import('@lendora/shared').VendorStatus,
      suspensionReason:    row.suspensionReason ?? null,
      verifiedAt:          row.verifiedAt,
      totalRentals:        row.totalRentals,
      totalEarnings:       Number(row.totalEarnings),
      averageRating:       row.averageRating,
      responseTimeMinutes: row.responseTimeMinutes,
      createdAt:           row.createdAt,
      updatedAt:           row.updatedAt,
    }
  }
}
