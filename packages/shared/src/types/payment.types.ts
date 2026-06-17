import type { PaymentMethod, PaymentStatus, TransactionStatus } from '../enums/payment.enum.js'
import type { PaymentId, RentalId, UserId, VendorId } from './brand.js'

export interface Payment {
  readonly id:          PaymentId
  readonly rentalId:    RentalId
  readonly payerId:     UserId
  amount:               number
  currency:             'BDT'
  method:               PaymentMethod
  status:               PaymentStatus
  externalReference:    string | null
  gatewayTransactionId: string | null
  gatewayResponse:      Record<string, unknown> | null
  initiatedAt:          Date
  completedAt:          Date | null
  failedAt:             Date | null
  failureReason:        string | null
  readonly createdAt:   Date
}

export interface BkashPaymentIntent {
  paymentID:   string
  createTime:  string
  orgLogo:     string
  orgName:     string
  transactionStatus: string
  amount:      string
  currency:    string
  intent:      string
  merchantInvoiceNumber: string
  bkashURL:    string
}

export interface NagadPaymentIntent {
  sensitiveData:  string
  signature:      string
  status:         string
  callBackUrl:    string
  paymentReferenceId: string
}

export interface VendorPayout {
  readonly id:      string
  vendorId:         VendorId
  rentalId:         RentalId
  amount:           number
  method:           PaymentMethod
  status:           TransactionStatus
  transactionRef:   string | null
  processedAt:      Date | null
  failureReason:    string | null
  readonly createdAt: Date
}

export interface PlatformRevenue {
  rentalId:      RentalId
  platformFee:   number
  depositHeld:   number
  depositRefunded: number
  depositForfeited: number
  netRevenue:    number
  recordedAt:    Date
}
