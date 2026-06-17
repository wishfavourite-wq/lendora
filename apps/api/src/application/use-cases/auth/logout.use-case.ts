import type { IUserRepository } from '@/application/ports/repositories/user.repository.port.js'
import type { ICacheService }   from '@/application/ports/services/cache.service.port.js'
import type { UserId }          from '@lendora/shared'

interface Deps {
  userRepo: IUserRepository
  cache:    ICacheService
}

export class LogoutUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(userId: UserId): Promise<void> {
    await this.deps.userRepo.updateRefreshToken(userId, null)
    await this.deps.cache.del(`user:${userId}`)
  }
}
