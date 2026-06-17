import { describe, it, expect, vi, beforeEach } from 'vitest'
import { InitiateRentalPaymentUseCase } from '../../../../src/application/use-cases/payment/initiate-rental-payment.use-case.js'
import { mockRentalRepo, mockPaymentRepo } from '../../../factories/mock.repositories.js'
import { mockPaymentGateway } from '../../../factories/mock.services.js'
import { buildRental, buildPayment } from '../../../factories/entity.builders.js'
import { DomainError } from '../../../../src/domain/errors/index.js'
import { asId } from '@lendora/shared'
import type { RentalId, UserId } from '@lendora/shared'

const RENTER_ID  = asId<UserId>('user-001')
const RENTAL_ID  = asId<RentalId>('rental-001')
const SERVER_URL = 'https://api.lendora.test'

describe('InitiateRentalPaymentUseCase', () => {
  let rentalRepo:  ReturnType<typeof mockRentalRepo>
  let paymentRepo: ReturnType<typeof mockPaymentRepo>
  let gateway:     ReturnType<typeof mockPaymentGateway>
  let useCase:     InitiateRentalPaymentUseCase

  beforeEach(() => {
    rentalRepo  = mockRentalRepo()
    paymentRepo = mockPaymentRepo()
    gateway     = mockPaymentGateway()
    useCase     = new InitiateRentalPaymentUseCase({ paymentRepo, rentalRepo, gateway, serverUrl: SERVER_URL })

    rentalRepo.findById.mockResolvedValue(buildRental())
    paymentRepo.findPayments.mockResolvedValue({ items: [], total: 0 })
    paymentRepo.createPayment.mockResolvedValue(buildPayment())
  })

  // ── Happy path ─────────────────────────────────────────────────────────────

  it('returns a redirectUrl from the gateway', async () => {
    const result = await useCase.execute({ rentalId: RENTAL_ID, userId: RENTER_ID, method: 'BKASH' })

    expect(result.redirectUrl).toBe('https://sandbox.bkash.com/pay/abc123')
  })

  it('creates a PENDING payment record with the gateway ref', async () => {
    await useCase.execute({ rentalId: RENTAL_ID, userId: RENTER_ID, method: 'BKASH' })

    expect(paymentRepo.createPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        status:            'PENDING',
        externalReference: 'GW-REF-001',
        method:            'BKASH',
      }),
    )
  })

  it('sends a merchantRef derived from the rental id to the gateway', async () => {
    await useCase.execute({ rentalId: RENTAL_ID, userId: RENTER_ID, method: 'BKASH' })

    const gatewayArg = gateway.initiatePayment.mock.calls[0]![0]
    expect(gatewayArg.merchantRef).toMatch(/^LENDORA-rental-001-/)
  })

  it('uses totalAmount from the rental (rentalFee + deposit + delivery)', async () => {
    // buildRental sets totalAmount: 12500
    await useCase.execute({ rentalId: RENTAL_ID, userId: RENTER_ID, method: 'BKASH' })

    expect(gateway.initiatePayment.mock.calls[0]![0].amount).toBe(12500)
  })

  it('passes payerPhone to the gateway when provided', async () => {
    await useCase.execute({ rentalId: RENTAL_ID, userId: RENTER_ID, method: 'BKASH', payerPhone: '01700000001' })

    expect(gateway.initiatePayment.mock.calls[0]![0].payerPhone).toBe('01700000001')
  })

  // ── Guards ─────────────────────────────────────────────────────────────────

  it('throws DomainError when rental is not found', async () => {
    rentalRepo.findById.mockResolvedValue(null)

    await expect(
      useCase.execute({ rentalId: RENTAL_ID, userId: RENTER_ID, method: 'BKASH' }),
    ).rejects.toThrow(DomainError)
  })

  it('throws DomainError when caller is not the renter', async () => {
    await expect(
      useCase.execute({ rentalId: RENTAL_ID, userId: asId<UserId>('other-user'), method: 'BKASH' }),
    ).rejects.toThrow(DomainError)
  })

  it('throws DomainError when rental is already CONFIRMED', async () => {
    rentalRepo.findById.mockResolvedValue(buildRental({ status: 'CONFIRMED' as any }))

    await expect(
      useCase.execute({ rentalId: RENTAL_ID, userId: RENTER_ID, method: 'BKASH' }),
    ).rejects.toThrow(DomainError)
  })

  it('throws DomainError when a pending payment already exists (prevents duplicates)', async () => {
    paymentRepo.findPayments.mockResolvedValue({ items: [buildPayment()], total: 1 })

    await expect(
      useCase.execute({ rentalId: RENTAL_ID, userId: RENTER_ID, method: 'BKASH' }),
    ).rejects.toMatchObject({ code: 'PAYMENT_EXISTS' })
  })
})
