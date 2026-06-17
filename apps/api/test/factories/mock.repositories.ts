/**
 * Mock repository factories.
 *
 * Each factory returns a typed object where every method is a vi.fn().
 * Tests override only the methods they care about via .mockResolvedValue().
 * No shared state — call the factory in beforeEach for a clean slate.
 */

import { vi } from 'vitest'
import type { IUserRepository }    from '../../src/application/ports/repositories/user.repository.port.js'
import type { IProductRepository } from '../../src/application/ports/repositories/product.repository.port.js'
import type { IRentalRepository }  from '../../src/application/ports/repositories/rental.repository.port.js'
import type { IVendorRepository }  from '../../src/application/ports/repositories/vendor.repository.port.js'
import type { IPaymentRepository } from '../../src/application/ports/repositories/payment.repository.port.js'

// vi.fn() typed to match the port interface — cast via unknown for brevity
type Mocked<T> = { [K in keyof T]: T[K] extends (...args: infer A) => infer R ? ReturnType<typeof vi.fn<A, R>> : T[K] }

export function mockUserRepo(): Mocked<IUserRepository> {
  return {
    findById:                  vi.fn(),
    findByEmail:               vi.fn(),
    findByPhone:               vi.fn(),
    findMany:                  vi.fn(),
    create:                    vi.fn(),
    update:                    vi.fn(),
    delete:                    vi.fn(),
    findByEmailWithPassword:   vi.fn(),
    updateRefreshToken:        vi.fn(),
    updatePassword:            vi.fn(),
    updateResetToken:          vi.fn(),
    findByResetToken:          vi.fn(),
    findByEmailVerifyToken:    vi.fn(),
    markEmailVerified:         vi.fn(),
    findVendorProfileByUserId: vi.fn(),
    findVendorProfileById:     vi.fn(),
  } as unknown as Mocked<IUserRepository>
}

export function mockProductRepo(): Mocked<IProductRepository> {
  return {
    findById:              vi.fn(),
    findBySlug:            vi.fn(),
    findByVendorId:        vi.fn(),
    search:                vi.fn(),
    findFeatured:          vi.fn(),
    findRecent:            vi.fn(),
    create:                vi.fn(),
    update:                vi.fn(),
    softDelete:            vi.fn(),
    getUnavailableDates:   vi.fn(),
    isAvailableForRange:   vi.fn(),
    blockDates:            vi.fn(),
    unblockDates:          vi.fn(),
    updateRatingCache:     vi.fn(),
    incrementRentalCount:  vi.fn(),
    findByCategory:        vi.fn(),
  } as unknown as Mocked<IProductRepository>
}

export function mockRentalRepo(): Mocked<IRentalRepository> {
  return {
    findById:                      vi.fn(),
    findMany:                      vi.fn(),
    findSummaries:                 vi.fn(),
    createWithLock:                vi.fn(),
    updateStatus:                  vi.fn(),
    update:                        vi.fn(),
    hasOverlappingActiveRental:    vi.fn(),
    findReturnRecord:              vi.fn(),
    createReturnRecord:            vi.fn(),
    updateReturnRecord:            vi.fn(),
    getVendorAnalytics:            vi.fn(),
  } as unknown as Mocked<IRentalRepository>
}

export function mockVendorRepo(): Mocked<IVendorRepository> {
  return {
    findById:             vi.fn(),
    findByUserId:         vi.fn(),
    findMany:             vi.fn(),
    findTopRated:         vi.fn(),
    create:               vi.fn(),
    update:               vi.fn(),
    approve:              vi.fn(),
    suspend:              vi.fn(),
    updateEarningsCache:  vi.fn(),
    updateRatingCache:    vi.fn(),
    updateResponseTime:   vi.fn(),
  } as unknown as Mocked<IVendorRepository>
}

export function mockPaymentRepo(): Mocked<IPaymentRepository> {
  return {
    findPaymentById:          vi.fn(),
    findPaymentByExternalRef: vi.fn(),
    findPaymentsByRental:     vi.fn(),
    findPayments:             vi.fn(),
    createPayment:            vi.fn(),
    updatePaymentStatus:      vi.fn(),
    findPayoutById:           vi.fn(),
    findPayoutByRentalId:     vi.fn(),
    findPayouts:              vi.fn(),
    createPayout:             vi.fn(),
    updatePayoutStatus:       vi.fn(),
    sumEarningsByVendor:      vi.fn(),
    getPendingPayoutTotal:    vi.fn(),
  } as unknown as Mocked<IPaymentRepository>
}
