import { describe, it, expect, vi, beforeEach } from 'vitest'
import { HandlePaymentCallbackUseCase } from '../../../../src/application/use-cases/payment/handle-payment-callback.use-case.js'
import { mockRentalRepo, mockPaymentRepo } from '../../../factories/mock.repositories.js'
import { mockPaymentGateway } from '../../../factories/mock.services.js'
import { buildPayment, buildRental } from '../../../factories/entity.builders.js'
import { DomainError } from '../../../../src/domain/errors/index.js'
import { asId } from '@lendora/shared'
import type { PaymentId } from '@lendora/shared'

const SUCCESS_PARAMS  = { paymentID: 'GW-REF-001', status: 'success' }
const CANCELLED_PARAMS = { paymentID: 'GW-REF-001', status: 'cancel' }
const FAILURE_PARAMS  = { paymentID: 'GW-REF-001', status: 'failure' }

describe('HandlePaymentCallbackUseCase', () => {
  let rentalRepo:  ReturnType<typeof mockRentalRepo>
  let paymentRepo: ReturnType<typeof mockPaymentRepo>
  let gateway:     ReturnType<typeof mockPaymentGateway>
  let useCase:     HandlePaymentCallbackUseCase

  beforeEach(() => {
    rentalRepo  = mockRentalRepo()
    paymentRepo = mockPaymentRepo()
    gateway     = mockPaymentGateway()
    useCase     = new HandlePaymentCallbackUseCase({ paymentRepo, rentalRepo, gateway })

    paymentRepo.findPaymentByExternalRef.mockResolvedValue(buildPayment())
    paymentRepo.updatePaymentStatus.mockImplementation(async (_id, status, meta) =>
      buildPayment({ status: status as any, ...meta }),
    )
    rentalRepo.updateStatus.mockResolvedValue(buildRental({ status: 'CONFIRMED' as any }))
  })

  // ── Successful payment ─────────────────────────────────────────────────────

  it('marks payment as COMPLETED on SUCCESS callback', async () => {
    const result = await useCase.execute({ params: SUCCESS_PARAMS })

    expect(result.success).toBe(true)
    expect(paymentRepo.updatePaymentStatus).toHaveBeenCalledWith(
      expect.anything(),
      'COMPLETED',
      expect.objectContaining({
        gatewayTransactionId: 'TRX-001',
        completedAt:          expect.any(Date),
      }),
    )
  })

  it('advances rental status to CONFIRMED on success', async () => {
    await useCase.execute({ params: SUCCESS_PARAMS })

    expect(rentalRepo.updateStatus).toHaveBeenCalledWith(
      expect.anything(),
      'CONFIRMED',
    )
  })

  // ── Failed / cancelled ─────────────────────────────────────────────────────

  it('marks payment as CANCELLED and does not advance rental', async () => {
    gateway.verifyCallback.mockResolvedValue({
      gatewayRef: 'GW-REF-001', gatewayTransactionId: '', status: 'CANCELLED', amount: 0, raw: {},
    })

    const result = await useCase.execute({ params: CANCELLED_PARAMS })

    expect(result.success).toBe(false)
    expect(paymentRepo.updatePaymentStatus).toHaveBeenCalledWith(
      expect.anything(), 'CANCELLED', expect.anything(),
    )
    expect(rentalRepo.updateStatus).not.toHaveBeenCalled()
  })

  it('marks payment as FAILED and does not advance rental', async () => {
    gateway.verifyCallback.mockResolvedValue({
      gatewayRef: 'GW-REF-001', gatewayTransactionId: '', status: 'FAILED', amount: 0, raw: {},
    })

    const result = await useCase.execute({ params: FAILURE_PARAMS })

    expect(result.success).toBe(false)
    expect(paymentRepo.updatePaymentStatus).toHaveBeenCalledWith(
      expect.anything(), 'FAILED', expect.anything(),
    )
    expect(rentalRepo.updateStatus).not.toHaveBeenCalled()
  })

  // ── Idempotency ────────────────────────────────────────────────────────────

  it('returns the existing payment without re-processing when already COMPLETED', async () => {
    paymentRepo.findPaymentByExternalRef.mockResolvedValue(
      buildPayment({ status: 'COMPLETED' as any }),
    )

    const result = await useCase.execute({ params: SUCCESS_PARAMS })

    expect(result.success).toBe(true)
    // Must NOT call updatePaymentStatus again on an already-completed payment
    expect(paymentRepo.updatePaymentStatus).not.toHaveBeenCalled()
    expect(rentalRepo.updateStatus).not.toHaveBeenCalled()
  })

  it('returns success=false without re-processing when already FAILED', async () => {
    paymentRepo.findPaymentByExternalRef.mockResolvedValue(
      buildPayment({ status: 'FAILED' as any }),
    )

    const result = await useCase.execute({ params: SUCCESS_PARAMS })

    expect(result.success).toBe(false)
    expect(paymentRepo.updatePaymentStatus).not.toHaveBeenCalled()
  })

  // ── Not found ──────────────────────────────────────────────────────────────

  it('throws DomainError when gateway ref has no matching payment record', async () => {
    paymentRepo.findPaymentByExternalRef.mockResolvedValue(null)

    await expect(
      useCase.execute({ params: SUCCESS_PARAMS }),
    ).rejects.toThrow(DomainError)
  })
})
