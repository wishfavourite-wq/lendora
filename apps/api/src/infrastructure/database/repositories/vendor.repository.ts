import type { PrismaClient, Prisma } from '@prisma/client'
import type {
  IVendorRepository, FindVendorsOptions,
} from '@/application/ports/repositories/vendor.repository.port.js'
import type { VendorProfile, VendorId, UserId } from '@lendora/shared'
import type { VendorStatus } from '@lendora/shared'
import { asId } from '@lendora/shared'

type PrismaVendor = Prisma.VendorProfileGetPayload<Record<string, never>>

export class PrismaVendorRepository implements IVendorRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: VendorId): Promise<VendorProfile | null> {
    const row = await this.db.vendorProfile.findUnique({ where: { id } })
    return row ? this.mapVendor(row) : null
  }

  async findByUserId(userId: UserId): Promise<VendorProfile | null> {
    const row = await this.db.vendorProfile.findUnique({ where: { userId } })
    return row ? this.mapVendor(row) : null
  }

  async findMany(opts: FindVendorsOptions): Promise<{ items: VendorProfile[]; total: number }> {
    const where: Prisma.VendorProfileWhereInput = {
      ...(opts.status   && { status:   opts.status }),
      ...(opts.district && { district: opts.district }),
      ...(opts.division && { division: opts.division }),
      ...(opts.search   && {
        OR: [
          { businessName:        { contains: opts.search } },
          { businessDescription: { contains: opts.search } },
        ],
      }),
    }

    const page  = opts.page  ?? 1
    const limit = opts.limit ?? 20

    const [rows, total] = await this.db.$transaction([
      this.db.vendorProfile.findMany({
        where,
        skip:    (page - 1) * limit,
        take:    limit,
        orderBy: { averageRating: 'desc' },
      }),
      this.db.vendorProfile.count({ where }),
    ])

    return { items: rows.map(this.mapVendor), total }
  }

  async create(data: Omit<VendorProfile, 'id' | 'createdAt' | 'updatedAt' | 'totalRentals' | 'totalEarnings' | 'averageRating' | 'responseTimeMinutes' | 'verifiedAt'>): Promise<VendorProfile> {
    const row = await this.db.vendorProfile.create({
      data: {
        userId:              data.userId,
        businessName:        data.businessName,
        businessDescription: data.businessDescription ?? undefined,
        businessAddress:     data.businessAddress     ?? undefined,
        district:            data.district,
        division:            data.division,
        bankAccountName:     data.bankAccountName     ?? undefined,
        bankAccountNumber:   data.bankAccountNumber   ?? undefined,
        bankName:            data.bankName            ?? undefined,
        bkashNumber:         data.bkashNumber         ?? undefined,
        nagadNumber:         data.nagadNumber         ?? undefined,
        nidNumber:           (data as any).nidNumber            ?? undefined,
        nidFrontImageUrl:    (data as any).nidFrontImageUrl     ?? undefined,
        nidBackImageUrl:     (data as any).nidBackImageUrl      ?? undefined,
        status:              data.status,
      },
    })
    return this.mapVendor(row)
  }

  async update(id: VendorId, data: Partial<Omit<VendorProfile, 'id' | 'userId' | 'createdAt'>>): Promise<VendorProfile> {
    const row = await this.db.vendorProfile.update({
      where: { id },
      data:  {
        ...(data.businessName        !== undefined && { businessName:        data.businessName }),
        ...(data.businessDescription !== undefined && { businessDescription: data.businessDescription ?? undefined }),
        ...(data.businessAddress     !== undefined && { businessAddress:     data.businessAddress     ?? undefined }),
        ...(data.district            !== undefined && { district:            data.district }),
        ...(data.division            !== undefined && { division:            data.division }),
        ...(data.bankAccountName     !== undefined && { bankAccountName:     data.bankAccountName     ?? undefined }),
        ...(data.bankAccountNumber   !== undefined && { bankAccountNumber:   data.bankAccountNumber   ?? undefined }),
        ...(data.bankName            !== undefined && { bankName:            data.bankName            ?? undefined }),
        ...(data.bkashNumber         !== undefined && { bkashNumber:         data.bkashNumber         ?? undefined }),
        ...(data.nagadNumber         !== undefined && { nagadNumber:         data.nagadNumber         ?? undefined }),
      },
    })
    return this.mapVendor(row)
  }

  async approve(id: VendorId, adminId?: UserId): Promise<VendorProfile> {
    void adminId
    const row = await this.db.vendorProfile.update({
      where: { id },
      data:  { status: 'ACTIVE', verifiedAt: new Date() },
    })
    return this.mapVendor(row)
  }

  async suspend(id: VendorId, reason: string): Promise<VendorProfile> {
    const row = await this.db.vendorProfile.update({
      where: { id },
      data:  { status: 'SUSPENDED', suspensionReason: reason, suspendedAt: new Date() },
    })
    return this.mapVendor(row)
  }

  async reject(id: VendorId, reason?: string): Promise<void> {
    await this.db.vendorProfile.update({
      where: { id },
      data:  { status: 'BANNED', suspensionReason: reason ?? null },
    })
  }

  async updateEarningsCache(id: VendorId, totalEarnings: number, totalRentals: number): Promise<void> {
    await this.db.vendorProfile.update({
      where: { id },
      data:  { totalEarnings, totalRentals },
    })
  }

  async updateRatingCache(id: VendorId, avg: number, responseTimeMinutes?: number): Promise<void> {
    await this.db.vendorProfile.update({
      where: { id },
      data:  {
        averageRating: avg,
        ...(responseTimeMinutes !== undefined && { responseTimeMinutes }),
      },
    })
  }

  async findTopByRating(limit: number): Promise<VendorProfile[]> {
    const rows = await this.db.vendorProfile.findMany({
      where:   { status: 'APPROVED' },
      orderBy: [{ averageRating: 'desc' }, { totalRentals: 'desc' }],
      take:    limit,
    })
    return rows.map(this.mapVendor)
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
      status:              row.status              as VendorStatus,
      suspensionReason:    row.suspensionReason    ?? null,
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
