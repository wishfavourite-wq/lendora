/** Platform business rules — change here, affects both frontend and backend */

export const PLATFORM = {
  NAME:              'Lendora',
  COUNTRY:           'Bangladesh',
  CURRENCY:          'BDT',
  CURRENCY_SYMBOL:   '৳',
  LOCALE:            'bn-BD',
  SUPPORT_EMAIL:     'support@lendora.com.bd',
  SUPPORT_PHONE:     '+880 1800-LENDORA',
} as const

export const RENTAL_RULES = {
  /** Platform commission deducted from vendor payout */
  PLATFORM_FEE_RATE:          0.02,
  /** Minimum rental duration in days */
  MIN_RENTAL_DAYS:             1,
  /** Default maximum if vendor doesn't specify */
  DEFAULT_MAX_RENTAL_DAYS:     30,
  /** Hours before rental start within which cancellation is FREE */
  FREE_CANCEL_HOURS:           24,
  /** Hours after free cancel within which 50% fee applies */
  PARTIAL_CANCEL_HOURS:        6,
  /** Vendor must confirm booking within this window (hours) */
  VENDOR_CONFIRM_WINDOW_HOURS: 24,
  /** After confirmed, vendor has this many hours to mark ready */
  READY_WINDOW_HOURS:          12,
  /** Extension request must be made this many hours before end */
  EXTENSION_REQUEST_HOURS:     6,
} as const

export const DEPOSIT_RULES = {
  /** Default deposit multiplier if vendor doesn't set custom amount */
  DEFAULT_MULTIPLIER:          3,
  /** Minimum deposit amount in BDT */
  MIN_DEPOSIT:                 200,
  /** Days after return confirmation to auto-release deposit */
  AUTO_RELEASE_DAYS:           1,
  /** Max damage deduction % before admin review is required */
  ADMIN_REVIEW_THRESHOLD:      0.5,
  /** Partner Protection plan threshold (item value) */
  PARTNER_PROTECTION_THRESHOLD: 20_000,
  /** Partner Protection fee rate */
  PARTNER_PROTECTION_RATE:      0.01,
} as const

export const VENDOR_RULES = {
  /** Min % of rentals rated to display average */
  MIN_REVIEWS_FOR_RATING:  5,
  /** Days after which inactive listing is auto-deactivated */
  INACTIVE_LISTING_DAYS:   90,
  /** Min payout amount in BDT */
  MIN_PAYOUT:              500,
  /** Days after rental completion before payout is released */
  PAYOUT_HOLD_DAYS:        3,
} as const

export const SEARCH = {
  MIN_QUERY_LENGTH:   2,
  MAX_QUERY_LENGTH:   120,
  DEFAULT_PAGE_SIZE:  20,
  MAX_PAGE_SIZE:      100,
  FEATURED_LIMIT:     8,
  RECENT_LIMIT:       12,
} as const

export const REVIEW_RULES = {
  /** Days after rental completion within which review can be submitted */
  REVIEW_WINDOW_DAYS:       14,
  /** Days for vendor to reply to review */
  VENDOR_REPLY_WINDOW_DAYS: 30,
  MIN_BODY_LENGTH:           10,
  MAX_BODY_LENGTH:           1000,
} as const

export const FILE_UPLOAD = {
  MAX_PRODUCT_IMAGES:   10,
  MAX_FILE_SIZE_MB:     10,
  ALLOWED_IMAGE_TYPES:  ['image/jpeg', 'image/png', 'image/webp'] as const,
  ALLOWED_DOC_TYPES:    ['image/jpeg', 'image/png', 'application/pdf'] as const,
  THUMB_WIDTH:          400,
  CARD_WIDTH:           800,
  HERO_WIDTH:           1200,
} as const

export const DISTRICTS = [
  'Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna',
  'Barisal', 'Rangpur', 'Mymensingh', 'Gazipur', 'Narayanganj',
  'Comilla', 'Noakhali', 'Jessore', 'Bogra', 'Dinajpur',
] as const

export const DIVISIONS = [
  'Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi',
  'Khulna', 'Barisal', 'Rangpur', 'Mymensingh',
] as const
