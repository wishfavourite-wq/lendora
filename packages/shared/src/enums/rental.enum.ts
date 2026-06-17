/**
 * 10-state rental lifecycle.
 *
 * State machine:
 *   PENDING_CONFIRMATION → CONFIRMED → READY_FOR_PICKUP → ACTIVE
 *     → RETURN_INITIATED → RETURN_IN_TRANSIT → RETURN_RECEIVED
 *     → DEPOSIT_PROCESSING → COMPLETED
 *   Any state → CANCELLED (with rules per-state)
 */
export enum RentalStatus {
  PENDING_CONFIRMATION = 'PENDING_CONFIRMATION',
  CONFIRMED            = 'CONFIRMED',
  READY_FOR_PICKUP     = 'READY_FOR_PICKUP',
  ACTIVE               = 'ACTIVE',
  OVERDUE              = 'OVERDUE',
  RETURN_INITIATED     = 'RETURN_INITIATED',
  RETURN_IN_TRANSIT    = 'RETURN_IN_TRANSIT',
  RETURN_RECEIVED      = 'RETURN_RECEIVED',
  DEPOSIT_PROCESSING   = 'DEPOSIT_PROCESSING',
  COMPLETED            = 'COMPLETED',
  CANCELLED            = 'CANCELLED',
}

export enum DepositStatus {
  HELD                    = 'HELD',
  PARTIAL_REFUND_PENDING  = 'PARTIAL_REFUND_PENDING',
  FULL_REFUND_PENDING     = 'FULL_REFUND_PENDING',
  PARTIALLY_REFUNDED      = 'PARTIALLY_REFUNDED',
  FULLY_REFUNDED          = 'FULLY_REFUNDED',
  FORFEITED               = 'FORFEITED',
}

export enum ReturnCondition {
  EXCELLENT = 'EXCELLENT',
  GOOD      = 'GOOD',
  FAIR      = 'FAIR',
  POOR      = 'POOR',
  DAMAGED   = 'DAMAGED',
}

export enum ProductStatus {
  PENDING_REVIEW    = 'PENDING_REVIEW',
  ACTIVE            = 'ACTIVE',
  INACTIVE          = 'INACTIVE',
  UNDER_MAINTENANCE = 'UNDER_MAINTENANCE',
  REJECTED          = 'REJECTED',
  DELETED           = 'DELETED',
}

export enum ProductCondition {
  NEW         = 'NEW',
  LIKE_NEW    = 'LIKE_NEW',
  GOOD        = 'GOOD',
  FAIR        = 'FAIR',
}

export enum CancellationReason {
  VENDOR_UNAVAILABLE    = 'VENDOR_UNAVAILABLE',
  RENTER_REQUESTED      = 'RENTER_REQUESTED',
  PAYMENT_FAILED        = 'PAYMENT_FAILED',
  ITEM_DAMAGED          = 'ITEM_DAMAGED',
  ITEM_NOT_AS_DESCRIBED = 'ITEM_NOT_AS_DESCRIBED',
  FRAUD_SUSPECTED       = 'FRAUD_SUSPECTED',
  ADMIN_ACTION          = 'ADMIN_ACTION',
}
