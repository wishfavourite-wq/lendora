import type { IUserRepository }  from '@/application/ports/repositories/user.repository.port.js'
import type { ITokenService }    from '@/application/ports/services/token.service.port.js'
import type { IEmailService }    from '@/application/ports/services/email.service.port.js'
import type { ICacheService }    from '@/application/ports/services/cache.service.port.js'
import type { RegisterInput, AuthTokenPair } from '@lendora/shared'
import { UserRole, UserStatus } from '@lendora/shared'
import { ConflictError }         from '@/domain/errors/index.js'
import bcrypt from 'bcryptjs'
import { randomBytes }           from 'node:crypto'

interface Deps {
  userRepo:     IUserRepository
  tokenService: ITokenService
  emailService: IEmailService
  cache:        ICacheService
}

interface RegisterResult {
  tokens:        AuthTokenPair
  user:          { id: string; email: string; name: string; role: string; avatarUrl: string | null }
  requiresEmail: boolean
}

export class RegisterUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: RegisterInput & { role?: string }): Promise<RegisterResult> {
    const { userRepo, tokenService, emailService } = this.deps

    const existing = await userRepo.findByEmail(input.email)
    if (existing) throw new ConflictError('Email is already registered', 'email')

    const passwordHash = await bcrypt.hash(input.password, 12)
    const verifyToken  = randomBytes(32).toString('hex')

    const role = input.role === 'VENDOR' ? UserRole.VENDOR : UserRole.CUSTOMER

    const user = await userRepo.create({
      email:            input.email,
      emailVerifiedAt:  null,
      phone:            input.phone ?? null,
      phoneVerifiedAt:  null,
      passwordHash,
      name:             input.name,
      avatarUrl:        null,
      role,
      status:           UserStatus.ACTIVE,
      refreshTokenHash: null,
      resetToken:       null,
      resetTokenExpiry: null,
      emailVerifyToken: verifyToken,
      lastLoginAt:      null,
    })

    const tokens  = await tokenService.generateTokenPair(user.id, user.role, user.email)
    const rtHash  = await tokenService.hashToken(tokens.refreshToken)
    await userRepo.updateRefreshToken(user.id, rtHash)

    // Best-effort email — fails silently when SMTP is not configured
    const verifyUrl = `${process.env['APP_URL']}/verify-email?token=${verifyToken}`
    await emailService.sendEmailVerification(user.email, user.name, verifyUrl)

    return {
      tokens,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, avatarUrl: user.avatarUrl ?? null },
      requiresEmail: false,
    }
  }
}
