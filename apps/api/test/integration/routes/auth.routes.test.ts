/**
 * Auth routes integration tests.
 *
 * Strategy: mount the real Express app but intercept getContainer() so the
 * test controls all repository/service responses. This verifies:
 *   - HTTP verb, path, status codes
 *   - Request validation (Zod schemas)
 *   - Cookie behaviour (httpOnly refresh token)
 *   - Response shape contracts
 *
 * No database, no real JWT signing — all dependencies are mocked.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import bcrypt   from 'bcryptjs'

// Mock the container before importing the app so the singleton
// is never built with real infrastructure.
vi.mock('../../../src/infrastructure/container/container.js', () => ({
  getContainer: vi.fn(),
}))

import { getContainer } from '../../../src/infrastructure/container/container.js'
import { createApp }    from '../../../src/interface/http/app.js'
import { mockUserRepo } from '../../factories/mock.repositories.js'
import { mockTokenService } from '../../factories/mock.services.js'
import { buildUser }    from '../../factories/entity.builders.js'

const app = createApp()

function buildContainer(overrides: Record<string, unknown> = {}) {
  const userRepo     = mockUserRepo()
  const tokenService = mockTokenService()

  return {
    repos: { user: userRepo, product: {}, rental: {}, vendor: {}, category: {}, review: {}, dispute: {}, payment: {} },
    tokenService,
    emailService: { sendPasswordReset: vi.fn(), sendEmailVerification: vi.fn(), sendWelcome: vi.fn() },
    cache:        { get: vi.fn().mockResolvedValue(null), set: vi.fn(), del: vi.fn(), setNX: vi.fn().mockResolvedValue(true) },
    auth: {
      register: { execute: vi.fn() },
      login:    { execute: vi.fn() },
    },
    rental:  {},
    payment: {},
    gateways: {},
    eventBus: {},
    ...overrides,
  }
}

describe('POST /api/v1/auth/login', () => {
  let container: ReturnType<typeof buildContainer>

  beforeEach(async () => {
    container = buildContainer()
    vi.mocked(getContainer).mockReturnValue(container as any)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // ── Success ────────────────────────────────────────────────────────────────

  it('returns 200 with accessToken in body and refreshToken in httpOnly cookie', async () => {
    const hash = await bcrypt.hash('ValidPass123!', 4)
    const user = buildUser({ passwordHash: hash, status: 'ACTIVE' as any, emailVerifiedAt: new Date() })

    container.auth.login.execute.mockResolvedValue({
      tokens: {
        accessToken:  'access.jwt.token',
        refreshToken: 'refresh.jwt.token',
        expiresAt:    new Date(Date.now() + 900_000),
      },
      user,
    })

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'renter@lendora.test', password: 'ValidPass123!' })

    expect(res.status).toBe(200)
    expect(res.body.data.accessToken).toBe('access.jwt.token')
    expect(res.body.data.user.email).toBe('renter@lendora.test')
    // refreshToken must NOT appear in the response body
    expect(JSON.stringify(res.body)).not.toContain('refresh.jwt.token')
    // httpOnly cookie must be set
    const cookies = res.headers['set-cookie'] as string[] | undefined
    expect(cookies?.some((c: string) => c.startsWith('refreshToken='))).toBe(true)
    expect(cookies?.some((c: string) => c.includes('HttpOnly'))).toBe(true)
  })

  // ── Validation ─────────────────────────────────────────────────────────────

  it('returns 422 when email is missing', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ password: 'SomePass123!' })

    expect(res.status).toBe(422)
    expect(res.body.success).toBe(false)
  })

  it('returns 422 when password is missing', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'user@test.com' })

    expect(res.status).toBe(422)
  })

  it('returns 422 when email format is invalid', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'not-an-email', password: 'SomePass123!' })

    expect(res.status).toBe(422)
  })

  // ── Error propagation ──────────────────────────────────────────────────────

  it('returns 401 when use case throws UnauthorizedError', async () => {
    const { UnauthorizedError } = await import('../../../src/domain/errors/index.js')
    container.auth.login.execute.mockRejectedValue(
      new UnauthorizedError('Invalid email or password'),
    )

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'renter@lendora.test', password: 'WrongPass!' })

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  it('returns 403 for EMAIL_NOT_VERIFIED domain error', async () => {
    const { DomainError } = await import('../../../src/domain/errors/index.js')
    container.auth.login.execute.mockRejectedValue(
      new DomainError('EMAIL_NOT_VERIFIED', 'Verify your email', 403),
    )

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'unverified@lendora.test', password: 'ValidPass123!' })

    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('EMAIL_NOT_VERIFIED')
  })
})

describe('POST /api/v1/auth/register', () => {
  let container: ReturnType<typeof buildContainer>

  beforeEach(() => {
    container = buildContainer()
    vi.mocked(getContainer).mockReturnValue(container as any)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('returns 201 on successful registration', async () => {
    const user = buildUser()
    container.auth.register.execute.mockResolvedValue({
      tokens: {
        accessToken:  'access.jwt.token',
        refreshToken: 'refresh.jwt.token',
        expiresAt:    new Date(Date.now() + 900_000),
      },
      user,
    })

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name:     'Test User',
        email:    'new@lendora.test',
        password: 'StrongPass123!',
        phone:    '+8801700000099',
        role:     'CUSTOMER',
      })

    expect(res.status).toBe(201)
    expect(res.body.data.user).toBeDefined()
  })

  it('returns 422 when password is too short', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Test', email: 'x@x.com', password: 'short', role: 'CUSTOMER' })

    expect(res.status).toBe(422)
  })

  it('returns 409 when use case throws ConflictError for existing email', async () => {
    const { ConflictError } = await import('../../../src/domain/errors/index.js')
    container.auth.register.execute.mockRejectedValue(
      new ConflictError('Email already registered', 'email'),
    )

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name:     'Test',
        email:    'existing@lendora.test',
        password: 'StrongPass123!',
        role:     'CUSTOMER',
      })

    expect(res.status).toBe(409)
    expect(res.body.error.code).toBe('CONFLICT')
  })
})

describe('GET /health', () => {
  it('returns 200 without authentication', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
  })
})
