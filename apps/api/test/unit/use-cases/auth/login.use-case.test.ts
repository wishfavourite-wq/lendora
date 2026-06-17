import { describe, it, expect, vi, beforeEach } from 'vitest'
import bcrypt from 'bcryptjs'
import { LoginUseCase } from '../../../../src/application/use-cases/auth/login.use-case.js'
import { mockUserRepo } from '../../../factories/mock.repositories.js'
import { mockTokenService as buildTokenMock } from '../../../factories/mock.services.js'
import { buildUser } from '../../../factories/entity.builders.js'
import { UnauthorizedError, ForbiddenError, DomainError } from '../../../../src/domain/errors/index.js'

describe('LoginUseCase', () => {
  let userRepo:     ReturnType<typeof mockUserRepo>
  let tokenService: ReturnType<typeof buildTokenMock>
  let useCase:      LoginUseCase

  const PLAINTEXT_PASSWORD = 'Str0ng!Pass'

  beforeEach(async () => {
    userRepo     = mockUserRepo()
    tokenService = buildTokenMock()
    useCase      = new LoginUseCase({ userRepo, tokenService })

    const hash = await bcrypt.hash(PLAINTEXT_PASSWORD, 4) // low rounds for test speed
    const user = buildUser({ passwordHash: hash })

    userRepo.findByEmailWithPassword.mockResolvedValue(user)
    tokenService.generateTokenPair.mockResolvedValue({
      accessToken:  'access.token.here',
      refreshToken: 'refresh.token.here',
      expiresAt:    new Date(Date.now() + 900_000),
    })
    tokenService.hashToken.mockResolvedValue('hashed-refresh-token')
    userRepo.update.mockResolvedValue(user)
    userRepo.updateRefreshToken.mockResolvedValue(undefined)
  })

  // ── Happy path ─────────────────────────────────────────────────────────────

  it('returns tokens and safe user on valid credentials', async () => {
    const result = await useCase.execute({
      email:    'renter@lendora.test',
      password: PLAINTEXT_PASSWORD,
    })

    expect(result.tokens.accessToken).toBe('access.token.here')
    expect(result.user.email).toBe('renter@lendora.test')
    // passwordHash must never appear on the result object
    expect((result.user as any).passwordHash).toBeUndefined()
    expect((result.user as any).refreshTokenHash).toBeUndefined()
  })

  it('stores hashed refresh token after successful login', async () => {
    await useCase.execute({ email: 'renter@lendora.test', password: PLAINTEXT_PASSWORD })

    expect(tokenService.hashToken).toHaveBeenCalledWith('refresh.token.here')
    expect(userRepo.updateRefreshToken).toHaveBeenCalledWith(
      expect.anything(),
      'hashed-refresh-token',
    )
  })

  it('updates lastLoginAt after successful login', async () => {
    await useCase.execute({ email: 'renter@lendora.test', password: PLAINTEXT_PASSWORD })

    expect(userRepo.update).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ lastLoginAt: expect.any(Date) }),
    )
  })

  // ── Wrong credentials ──────────────────────────────────────────────────────

  it('throws UnauthorizedError when email does not exist', async () => {
    userRepo.findByEmailWithPassword.mockResolvedValue(null)

    await expect(
      useCase.execute({ email: 'nobody@lendora.test', password: PLAINTEXT_PASSWORD }),
    ).rejects.toThrow(UnauthorizedError)
  })

  it('throws UnauthorizedError when password is wrong', async () => {
    await expect(
      useCase.execute({ email: 'renter@lendora.test', password: 'WrongPass123!' }),
    ).rejects.toThrow(UnauthorizedError)
  })

  // Error message is deliberately identical for both cases — prevents user enumeration
  it('uses the same error message for missing email and wrong password', async () => {
    userRepo.findByEmailWithPassword.mockResolvedValue(null)
    const err1 = await useCase.execute({ email: 'x@x.com', password: 'p' }).catch((e) => e)

    userRepo.findByEmailWithPassword.mockResolvedValue(buildUser({ passwordHash: await bcrypt.hash('correct', 4) }))
    const err2 = await useCase.execute({ email: 'renter@lendora.test', password: 'wrong' }).catch((e) => e)

    expect(err1.message).toBe(err2.message)
  })

  // ── Account status guards ──────────────────────────────────────────────────

  it('throws ForbiddenError for a BANNED account', async () => {
    const banned = buildUser({ status: 'BANNED' as import('@lendora/shared').UserStatus, passwordHash: await bcrypt.hash(PLAINTEXT_PASSWORD, 4) })
    userRepo.findByEmailWithPassword.mockResolvedValue(banned)

    await expect(
      useCase.execute({ email: banned.email, password: PLAINTEXT_PASSWORD }),
    ).rejects.toThrow(ForbiddenError)
  })

  it('throws ForbiddenError for a SUSPENDED account', async () => {
    const suspended = buildUser({ status: 'SUSPENDED' as import('@lendora/shared').UserStatus, passwordHash: await bcrypt.hash(PLAINTEXT_PASSWORD, 4) })
    userRepo.findByEmailWithPassword.mockResolvedValue(suspended)

    await expect(
      useCase.execute({ email: suspended.email, password: PLAINTEXT_PASSWORD }),
    ).rejects.toThrow(ForbiddenError)
  })

  it('throws DomainError with EMAIL_NOT_VERIFIED code for unverified email', async () => {
    const unverified = buildUser({
      status:          'EMAIL_UNVERIFIED' as import('@lendora/shared').UserStatus,
      emailVerifiedAt: null,
      passwordHash:    await bcrypt.hash(PLAINTEXT_PASSWORD, 4),
    })
    userRepo.findByEmailWithPassword.mockResolvedValue(unverified)

    const err = await useCase.execute({ email: unverified.email, password: PLAINTEXT_PASSWORD }).catch((e) => e)
    expect(err).toBeInstanceOf(DomainError)
    expect(err.code).toBe('EMAIL_NOT_VERIFIED')
  })
})
