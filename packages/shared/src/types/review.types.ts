import type { DisputeStatus, DisputeType, DisputeResolution } from '../enums/dispute.enum.js'
import type { ReviewId, RentalId, UserId, ProductId, VendorId, DisputeId, MediaId } from './brand.js'

export interface Review {
  readonly id:       ReviewId
  readonly rentalId: RentalId
  readonly reviewerId: UserId
  readonly productId: ProductId
  readonly vendorId:  VendorId
  rating:            1 | 2 | 3 | 4 | 5
  title:             string | null
  body:              string
  vendorReply:       string | null
  vendorRepliedAt:   Date | null
  isVerified:        true
  helpfulCount:      number
  readonly createdAt: Date
}

export interface Dispute {
  readonly id:          DisputeId
  readonly rentalId:    RentalId
  readonly raisedById:  UserId
  readonly againstId:   UserId
  type:                 DisputeType
  status:               DisputeStatus
  subject:              string
  description:          string
  evidence:             DisputeEvidence[]
  adminNotes:           string | null
  resolution:           DisputeResolution | null
  resolutionNote:       string | null
  depositDeduction:     number | null
  resolvedAt:           Date | null
  resolvedById:         UserId | null
  readonly createdAt:   Date
  readonly updatedAt:   Date
}

export interface DisputeEvidence {
  readonly id:   MediaId
  uploadedBy:    UserId
  fileUrl:       string
  description:   string | null
  uploadedAt:    Date
}

export interface Message {
  readonly id:         string
  readonly rentalId:   RentalId
  readonly senderId:   UserId
  body:                string
  attachmentUrl:       string | null
  readAt:              Date | null
  readonly createdAt:  Date
}
