/**
 * Entity builders — construct valid domain objects for tests.
 * Override only what a specific test needs; defaults produce
 * a consistent, coherent object that satisfies all invariants.
 */

import type { User, VendorProfile, Product, Rental, Payment, VendorPayout } from '@lendora/shared'
import { asId } from '@lendora/shared'
import type { UserId, VendorId, ProductId, RentalId, PaymentId } from '@lendora/shared'

// ── User ──────────────────────────────────────────────────────────────────────

type InternalUser = User & {
  passwordHash:     string
  refreshTokenHash: string | null
  resetToken:       string | null
  emailVerifyToken: string | null
  lastLoginAt:      Date | null
}

export function buildUser(overrides: Partial<InternalUser> = {}): InternalUser {
  return {
    id:               asId<UserId>('user-001'),
    email:            'renter@lendora.test',
    phone:            '+8801700000001',
    name:             'Test Renter',
    address:          null,
    avatarUrl:        null,
    nidNumber:        null,
    nidFrontImageUrl: null,
    nidBackImageUrl:  null,
    bkashNumber:      null,
    role:             'CUSTOMER' as import('@lendora/shared').UserRole,
    status:           'ACTIVE'   as import('@lendora/shared').UserStatus,
    emailVerifiedAt:  new Date('2025-01-01'),
    phoneVerifiedAt:  null,
    passwordHash:     '$2b$12$hashedpassword',
    refreshTokenHash: null,
    resetToken:       null,
    emailVerifyToken: null,
    lastLoginAt:      null,
    createdAt:        new Date('2025-01-01'),
    updatedAt:        new Date('2025-01-01'),
    ...overrides,
  }
}

export function buildVendorUser(overrides: Partial<User> = {}): User {
  return buildUser({
    id:    asId<UserId>('user-vendor-001'),
    email: 'vendor@lendora.test',
    name:  'Test Vendor',
    role:  'VENDOR' as import('@lendora/shared').UserRole,
    ...overrides,
  })
}

export function buildVendorProfile(overrides: Partial<VendorProfile> = {}): VendorProfile {
  return {
    id:                   asId<VendorId>('vendor-001'),
    userId:               asId<UserId>('user-vendor-001'),
    businessName:         'Test Rentals BD',
    businessDescription:  'Quality rental equipment',
    businessAddress:      'Gulshan, Dhaka',
    district:             'Dhaka',
    division:             'Dhaka',
    bankAccountName:      null,
    bankAccountNumber:    null,
    bankName:             null,
    bkashNumber:          '01700000002',
    nagadNumber:          null,
    status:               'ACTIVE' as import('@lendora/shared').VendorStatus,
    suspensionReason:     null,
    verifiedAt:           new Date('2025-01-15'),
    totalRentals:         24,
    totalEarnings:        86_400,
    averageRating:        4.7,
    responseTimeMinutes:  15,
    createdAt:            new Date('2025-01-01'),
    updatedAt:            new Date('2025-01-01'),
    ...overrides,
  }
}

// ── Product ───────────────────────────────────────────────────────────────────

export function buildProduct(overrides: Partial<Product> = {}): Product {
  return {
    id:                asId<ProductId>('product-001'),
    vendorId:          asId<VendorId>('vendor-001'),
    categoryId:        asId<import('@lendora/shared').CategoryId>('cat-001'),
    name:              'Canon EOS 5D Mark IV',
    slug:              'canon-eos-5d-mark-iv-vendor-001',
    description:       'Professional DSLR camera available for rent',
    pricePerDay:       1500,
    pricePerWeek:      9000,
    pricePerMonth:     null,
    depositAmount:     5000,
    condition:         'LIKE_NEW' as import('@lendora/shared').ProductCondition,
    status:            'ACTIVE'   as import('@lendora/shared').ProductStatus,
    brand:             'Canon',
    model:             'EOS 5D Mark IV',
    district:          'Dhaka',
    division:          'Dhaka',
    address:           'Gulshan 2, Dhaka',
    availableFrom:     null,
    availableUntil:    null,
    minRentalDays:     1,
    maxRentalDays:     30,
    deliveryAvailable: true,
    deliveryFee:       200,
    specifications:    { sensor: 'Full-frame', megapixels: '30.4MP' },
    tags:              ['camera', 'photography', 'dslr'],
    totalRentals:      18,
    averageRating:     4.8,
    reviewCount:       12,
    quantity:          1,
    isInstantBooking:  false,
    media:             [{ id: asId<import('@lendora/shared').MediaId>('media-001'), productId: asId<ProductId>('product-001'), url: 'https://cdn.lendora.test/p1.webp', altText: null, sortOrder: 0, isPrimary: true }],
    createdAt:         new Date('2025-01-01'),
    updatedAt:         new Date('2025-01-01'),
    ...overrides,
  }
}

// ── Rental ────────────────────────────────────────────────────────────────────

export function buildRental(overrides: Partial<Rental> = {}): Rental {
  const startDate = new Date('2025-03-10T00:00:00.000Z')
  const endDate   = new Date('2025-03-14T23:59:59.999Z')
  return {
    id:                 asId<RentalId>('rental-001'),
    productId:          asId<ProductId>('product-001'),
    renterId:           asId<UserId>('user-001'),
    vendorId:           asId<VendorId>('vendor-001'),
    status:             'PENDING_CONFIRMATION' as import('@lendora/shared').RentalStatus,
    startDate,
    endDate,
    totalDays:          5,
    pricePerDay:        1500,
    rentalFee:          7500,
    depositAmount:      5000,
    depositStatus:      'HELD' as import('@lendora/shared').DepositStatus,
    platformFeeRate:    0.10,
    platformFee:        750,
    vendorPayout:       6750,
    deliveryFee:        0,
    totalAmount:        12500,
    deliveryAddress:    null,
    pickupAddress:      null,
    returnAddress:      null,
    renterNotes:        null,
    vendorNotes:        null,
    lateDays:           0,
    lateFeeAmount:      0,
    overdueNotifiedAt:  null,
    confirmedAt:        null,
    startedAt:          null,
    returnInitiatedAt:  null,
    returnReceivedAt:   null,
    completedAt:        null,
    cancelledAt:        null,
    cancellationReason: null,
    cancellationNote:   null,
    createdAt:          new Date('2025-03-08'),
    updatedAt:          new Date('2025-03-08'),
    ...overrides,
  }
}

// ── Payment ───────────────────────────────────────────────────────────────────

export function buildPayment(overrides: Partial<Payment> = {}): Payment {
  return {
    id:                   asId<PaymentId>('payment-001'),
    rentalId:             asId<RentalId>('rental-001'),
    payerId:              asId<UserId>('user-001'),
    type:                 'RENTAL_PAYMENT' as import('@lendora/shared').PaymentType,
    amount:               12500,
    currency:             'BDT',
    method:               'BKASH' as import('@lendora/shared').PaymentMethod,
    status:               'PENDING' as import('@lendora/shared').PaymentStatus,
    externalReference:    'GW-REF-001',
    gatewayTransactionId: null,
    gatewayResponse:      null,
    initiatedAt:          new Date('2025-03-08T10:00:00Z'),
    completedAt:          null,
    failedAt:             null,
    failureReason:        null,
    createdAt:            new Date('2025-03-08T10:00:00Z'),
    ...overrides,
  }
}

export function buildPayout(overrides: Partial<VendorPayout> = {}): VendorPayout {
  return {
    id:            'payout-001',
    vendorId:      asId<VendorId>('vendor-001'),
    rentalId:      asId<RentalId>('rental-001'),
    amount:        6750,
    method:        'BKASH' as import('@lendora/shared').PaymentMethod,
    status:        'PENDING' as import('@lendora/shared').TransactionStatus,
    processedAt:   null,
    failureReason: null,
    createdAt:     new Date('2025-03-15'),
    ...overrides,
  }
}
