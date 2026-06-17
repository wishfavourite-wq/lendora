import type { UserId, AuthTokenPair, JwtPayload } from '@lendora/shared'
import type { UserRole } from '@lendora/shared'

export interface ITokenService {
  generateTokenPair(userId: UserId, role: UserRole, email: string): Promise<AuthTokenPair>
  verifyAccessToken(token: string): Promise<JwtPayload>
  verifyRefreshToken(token: string): Promise<JwtPayload>
  hashToken(token: string): Promise<string>
  compareToken(raw: string, hash: string): Promise<boolean>
}
