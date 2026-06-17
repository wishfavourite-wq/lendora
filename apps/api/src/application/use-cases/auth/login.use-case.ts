import type { IUserRepository }   from '@/application/ports/repositories/user.repository.port.js'
import type { IVendorRepository } from '@/application/ports/repositories/vendor.repository.port.js'
import type { ITokenService }     from '@/application/ports/services/token.service.port.js'
import type { LoginInput, AuthTokenPair, User } from '@lendora/shared'
import { UserStatus, UserRole } from '@lendora/shared'
import {
  UnauthorizedError, ForbiddenError,
} from '@/domain/errors/index.js'
import { DomainError } from '@/domain/errors/domain.error.js'
import bcrypt from 'bcryptjs'

interface Deps {
  userRepo:     IUserRepository
  vendorRepo:   IVendorRepository
  tokenService: ITokenService
}

interface LoginResult {
  tokens: AuthTokenPair
  user:   Omit<User, never>
}

export class LoginUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: LoginInput): Promise<LoginResult> {
    const { userRepo, vendorRepo, tokenService } = this.deps

    const user = await userRepo.findByEmailWithPassword(input.email)
    if (!user) throw new UnauthorizedError('Invalid email or password')

    const passwordMatch = await bcrypt.compare(input.password, user.passwordHash)
    if (!passwordMatch) throw new UnauthorizedError('Invalid email or password')

    // ── Customer status checks ────────────────────────────────────────────────
    if (user.role === UserRole.CUSTOMER) {
      switch (user.status) {
        case UserStatus.PENDING_VERIFICATION:
          throw new DomainError('CUSTOMER_PENDING' as any, 'Your account is awaiting admin verification.', 403)
        case UserStatus.SUSPENDED:
          throw new DomainError('CUSTOMER_REJECTED' as any, 'Your account verification was rejected. Please contact support.', 403)
        case UserStatus.BANNED:
          throw new ForbiddenError('Your account has been permanently banned')
      }
    }

    // ── Generic status checks (non-customer roles) ────────────────────────────
    if (user.role !== UserRole.CUSTOMER) {
      switch (user.status) {
        case UserStatus.BANNED:
          throw new ForbiddenError('Your account has been permanently banned')
        case UserStatus.SUSPENDED:
          throw new ForbiddenError('Your account is temporarily suspended')
      }
    }

    // ── Vendor-specific status check (vendor profile) ────────────────────────
    if (user.role === UserRole.VENDOR) {
      const vendorProfile = await vendorRepo.findByUserId(user.id as any)
      if (vendorProfile) {
        switch (vendorProfile.status) {
          case 'PENDING_VERIFICATION':
            throw new DomainError('VENDOR_PENDING' as any, 'Your account is waiting for Admin approval.', 403)
          case 'SUSPENDED':
            throw new DomainError(
              'VENDOR_SUSPENDED' as any,
              vendorProfile.suspensionReason
                ? `Your vendor account has been suspended. Reason: ${vendorProfile.suspensionReason}`
                : 'Your vendor account has been suspended.',
              403,
            )
          case 'BANNED':
            throw new DomainError('VENDOR_BANNED' as any, 'Your vendor account has been permanently banned.', 403)
        }
      }
    }

    const tokens = await tokenService.generateTokenPair(user.id, user.role, user.email)
    const rtHash = await tokenService.hashToken(tokens.refreshToken)
    await userRepo.updateRefreshToken(user.id, rtHash)
    await userRepo.update(user.id, { lastLoginAt: new Date() })

    const { passwordHash: _, refreshTokenHash: __, resetToken: ___, emailVerifyToken: ____, ...safeUser } = user

    return { tokens, user: safeUser }
  }
}
