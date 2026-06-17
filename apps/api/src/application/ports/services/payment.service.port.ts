import type { RentalId, UserId } from '@lendora/shared'
import type { PaymentMethod } from '@lendora/shared'

export interface InitiatePaymentOptions {
  rentalId:       RentalId
  payerId:        UserId
  amount:         number
  method:         PaymentMethod
  callbackUrl:    string
  description:    string
  invoiceNumber:  string
}

export interface PaymentInitResult {
  paymentRef:     string
  redirectUrl:    string
  gatewayRef:     string
  expiresAt:      Date
}

export interface VerifyPaymentResult {
  success:        boolean
  transactionId:  string
  amount:         number
  paidAt:         Date | null
  gatewayResponse: Record<string, unknown>
}

export interface IPaymentService {
  initiatePayment(opts: InitiatePaymentOptions): Promise<PaymentInitResult>
  verifyPayment(paymentRef: string, method: PaymentMethod): Promise<VerifyPaymentResult>
  refund(transactionId: string, amount: number, reason: string): Promise<{ refundId: string }>
}
