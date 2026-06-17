import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ReleaseDepositUseCase } from '../../../../src/application/use-cases/payment/release-deposit.use-case.js'
import { mockRentalRepo, mockPaymentRepo } from '../../../factories/mock.repositories.js'
import { mockPaymentGateway } from '../../../factories/mock.services.js'
import { buildRental, buildPayment } from '../../../factories/entity.builders.js'
import { DomainError } from '../../../../src/domain/errors/index.js'
import { asId } from '@lendora/shared'
import type { RentalId } from '@lendora/shared'

const RENTAL_ID = asId<RentalId>('rental-001')

describe('ReleaseDepositUseCase', () => {
  let rentalRepo:          ReturnType<typeof mockRentalRepo>
  let paymentRepo:         ReturnType<typeof mockPaymentRepo>
  let gateway:             ReturnType<typeof mockPaymentGateway>
  let getGatewayForRental: ReturnType<typeof vi.fn>
  let useCase:             ReleaseDepositUseCase

  const completedRental = buildRental({
    status:        'RETURN_CONFIRMED' as any,
    depositAmount: 5000,
    returnedAt:    new Date('2025-03-15'),
  })

  const completedPayment = buildPayment({
    status:               'COMPLETED' as any,
    gatewayTransactionId: 'TRX-001',
  })

  beforeEach(() => {
    rentalRepo          = mockRentalRepo()
    paymentRepo         = mockPaymentRepo()
    gateway             = mockPaymentGateway()
    getGatewayForRental = vi.fn().mockResolvedValue(gateway)

    useCase = new ReleaseDepositUseCase({ paymentRepo, rentalRepo, getGatewayForRental })

    rentalRepo.findById.mockResolvedValue(completedRental)
    // No prior DEPOSIT_REFUND payment
    paymentRepo.findPayments.mockResolvedValue({ items: [], total: 0 })
    paymentRepo.findPaymentsByRental.mockResolvedValue([completedPayment])
    paymentRepo.createPayment.mockImplementation(async (data) => buildPayment(data as any))
    rentalRepo.updateStatus.mockResolvedValue(completedRental)
  })

  // ── Full refund (no damage) ────────────────────────────────────────────────

  it('creates a DEPOSIT_REFUND payment for the full deposit when deduction=0', async () => {
    const result = await useCase.execute({ rentalId: RENTAL_ID, deduction: 0 })

    expect(result.amountRefunded).toBe(5000)
    expect(result.amountDeducted).toBe(0)
    expect(result.deductionPayment).toBeNull()
    expect(gateway.refund).toHaveBeenCalledWith('TRX-001', 5000, expect.any(String))
  })

  // ── Partial damage deduction ───────────────────────────────────────────────

  it('creates both a DAMAGE_DEDUCTION and DEPOSIT_REFUND record on partial deduction', async () => {
    const result = await useCase.execute({ rentalId: RENTAL_ID, deduction: 1500 })

    expect(result.amountDeducted).toBe(1500)
    expect(result.amountRefunded).toBe(3500)
    expect(result.deductionPayment).not.toBeNull()
    expect(result.refundPayment).not.toBeNull()

    // Refund gateway called with the partial amount
    expect(gateway.refund).toHaveBeenCalledWith('TRX-001', 3500, expect.any(String))
  })

  it('caps deduction at the deposit amount when deduction > deposit', async () => {
    const result = await useCase.execute({ rentalId: RENTAL_ID, deduction: 99_999 })

    expect(result.amountDeducted).toBe(5000) // capped
    expect(result.amountRefunded).toBe(0)    // nothing to refund
    expect(gateway.refund).not.toHaveBeenCalled()
  })

  // ── Gateway refund failure — graceful degradation ─────────────────────────

  it('records refund payment as FAILED when gateway refund throws', async () => {
    gateway.refund.mockRejectedValue(new Error('Gateway timeout'))

    const result = await useCase.execute({ rentalId: RENTAL_ID, deduction: 0 })

    // Should not throw — failure is recorded, not propagated
    expect(result.refundPayment).not.toBeNull()
    const refundCall = paymentRepo.createPayment.mock.calls.find(
      ([d]: any) => d.type === 'DEPOSIT_REFUND',
    )
    expect(refundCall![0].status).toBe('FAILED')
    expect(refundCall![0].failureReason).toMatch(/manual/)
  })

  // ── Idempotency ────────────────────────────────────────────────────────────

  it('throws DomainError when deposit has already been released', async () => {
    paymentRepo.findPayments.mockResolvedValue({
      items: [buildPayment({ type: 'DEPOSIT_REFUND' as any, status: 'COMPLETED' as any })],
      total: 1,
    })

    await expect(
      useCase.execute({ rentalId: RENTAL_ID, deduction: 0 }),
    ).rejects.toMatchObject({ code: 'DEPOSIT_ALREADY_RELEASED' })
  })

  // ── State guards ───────────────────────────────────────────────────────────

  it('throws DomainError when rental is still ACTIVE', async () => {
    rentalRepo.findById.mockResolvedValue(buildRental({ status: 'ACTIVE' as any }))

    await expect(
      useCase.execute({ rentalId: RENTAL_ID, deduction: 0 }),
    ).rejects.toThrow(DomainError)
  })

  it('throws DomainError when rental is not found', async () => {
    rentalRepo.findById.mockResolvedValue(null)

    await expect(
      useCase.execute({ rentalId: RENTAL_ID, deduction: 0 }),
    ).rejects.toThrow(DomainError)
  })

  // ── Rental status advancement ──────────────────────────────────────────────

  it('advances rental to COMPLETED after successful deposit release', async () => {
    await useCase.execute({ rentalId: RENTAL_ID, deduction: 0 })

    expect(rentalRepo.updateStatus).toHaveBeenCalledWith(RENTAL_ID, 'COMPLETED')
  })

  it('does not update status again when rental is already COMPLETED', async () => {
    rentalRepo.findById.mockResolvedValue(
      buildRental({ status: 'COMPLETED' as any, returnedAt: new Date() }),
    )

    await useCase.execute({ rentalId: RENTAL_ID, deduction: 0 })

    expect(rentalRepo.updateStatus).not.toHaveBeenCalled()
  })
})
