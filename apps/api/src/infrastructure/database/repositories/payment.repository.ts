import type { PrismaClient, Prisma } from '@prisma/client'
import type {
  IPaymentRepository, FindPaymentsOptions, FindPayoutsOptions,
} from '@/application/ports/repositories/payment.repository.port.js'
import type { Payment, PaymentId, VendorPayout, RentalId, UserId, VendorId } from '@lendora/shared'
import type { PaymentStatus, PaymentMethod } from '@lendora/shared'
import { asId } from '@lendora/shared'

type PrismaPayment  = Prisma.PaymentGetPayload<Record<string, never>>
type PrismaPayout   = Prisma.VendorPayoutGetPayload<Record<string, never>>

export class PrismaPaymentRepository implements IPaymentRepository {
  constructor(private readonly db: PrismaClient) {}

  // ── Payments ──────────────────────────────────────────────────────────────

  async findPaymentById(id: PaymentId): Promise<Payment | null> {
    const row = await this.db.payment.findUnique({ where: { id } })
    return row ? this.mapPayment(row) : null
  }

  async findPaymentByExternalRef(ref: string): Promise<Payment | null> {
    const row = await this.db.payment.findUnique({ where: { externalReference: ref } })
    return row ? this.mapPayment(row) : null
  }

  async findPaymentsByRental(rentalId: RentalId): Promise<Payment[]> {
    const rows = await this.db.payment.findMany({
      where:   { rentalId },
      orderBy: { createdAt: 'asc' },
    })
    return rows.map((r) => this.mapPayment(r))
  }

  async findPayments(opts: FindPaymentsOptions): Promise<{ items: Payment[]; total: number }> {
    const where: Prisma.PaymentWhereInput = {
      ...(opts.userId   && { payerId:  opts.userId }),
      ...(opts.rentalId && { rentalId: opts.rentalId }),
      ...(opts.status   && { status:   opts.status }),
      ...(opts.method   && { method:   opts.method }),
      ...(opts.from     && { createdAt: { gte: opts.from } }),
      ...(opts.until    && { createdAt: { lte: opts.until } }),
    }
    const page  = opts.page  ?? 1
    const limit = opts.limit ?? 20
    const [rows, total] = await this.db.$transaction([
      this.db.payment.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
      this.db.payment.count({ where }),
    ])
    return { items: rows.map((r) => this.mapPayment(r)), total }
  }

  async createPayment(data: Omit<Payment, 'id' | 'createdAt'>): Promise<Payment> {
    const row = await this.db.payment.create({
      data: {
        rentalId:            data.rentalId,
        payerId:             data.payerId,
        type:                data.type as import('@prisma/client').PaymentType,
        amount:              data.amount,
        currency:            data.currency,
        method:              data.method as import('@prisma/client').PaymentMethod,
        status:              data.status as import('@prisma/client').PaymentStatus,
        externalReference:   data.externalReference   ?? undefined,
        gatewayTransactionId: data.gatewayTransactionId ?? undefined,
        gatewayResponse:     data.gatewayResponse      ?? undefined,
        initiatedAt:         data.initiatedAt,
        completedAt:         data.completedAt          ?? undefined,
        failedAt:            data.failedAt             ?? undefined,
        failureReason:       data.failureReason        ?? undefined,
      },
    })
    return this.mapPayment(row)
  }

  async updatePaymentStatus(
    id:     PaymentId,
    status: PaymentStatus,
    meta?:  {
      gatewayTransactionId?: string
      gatewayResponse?:      Record<string, unknown>
      completedAt?:          Date
      failedAt?:             Date
      failureReason?:        string
    },
  ): Promise<Payment> {
    const row = await this.db.payment.update({
      where: { id },
      data:  {
        status,
        ...(meta?.gatewayTransactionId && { gatewayTransactionId: meta.gatewayTransactionId }),
        ...(meta?.gatewayResponse      && { gatewayResponse:      meta.gatewayResponse }),
        ...(meta?.completedAt          && { completedAt:          meta.completedAt }),
        ...(meta?.failedAt             && { failedAt:             meta.failedAt }),
        ...(meta?.failureReason        && { failureReason:        meta.failureReason }),
      },
    })
    return this.mapPayment(row)
  }

  // ── Payouts ───────────────────────────────────────────────────────────────

  async findPayoutById(id: string): Promise<VendorPayout | null> {
    const row = await this.db.vendorPayout.findUnique({ where: { id } })
    return row ? this.mapPayout(row) : null
  }

  async findPayoutByRentalId(rentalId: RentalId): Promise<VendorPayout | null> {
    const row = await this.db.vendorPayout.findFirst({ where: { rentalId }, orderBy: { createdAt: 'desc' } })
    return row ? this.mapPayout(row) : null
  }

  async findPayouts(opts: FindPayoutsOptions): Promise<{ items: VendorPayout[]; total: number }> {
    const where: Prisma.VendorPayoutWhereInput = {
      ...(opts.vendorId && { vendorId: opts.vendorId }),
      ...(opts.status   && { status:   opts.status }),
      ...(opts.from     && { createdAt: { gte: opts.from } }),
      ...(opts.until    && { createdAt: { lte: opts.until } }),
    }
    const page  = opts.page  ?? 1
    const limit = opts.limit ?? 20
    const [rows, total] = await this.db.$transaction([
      this.db.vendorPayout.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
      this.db.vendorPayout.count({ where }),
    ])
    return { items: rows.map((r) => this.mapPayout(r)), total }
  }

  async createPayout(data: Omit<VendorPayout, 'id' | 'createdAt'>): Promise<VendorPayout> {
    const row = await this.db.vendorPayout.create({
      data: {
        vendorId:       data.vendorId,
        rentalId:       data.rentalId,
        amount:         data.amount,
        method:         data.method as import('@prisma/client').PaymentMethod,
        status:         data.status ?? 'PENDING',
        transactionRef: data.transactionRef ?? undefined,
        processedAt:    data.processedAt   ?? undefined,
        failureReason:  data.failureReason ?? undefined,
      },
    })
    return this.mapPayout(row)
  }

  async updatePayoutStatus(
    id:     string,
    status: string,
    meta?:  { transactionRef?: string; processedAt?: Date; failureReason?: string },
  ): Promise<VendorPayout> {
    const row = await this.db.vendorPayout.update({
      where: { id },
      data:  {
        status,
        ...(meta?.transactionRef && { transactionRef: meta.transactionRef }),
        ...(meta?.processedAt    && { processedAt:    meta.processedAt }),
        ...(meta?.failureReason  && { failureReason:  meta.failureReason }),
      },
    })
    return this.mapPayout(row)
  }

  async sumEarningsByVendor(vendorId: VendorId, from: Date, until: Date): Promise<number> {
    const result = await this.db.vendorPayout.aggregate({
      _sum:  { amount: true },
      where: { vendorId, status: 'SUCCESS', createdAt: { gte: from, lte: until } },
    })
    return Number(result._sum.amount ?? 0)
  }

  async getPendingPayoutTotal(vendorId: VendorId): Promise<number> {
    const result = await this.db.vendorPayout.aggregate({
      _sum:  { amount: true },
      where: { vendorId, status: 'PENDING' },
    })
    return Number(result._sum.amount ?? 0)
  }

  private mapPayment(row: PrismaPayment): Payment {
    return {
      id:                   asId<PaymentId>(row.id),
      rentalId:             asId<RentalId>(row.rentalId),
      payerId:              asId<UserId>(row.payerId),
      type:                 row.type    as import('@lendora/shared').PaymentType,
      amount:               Number(row.amount),
      currency:             row.currency as 'BDT',
      method:               row.method  as PaymentMethod,
      status:               row.status  as PaymentStatus,
      externalReference:    row.externalReference    ?? null,
      gatewayTransactionId: row.gatewayTransactionId ?? null,
      gatewayResponse:      row.gatewayResponse      as Record<string, unknown> | null,
      initiatedAt:          row.initiatedAt,
      completedAt:          row.completedAt  ?? null,
      failedAt:             row.failedAt     ?? null,
      failureReason:        row.failureReason ?? null,
      createdAt:            row.createdAt,
    }
  }

  private mapPayout(row: PrismaPayout): VendorPayout {
    return {
      id:             row.id,
      vendorId:       asId<VendorId>(row.vendorId),
      rentalId:       asId<RentalId>(row.rentalId),
      amount:         Number(row.amount),
      method:         row.method  as PaymentMethod,
      status:         row.status  as import('@lendora/shared').TransactionStatus,
      transactionRef: row.transactionRef ?? null,
      processedAt:    row.processedAt  ?? null,
      failureReason:  row.failureReason ?? null,
      createdAt:      row.createdAt,
    }
  }
}
