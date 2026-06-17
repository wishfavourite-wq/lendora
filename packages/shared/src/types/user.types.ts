import type { UserRole, UserStatus, VendorStatus, VerificationDocumentType } from '../enums/user.enum.js'
import type { UserId, VendorId, MediaId } from './brand.js'

export interface User {
  readonly id:          UserId
  email:                string
  phone:                string | null
  name:                 string
  address:              string | null
  avatarUrl:            string | null
  nidNumber:            string | null
  nidFrontImageUrl:     string | null
  nidBackImageUrl:      string | null
  bkashNumber:          string | null
  role:                 UserRole
  status:               UserStatus
  emailVerifiedAt:      Date | null
  phoneVerifiedAt:      Date | null
  readonly createdAt:   Date
  readonly updatedAt:   Date
}

export interface VendorProfile {
  readonly id:           VendorId
  readonly userId:       UserId
  businessName:          string
  businessDescription:   string | null
  businessAddress:       string
  district:              string
  division:              string
  bankAccountName:       string | null
  bankAccountNumber:     string | null
  bankName:              string | null
  bkashNumber:           string | null
  nagadNumber:           string | null
  status:                VendorStatus
  suspensionReason:      string | null
  verifiedAt:            Date | null
  totalRentals:          number
  totalEarnings:         number
  averageRating:         number
  responseTimeMinutes:   number | null
  readonly createdAt:    Date
  readonly updatedAt:    Date
}

export interface VerificationDocument {
  readonly id:         MediaId
  readonly userId:     UserId
  type:                VerificationDocumentType
  documentNumber:      string
  fileUrl:             string
  verifiedAt:          Date | null
  rejectedAt:          Date | null
  rejectionReason:     string | null
  readonly createdAt:  Date
}

export interface AuthTokenPair {
  accessToken:   string
  refreshToken:  string
  expiresAt:     Date
}

export interface JwtPayload {
  sub:    UserId
  role:   UserRole
  email:  string
  iat:    number
  exp:    number
}
