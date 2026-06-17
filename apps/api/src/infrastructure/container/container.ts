/**
 * Manual dependency injection container.
 * Reason for manual DI over InversifyJS/TSyringe:
 * - Zero reflection metadata overhead
 * - Fully type-safe without decorators
 * - Explicit wiring is readable and debuggable
 * - No build-time transpiler complications
 *
 * Each use case is a factory function. The container is built once at startup
 * and injected into the Express request via middleware.
 */

import { prisma }                         from '@/infrastructure/database/prisma.client.js'
import { RedisCache }                      from '@/infrastructure/cache/redis.cache.js'
import { JwtTokenService }                 from '@/infrastructure/auth/jwt-token.service.js'
import { NodemailerEmailService }          from '@/infrastructure/email/nodemailer.service.js'
import { InMemoryEventBus }                from '@/infrastructure/events/in-memory.event-bus.js'
import { PrismaUserRepository }            from '@/infrastructure/database/repositories/user.repository.js'
import { PrismaProductRepository }         from '@/infrastructure/database/repositories/product.repository.js'
import { PrismaRentalRepository }          from '@/infrastructure/database/repositories/rental.repository.js'
import { PrismaVendorRepository }          from '@/infrastructure/database/repositories/vendor.repository.js'
import { PrismaCategoryRepository }        from '@/infrastructure/database/repositories/category.repository.js'
import { PrismaReviewRepository }          from '@/infrastructure/database/repositories/review.repository.js'
import { PrismaDisputeRepository }         from '@/infrastructure/database/repositories/dispute.repository.js'
import { PrismaPaymentRepository }         from '@/infrastructure/database/repositories/payment.repository.js'
import { BkashGatewayAdapter }             from '@/infrastructure/gateways/bkash.gateway.js'
import { NagadGatewayAdapter }             from '@/infrastructure/gateways/nagad.gateway.js'
import { RegisterUseCase }                 from '@/application/use-cases/auth/register.use-case.js'
import { LoginUseCase }                    from '@/application/use-cases/auth/login.use-case.js'
import { CreateRentalUseCase }             from '@/application/use-cases/rental/create-rental.use-case.js'
import { InitiateRentalPaymentUseCase }    from '@/application/use-cases/payment/initiate-rental-payment.use-case.js'
import { HandlePaymentCallbackUseCase }    from '@/application/use-cases/payment/handle-payment-callback.use-case.js'
import { ReleaseDepositUseCase }           from '@/application/use-cases/payment/release-deposit.use-case.js'
import { ProcessVendorPayoutUseCase }      from '@/application/use-cases/payment/process-vendor-payout.use-case.js'
import type { IPaymentGateway }            from '@/application/ports/services/payment-gateway.service.port.js'
import type { RentalId }                   from '@lendora/shared'

function buildContainer() {
  // ── Infrastructure ─────────────────────────────────────────────────────────
  const cache        = new RedisCache()
  const tokenService = new JwtTokenService()
  const emailService = new NodemailerEmailService()
  const eventBus     = new InMemoryEventBus()

  // ── Repositories ───────────────────────────────────────────────────────────
  const userRepo     = new PrismaUserRepository(prisma)
  const productRepo  = new PrismaProductRepository(prisma)
  const rentalRepo   = new PrismaRentalRepository(prisma)
  const vendorRepo   = new PrismaVendorRepository(prisma)
  const categoryRepo = new PrismaCategoryRepository(prisma)
  const reviewRepo   = new PrismaReviewRepository(prisma)
  const disputeRepo  = new PrismaDisputeRepository(prisma)
  const paymentRepo  = new PrismaPaymentRepository(prisma)

  // ── Payment Gateways ───────────────────────────────────────────────────────
  const bkashGateway = new BkashGatewayAdapter({
    appKey:    process.env['BKASH_APP_KEY']    ?? '',
    appSecret: process.env['BKASH_APP_SECRET'] ?? '',
    username:  process.env['BKASH_USERNAME']   ?? '',
    password:  process.env['BKASH_PASSWORD']   ?? '',
    baseUrl:   process.env['BKASH_BASE_URL']   ?? 'https://tokenized.sandbox.bka.sh/v1.2.0-beta',
  })

  const nagadGateway = new NagadGatewayAdapter({
    merchantId:     process.env['NAGAD_MERCHANT_ID']     ?? '',
    merchantNumber: process.env['NAGAD_MERCHANT_NUMBER'] ?? '',
    privateKey:     process.env['NAGAD_PRIVATE_KEY']     ?? '',
    nagadPublicKey: process.env['NAGAD_PUBLIC_KEY']      ?? '',
    baseUrl:        process.env['NAGAD_BASE_URL']        ?? 'https://api.mynagad.com',
    callbackHost:   process.env['SERVER_URL']            ?? 'http://localhost:4000',
  })

  const gatewayMap: Record<string, IPaymentGateway> = {
    BKASH: bkashGateway,
    NAGAD:  nagadGateway,
  }

  // Helper for use cases that need to look up the gateway used for a rental
  const getGatewayForRental = async (rentalId: RentalId): Promise<IPaymentGateway> => {
    const payments = await paymentRepo.findPaymentsByRental(rentalId)
    const method   = payments[0]?.method ?? 'BKASH'
    return gatewayMap[method.toString()] ?? bkashGateway
  }

  const serverUrl = process.env['SERVER_URL'] ?? 'http://localhost:4000'

  // ── Use Cases ──────────────────────────────────────────────────────────────
  const register     = new RegisterUseCase({ userRepo, tokenService, emailService, cache })
  const login        = new LoginUseCase({ userRepo, vendorRepo, tokenService })
  const createRental = new CreateRentalUseCase({ rentalRepo, productRepo, userRepo, eventBus, cache })

  const initiatePayment = (method: 'BKASH' | 'NAGAD') =>
    new InitiateRentalPaymentUseCase({
      paymentRepo,
      rentalRepo,
      gateway:   gatewayMap[method]!,
      serverUrl,
    })

  const handleBkashCallback  = new HandlePaymentCallbackUseCase({ paymentRepo, rentalRepo, gateway: bkashGateway })
  const handleNagadCallback  = new HandlePaymentCallbackUseCase({ paymentRepo, rentalRepo, gateway: nagadGateway })

  const releaseDeposit    = new ReleaseDepositUseCase({ paymentRepo, rentalRepo, getGatewayForRental })
  const processVendorPayout = new ProcessVendorPayoutUseCase({ paymentRepo, rentalRepo, vendorRepo })

  return {
    // Raw Prisma client (for use cases that need transactions)
    prisma,

    // Services
    tokenService,
    emailService,
    cache,
    eventBus,

    // Payment gateways (exposed for routes that need direct access)
    gateways: { bkash: bkashGateway, nagad: nagadGateway, map: gatewayMap },

    // Repositories
    repos: {
      user:     userRepo,
      product:  productRepo,
      rental:   rentalRepo,
      vendor:   vendorRepo,
      category: categoryRepo,
      review:   reviewRepo,
      dispute:  disputeRepo,
      payment:  paymentRepo,
    },

    // Use cases
    auth:   { register, login },
    rental: { createRental },
    payment: {
      initiatePayment,
      handleBkashCallback,
      handleNagadCallback,
      releaseDeposit,
      processVendorPayout,
    },
  } as const
}

export type AppContainer = ReturnType<typeof buildContainer>

let instance: AppContainer | null = null

export function getContainer(): AppContainer {
  if (!instance) instance = buildContainer()
  return instance
}
