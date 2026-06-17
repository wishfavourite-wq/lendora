import type {
  Rental, RentalId, UserId, VendorId, ProductId,
  RentalSummary, ReturnRecord,
} from '@lendora/shared'
import type { RentalStatus } from '@lendora/shared'

export interface FindRentalsOptions {
  renterId?:  UserId
  vendorId?:  VendorId
  productId?: ProductId
  status?:    RentalStatus | RentalStatus[]
  from?:      Date
  until?:     Date
  page?:      number
  limit?:     number
}

export interface IRentalRepository {
  findById(id: RentalId): Promise<Rental | null>
  findMany(opts: FindRentalsOptions): Promise<{ items: Rental[]; total: number }>
  findSummaries(opts: FindRentalsOptions): Promise<{ items: RentalSummary[]; total: number }>

  /**
   * Race-condition-safe creation: acquires a row-level lock on the product's
   * availability before inserting. Must be called inside a DB transaction.
   */
  createWithLock(data: Omit<Rental, 'id' | 'createdAt' | 'updatedAt'>): Promise<Rental>

  updateStatus(id: RentalId, status: RentalStatus, meta?: Partial<Rental>): Promise<Rental>
  update(id: RentalId, data: Partial<Omit<Rental, 'id' | 'createdAt' | 'productId' | 'renterId' | 'vendorId'>>): Promise<Rental>

  hasOverlappingActiveRental(productId: ProductId, startDate: Date, endDate: Date, excludeRentalId?: RentalId): Promise<boolean>

  findReturnRecord(rentalId: RentalId): Promise<ReturnRecord | null>
  createReturnRecord(data: Omit<ReturnRecord, 'id' | 'createdAt' | 'updatedAt' | 'evidence'>): Promise<ReturnRecord>
  updateReturnRecord(rentalId: RentalId, data: Partial<ReturnRecord>): Promise<ReturnRecord>

  getVendorAnalytics(vendorId: VendorId, from: Date, until: Date): Promise<VendorAnalytics>
}

export interface VendorAnalytics {
  totalRentals:     number
  completedRentals: number
  cancelledRentals: number
  totalRevenue:     number
  averageRating:    number
  totalDeposits:    number
  depositsRefunded: number
  depositsForfeited: number
  topProducts:      { productId: ProductId; name: string; rentalCount: number }[]
}
