import type { Payment, PaymentId, RentalId, UserId, VendorId, VendorPayout } from '@lendora/shared'
import type { PaymentStatus, PaymentMethod, TransactionStatus } from '@lendora/shared'

export interface FindPaymentsOptions {
  userId?:   UserId
  rentalId?: RentalId
  status?:   PaymentStatus
  method?:   PaymentMethod
  from?:     Date
  until?:    Date
  page?:     number
  limit?:    number
}

export interface FindPayoutsOptions {
  vendorId?: VendorId
  status?:   TransactionStatus | string
  from?:     Date
  until?:    Date
  page?:     number
  limit?:    number
}

export interface IPaymentRepository {
  // ── Payments ───────────────────────────────────────────────────────────────
  findPaymentById(id: PaymentId): Promise<Payment | null>
  findPaymentByExternalRef(ref: string): Promise<Payment | null>
  findPaymentsByRental(rentalId: RentalId): Promise<Payment[]>
  findPayments(opts: FindPaymentsOptions): Promise<{ items: Payment[]; total: number }>

  createPayment(data: Omit<Payment, 'id' | 'createdAt'>): Promise<Payment>
  updatePaymentStatus(
    id:     PaymentId,
    status: PaymentStatus,
    meta?:  {
      gatewayTransactionId?: string
      gatewayResponse?:      Record<string, unknown>
      completedAt?:          Date
      failedAt?:             Date
      failureReason?:        string
    },
  ): Promise<Payment>

  // ── Payouts ────────────────────────────────────────────────────────────────
  findPayoutById(id: string): Promise<VendorPayout | null>
  findPayoutByRentalId(rentalId: RentalId): Promise<VendorPayout | null>
  findPayouts(opts: FindPayoutsOptions): Promise<{ items: VendorPayout[]; total: number }>

  createPayout(data: Omit<VendorPayout, 'id' | 'createdAt'>): Promise<VendorPayout>
  updatePayoutStatus(
    id:     string,
    status: string,
    meta?:  { transactionRef?: string; processedAt?: Date; failureReason?: string },
  ): Promise<VendorPayout>

  sumEarningsByVendor(vendorId: VendorId, from: Date, until: Date): Promise<number>
  getPendingPayoutTotal(vendorId: VendorId): Promise<number>
}
