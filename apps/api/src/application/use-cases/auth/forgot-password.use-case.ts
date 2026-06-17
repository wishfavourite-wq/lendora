import type { IUserRepository }  from '@/application/ports/repositories/user.repository.port.js'
import type { IEmailService }    from '@/application/ports/services/email.service.port.js'
import crypto                    from 'node:crypto'

interface Deps {
  userRepo:     IUserRepository
  emailService: IEmailService
}

export class ForgotPasswordUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(email: string): Promise<void> {
    const user = await this.deps.userRepo.findByEmail(email)

    // Always respond 200 — never confirm whether an email exists
    if (!user || user.status !== 'ACTIVE') return

    const token  = crypto.randomBytes(32).toString('hex')
    const expiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await this.deps.userRepo.updateResetToken(user.id, token, expiry)

    const resetUrl = `${process.env['FRONTEND_URL']}/reset-password?token=${token}`

    await this.deps.emailService.send({
      to:      user.email,
      subject: 'Reset your LENDORA password',
      html:    `
        <p>Hi ${user.name},</p>
        <p>Click the link below to reset your password. It expires in 1 hour.</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>If you did not request this, ignore this email.</p>
      `,
    })
  }
}
