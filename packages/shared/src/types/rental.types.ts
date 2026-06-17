import type {
  RentalStatus, DepositStatus, ReturnCondition, CancellationReason,
} from '../enums/rental.enum.js'
import type { PaymentStatus, PaymentMethod } from '../enums/payment.enum.js'
import type { RentalId, ProductId, UserId, VendorId, PaymentId, MediaId } from './brand.js'

export interface Rental {
  readonly id:          RentalId
  readonly productId:   ProductId
  readonly renterId:    UserId
  readonly vendorId:    VendorId
  status:               RentalStatus
  startDate:            Date
  endDate:              Date
  totalDays:            number
  pricePerDay:          number
  rentalFee:            number
  depositAmount:        number
  depositStatus:        DepositStatus
  platformFeeRate:      number
  platformFee:          number
  vendorPayout:         number
  deliveryFee:          number
  totalAmount:          number
  deliveryAddress:      string | null
  pickupAddress:        string | null
  returnAddress:        string | null
  renterNotes:          string | null
  vendorNotes:          string | null
  lateDays:             number
  lateFeeAmount:        number
  overdueNotifiedAt:    Date | null
  confirmedAt:          Date | null
  startedAt:            Date | null
  returnInitiatedAt:    Date | null
  returnReceivedAt:     Date | null
  completedAt:          Date | null
  cancelledAt:          Date | null
  cancellationReason:   CancellationReason | null
  cancellationNote:     string | null
  readonly createdAt:   Date
  readonly updatedAt:   Date
}

export interface ReturnRecord {
  readonly id:         string
  readonly rentalId:   RentalId
  reportedByVendor:    boolean
  condition:           ReturnCondition
  damageDescription:   string | null
  damageAmount:        number | null
  lateDays:            number | null
  latePenalty:         number | null
  outstandingDue:      number | null
  evidence:            ReturnEvidence[]
  depositDeduction:    number
  depositRefund:       number
  vendorAgreed:        boolean
  renterAgreed:        boolean
  adminReviewRequired: boolean
  readonly createdAt:  Date
  readonly updatedAt:  Date
}

export interface ReturnEvidence {
  readonly id:       MediaId
  fileUrl:           string
  type:              'photo' | 'video'
  uploadedBy:        UserId
  uploadedAt:        Date
}

export interface RentalPayment {
  readonly id:         PaymentId
  readonly rentalId:   RentalId
  readonly userId:     UserId
  amount:              number
  method:              PaymentMethod
  status:              PaymentStatus
  transactionId:       string | null
  gatewayResponse:     Record<string, unknown> | null
  paidAt:              Date | null
  failedAt:            Date | null
  readonly createdAt:  Date
}

export interface RentalSummary
  extends Pick<
    Rental,
    | 'id' | 'status' | 'startDate' | 'endDate'
    | 'totalDays' | 'totalAmount' | 'depositAmount'
    | 'depositStatus' | 'createdAt'
    | 'pricePerDay' | 'lateDays' | 'lateFeeAmount'
  > {
  productName:   string
  productImage:  string | null
  vendorName:    string
  renterName:    string
}
