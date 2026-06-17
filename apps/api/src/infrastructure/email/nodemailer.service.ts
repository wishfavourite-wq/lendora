import nodemailer, { type Transporter } from 'nodemailer'
import type { IEmailService, SendEmailOptions, RentalEmailDetails } from '@/application/ports/services/email.service.port.js'
import { logger } from '@/infrastructure/logger/logger.js'

export class NodemailerEmailService implements IEmailService {
  private readonly transporter: Transporter

  constructor() {
    this.transporter = nodemailer.createTransport({
      host:   process.env['SMTP_HOST'],
      port:   parseInt(process.env['SMTP_PORT'] ?? '587'),
      secure: false,
      auth: {
        user: process.env['SMTP_USER'],
        pass: process.env['SMTP_PASS'],
      },
    })
  }

  async send(opts: SendEmailOptions): Promise<void> {
    try {
      await this.transporter.sendMail({
        from:    process.env['SMTP_FROM'],
        to:      opts.to,
        subject: opts.subject,
        html:    opts.html,
        text:    opts.text,
        replyTo: opts.replyTo,
      })
    } catch (err) {
      logger.error('[Email] Failed to send email', { to: opts.to, subject: opts.subject, err })
    }
  }

  async sendWelcome(to: string, name: string, verifyUrl: string): Promise<void> {
    await this.send({
      to,
      subject: 'Welcome to Lendora — verify your email',
      html: `<p>Hi ${name}, welcome to Lendora! <a href="${verifyUrl}">Verify your email</a></p>`,
    })
  }

  async sendEmailVerification(to: string, name: string, verifyUrl: string): Promise<void> {
    await this.send({
      to,
      subject: 'Verify your Lendora email',
      html: `<p>Hi ${name}, <a href="${verifyUrl}">Click here to verify</a> (expires in 24h)</p>`,
    })
  }

  async sendPasswordReset(to: string, name: string, resetUrl: string): Promise<void> {
    await this.send({
      to,
      subject: 'Reset your Lendora password',
      html: `<p>Hi ${name}, <a href="${resetUrl}">Reset your password</a> (expires in 1h)</p>`,
    })
  }

  async sendBookingConfirmed(to: string, name: string, d: RentalEmailDetails): Promise<void> {
    await this.send({
      to,
      subject: `Booking confirmed — ${d.productName}`,
      html: `<p>Hi ${name}, your booking for "${d.productName}" from ${d.startDate.toLocaleDateString()} is confirmed.</p>`,
    })
  }

  async sendBookingCancelled(to: string, name: string, d: RentalEmailDetails, reason: string): Promise<void> {
    await this.send({
      to,
      subject: `Booking cancelled — ${d.productName}`,
      html: `<p>Hi ${name}, your booking was cancelled. Reason: ${reason}</p>`,
    })
  }

  async sendReturnReminder(to: string, name: string, d: RentalEmailDetails): Promise<void> {
    await this.send({
      to,
      subject: `Return reminder — ${d.productName} due ${d.endDate.toLocaleDateString()}`,
      html: `<p>Hi ${name}, please return "${d.productName}" by ${d.endDate.toLocaleDateString()}.</p>`,
    })
  }

  async sendDepositRefunded(to: string, name: string, amount: number): Promise<void> {
    await this.send({
      to,
      subject: 'Your deposit has been refunded',
      html: `<p>Hi ${name}, your ৳${amount} deposit has been refunded.</p>`,
    })
  }

  async sendVendorApproved(to: string, businessName: string): Promise<void> {
    await this.send({
      to,
      subject: `${businessName} is now verified on Lendora`,
      html: `<p>Your vendor account "${businessName}" has been approved. Start listing items today!</p>`,
    })
  }

  async sendNewBookingAlert(to: string, vendorName: string, d: RentalEmailDetails): Promise<void> {
    await this.send({
      to,
      subject: `New booking for ${d.productName}`,
      html: `<p>Hi ${vendorName}, you have a new booking for "${d.productName}" from ${d.startDate.toLocaleDateString()}.</p>`,
    })
  }
}
