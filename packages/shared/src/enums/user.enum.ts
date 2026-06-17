export enum UserRole {
  CUSTOMER      = 'CUSTOMER',
  VENDOR        = 'VENDOR',
  ADMIN         = 'ADMIN',
  SUPER_ADMIN   = 'SUPER_ADMIN',
}

export enum UserStatus {
  ACTIVE                = 'ACTIVE',
  INACTIVE              = 'INACTIVE',
  EMAIL_UNVERIFIED      = 'EMAIL_UNVERIFIED',
  PHONE_UNVERIFIED      = 'PHONE_UNVERIFIED',
  SUSPENDED             = 'SUSPENDED',
  BANNED                = 'BANNED',
  PENDING_VERIFICATION  = 'PENDING_VERIFICATION',
}

export enum VendorStatus {
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  ACTIVE               = 'ACTIVE',
  SUSPENDED            = 'SUSPENDED',
  BANNED               = 'BANNED',
}

export enum VerificationDocumentType {
  NATIONAL_ID   = 'NATIONAL_ID',
  PASSPORT      = 'PASSPORT',
  DRIVING_LICENSE = 'DRIVING_LICENSE',
}
