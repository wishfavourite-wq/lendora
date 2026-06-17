export enum PaymentStatus {
  PENDING            = 'PENDING',
  PROCESSING         = 'PROCESSING',
  COMPLETED          = 'COMPLETED',
  FAILED             = 'FAILED',
  REFUNDED           = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
  CANCELLED          = 'CANCELLED',
}

export enum PaymentMethod {
  BKASH      = 'BKASH',
  NAGAD      = 'NAGAD',
  ROCKET     = 'ROCKET',
  CARD       = 'CARD',
  BANK       = 'BANK',
  CASH       = 'CASH',
}

export enum PaymentType {
  RENTAL_PAYMENT     = 'RENTAL_PAYMENT',
  DEPOSIT            = 'DEPOSIT',
  DEPOSIT_REFUND     = 'DEPOSIT_REFUND',
  VENDOR_PAYOUT      = 'VENDOR_PAYOUT',
  DAMAGE_DEDUCTION   = 'DAMAGE_DEDUCTION',
  LATE_FEE_DEDUCTION = 'LATE_FEE_DEDUCTION',
  PLATFORM_FEE       = 'PLATFORM_FEE',
}

export enum TransactionStatus {
  INITIATED  = 'INITIATED',
  PENDING    = 'PENDING',
  SUCCESS    = 'SUCCESS',
  FAILED     = 'FAILED',
  REVERSED   = 'REVERSED',
}
