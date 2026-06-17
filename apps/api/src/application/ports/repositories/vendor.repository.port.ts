import type { VendorProfile, VendorId, UserId } from '@lendora/shared'
import type { VendorStatus } from '@lendora/shared'

export interface FindVendorsOptions {
  status?:   VendorStatus
  district?: string
  search?:   string
  page?:     number
  limit?:    number
}

export interface IVendorRepository {
  findById(id: VendorId): Promise<VendorProfile | null>
  findByUserId(userId: UserId): Promise<VendorProfile | null>
  findMany(opts: FindVendorsOptions): Promise<{ items: VendorProfile[]; total: number }>
  findTopRated(limit: number): Promise<VendorProfile[]>

  create(data: Omit<VendorProfile, 'id' | 'createdAt' | 'updatedAt' | 'totalRentals' | 'totalEarnings' | 'averageRating'>): Promise<VendorProfile>
  update(id: VendorId, data: Partial<Omit<VendorProfile, 'id' | 'createdAt' | 'userId'>>): Promise<VendorProfile>

  approve(id: VendorId, adminId?: UserId): Promise<VendorProfile>
  suspend(id: VendorId, reason: string): Promise<VendorProfile>
  reject(id: VendorId, reason?: string): Promise<void>

  updateEarningsCache(id: VendorId, totalEarnings: number, totalRentals: number): Promise<void>
  updateRatingCache(id: VendorId, avg: number): Promise<void>
  updateResponseTime(id: VendorId, avgMinutes: number): Promise<void>
}
