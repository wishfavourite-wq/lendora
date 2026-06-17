import type { IUserRepository } from '@/application/ports/repositories/user.repository.port.js'
import { DomainError }          from '@/domain/errors/index.js'
import bcrypt                   from 'bcryptjs'

interface Deps {
  userRepo: IUserRepository
}

interface ResetPasswordInput {
  token:    string
  password: string
}

export class ResetPasswordUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: ResetPasswordInput): Promise<void> {
    const user = await this.deps.userRepo.findByResetToken(input.token)
    if (!user) throw new DomainError('INVALID_RESET_TOKEN', 'Reset token is invalid or expired', 400)

    const passwordHash = await bcrypt.hash(input.password, 12)
    await this.deps.userRepo.updatePassword(user.id, passwordHash)
  }
}
