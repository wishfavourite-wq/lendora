import { vi } from 'vitest'
import type { ITokenService }  from '../../src/application/ports/services/token.service.port.js'
import type { ICacheService }  from '../../src/application/ports/services/cache.service.port.js'
import type { IEventBus }      from '../../src/application/ports/services/event-bus.service.port.js'
import type {
  IPaymentGateway, PaymentInitResult, PaymentVerifyResult, RefundResult,
} from '../../src/application/ports/services/payment-gateway.service.port.js'

type Mocked<T> = { [K in keyof T]: T[K] extends (...args: infer A) => infer R ? ReturnType<typeof vi.fn<A, R>> : T[K] }

export function mockTokenService(): Mocked<ITokenService> {
  return {
    generateTokenPair:  vi.fn(),
    verifyAccessToken:  vi.fn(),
    verifyRefreshToken: vi.fn(),
    hashToken:          vi.fn(),
    compareToken:       vi.fn(),
  } as unknown as Mocked<ITokenService>
}

export function mockCacheService(): Mocked<ICacheService> {
  return {
    get:        vi.fn().mockResolvedValue(null),
    set:        vi.fn().mockResolvedValue(undefined),
    del:        vi.fn().mockResolvedValue(undefined),
    delPattern: vi.fn().mockResolvedValue(undefined),
    exists:     vi.fn().mockResolvedValue(false),
    increment:  vi.fn().mockResolvedValue(1),
    setNX:      vi.fn().mockResolvedValue(true),
  } as unknown as Mocked<ICacheService>
}

export function mockEventBus(): Mocked<IEventBus> {
  return {
    publish:   vi.fn().mockResolvedValue(undefined),
    subscribe: vi.fn(),
  } as unknown as Mocked<IEventBus>
}

export function mockPaymentGateway(
  overrides: Partial<{
    initiateResult: PaymentInitResult
    verifyResult:   PaymentVerifyResult
    refundResult:   RefundResult
  }> = {},
): Mocked<IPaymentGateway> {
  const defaultInit: PaymentInitResult = {
    gatewayRef:  'GW-REF-001',
    redirectUrl: 'https://sandbox.bkash.com/pay/abc123',
    raw:         { paymentID: 'GW-REF-001' },
  }
  const defaultVerify: PaymentVerifyResult = {
    gatewayRef:           'GW-REF-001',
    gatewayTransactionId: 'TRX-001',
    status:               'SUCCESS',
    amount:               1500,
    raw:                  { trxID: 'TRX-001', transactionStatus: 'Completed' },
  }
  const defaultRefund: RefundResult = {
    refundTransactionId: 'REFUND-001',
    status:              'SUCCESS',
    raw:                 { refundTrxID: 'REFUND-001' },
  }

  return {
    gatewayName:     'BKASH',
    initiatePayment: vi.fn().mockResolvedValue(overrides.initiateResult ?? defaultInit),
    verifyCallback:  vi.fn().mockResolvedValue(overrides.verifyResult  ?? defaultVerify),
    refund:          vi.fn().mockResolvedValue(overrides.refundResult  ?? defaultRefund),
  } as unknown as Mocked<IPaymentGateway>
}
