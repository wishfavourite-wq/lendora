import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import type { ITokenService } from '@/application/ports/services/token.service.port.js'
import type { AuthTokenPair, JwtPayload, UserId } from '@lendora/shared'
import type { UserRole } from '@lendora/shared'

export class JwtTokenService implements ITokenService {
  private readonly accessSecret  = process.env['JWT_ACCESS_SECRET']  ?? ''
  private readonly refreshSecret = process.env['JWT_REFRESH_SECRET'] ?? ''
  private readonly accessExpiry  = process.env['JWT_ACCESS_EXPIRES_IN']  ?? '15m'
  private readonly refreshExpiry = process.env['JWT_REFRESH_EXPIRES_IN'] ?? '7d'

  async generateTokenPair(userId: UserId, role: UserRole, email: string): Promise<AuthTokenPair> {
    const payload = { sub: userId, role, email }

    const accessToken  = jwt.sign(payload, this.accessSecret,  { expiresIn: this.accessExpiry as jwt.SignOptions['expiresIn'] })
    const refreshToken = jwt.sign(payload, this.refreshSecret, { expiresIn: this.refreshExpiry as jwt.SignOptions['expiresIn'] })

    const decoded = jwt.decode(accessToken) as { exp: number }
    return {
      accessToken,
      refreshToken,
      expiresAt: new Date(decoded.exp * 1000),
    }
  }

  async verifyAccessToken(token: string): Promise<JwtPayload> {
    return jwt.verify(token, this.accessSecret) as JwtPayload
  }

  async verifyRefreshToken(token: string): Promise<JwtPayload> {
    return jwt.verify(token, this.refreshSecret) as JwtPayload
  }

  async hashToken(token: string): Promise<string> {
    return bcrypt.hash(token, 10)
  }

  async compareToken(raw: string, hash: string): Promise<boolean> {
    return bcrypt.compare(raw, hash)
  }
}
