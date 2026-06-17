export interface SendEmailOptions {
  to:          string
  subject:     string
  html:        string
  text?:       string
  replyTo?:    string
}

export interface IEmailService {
  send(opts: SendEmailOptions): Promise<void>

  sendWelcome(to: string, name: string, verifyUrl: string): Promise<void>
  sendEmailVerification(to: string, name: string, verifyUrl: string): Promise<void>
  sendPasswordReset(to: string, name: string, resetUrl: string): Promise<void>
  sendBookingConfirmed(to: string, name: string, rentalDetails: RentalEmailDetails): Promise<void>
  sendBookingCancelled(to: string, name: string, rentalDetails: RentalEmailDetails, reason: string): Promise<void>
  sendReturnReminder(to: string, name: string, rentalDetails: RentalEmailDetails): Promise<void>
  sendDepositRefunded(to: string, name: string, amount: number): Promise<void>
  sendVendorApproved(to: string, businessName: string): Promise<void>
  sendNewBookingAlert(to: string, vendorName: string, rentalDetails: RentalEmailDetails): Promise<void>
}

export interface RentalEmailDetails {
  rentalId:    string
  productName: string
  startDate:   Date
  endDate:     Date
  totalAmount: number
  currency:    string
}
