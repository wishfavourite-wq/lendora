import type { User, UserId, VendorId, VendorProfile } from '@lendora/shared'
import type { UserStatus, UserRole } from '@lendora/shared'

export interface FindUsersOptions {
  status?:  UserStatus
  role?:    UserRole
  search?:  string
  page?:    number
  limit?:   number
}

export interface IUserRepository {
  findById(id: UserId): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  findByPhone(phone: string): Promise<User | null>
  findMany(opts: FindUsersOptions): Promise<{ items: User[]; total: number }>
  create(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>
  update(id: UserId, data: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User>
  delete(id: UserId): Promise<void>

  // Auth-specific
  findByEmailWithPassword(email: string): Promise<(User & { passwordHash: string }) | null>
  updateRefreshToken(id: UserId, hash: string | null): Promise<void>
  updatePassword(id: UserId, passwordHash: string): Promise<void>
  updateResetToken(id: UserId, token: string | null, expiry: Date | null): Promise<void>
  findByResetToken(token: string): Promise<User | null>
  findByEmailVerifyToken(token: string): Promise<User | null>
  markEmailVerified(id: UserId): Promise<void>

  // Vendor
  findVendorProfileByUserId(userId: UserId): Promise<VendorProfile | null>
  findVendorProfileById(id: VendorId): Promise<VendorProfile | null>
}
