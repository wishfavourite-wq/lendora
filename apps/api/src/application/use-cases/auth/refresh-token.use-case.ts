import type { IUserRepository }  from '@/application/ports/repositories/user.repository.port.js'
import type { ITokenService }    from '@/application/ports/services/token.service.port.js'
import type { ICacheService }    from '@/application/ports/services/cache.service.port.js'
import { DomainError }           from '@/domain/errors/index.js'
import bcrypt                    from 'bcryptjs'

interface Deps {
  userRepo:     IUserRepository
  tokenService: ITokenService
  cache:        ICacheService
}

interface RefreshTokenInput {
  refreshToken: string
}

interface AuthTokens {
  accessToken:  string
  refreshToken: string
}

export class RefreshTokenUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: RefreshTokenInput): Promise<AuthTokens> {
    const payload = await this.deps.tokenService.verifyRefreshToken(input.refreshToken)
    if (!payload) throw new DomainError('INVALID_REFRESH_TOKEN', 'Invalid or expired refresh token', 401)

    const user = await this.deps.userRepo.findByEmailWithPassword(payload.email)
    if (!user) throw new DomainError('USER_NOT_FOUND', 'User not found', 401)
    if (user.status !== 'ACTIVE') throw new DomainError('ACCOUNT_SUSPENDED', 'Account is not active', 403)

    if (!user.refreshTokenHash) throw new DomainError('INVALID_REFRESH_TOKEN', 'No active session', 401)
    const valid = await bcrypt.compare(input.refreshToken, user.refreshTokenHash)
    if (!valid) throw new DomainError('INVALID_REFRESH_TOKEN', 'Token reuse detected', 401)

    // Rotate: issue new pair, invalidate old hash
    const tokens  = await this.deps.tokenService.generateTokenPair(user.id, user.role, user.email)
    const newHash = await bcrypt.hash(tokens.refreshToken, 10)

    await this.deps.userRepo.updateRefreshToken(user.id, newHash)
    await this.deps.cache.del(`user:${user.id}`)

    return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }
  }
}
