/**
 * All HTTP response shapes used across frontend and backend.
 * Discriminated unions on `success` make exhaustive handling trivial.
 */

export interface ApiSuccessResponse<T> {
  success:   true
  data:      T
  message?:  string
  meta?:     PaginationMeta
}

export interface ApiErrorResponse {
  success:     false
  error:       ApiError
  requestId?:  string
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

export interface ApiError {
  code:     string
  message:  string
  field?:   string
  details?: Record<string, string[]>
}

export interface PaginationMeta {
  page:        number
  pageSize:    number
  total:       number
  totalPages:  number
  hasPrev:     boolean
  hasNext:     boolean
}

export interface PaginationQueryParams {
  page?:     number
  pageSize?: number
  sortBy?:   string
  sortDir?:  'asc' | 'desc'
}

export interface ListResponse<T> {
  items:      T[]
  pagination: PaginationMeta
}

/** Error codes — exhaustive list used by both API and frontend */
export const ErrorCode = {
  // Auth
  UNAUTHORIZED:              'UNAUTHORIZED',
  FORBIDDEN:                 'FORBIDDEN',
  TOKEN_EXPIRED:             'TOKEN_EXPIRED',
  TOKEN_INVALID:             'TOKEN_INVALID',
  EMAIL_NOT_VERIFIED:        'EMAIL_NOT_VERIFIED',
  ACCOUNT_SUSPENDED:         'ACCOUNT_SUSPENDED',
  // Resources
  NOT_FOUND:                 'NOT_FOUND',
  ALREADY_EXISTS:            'ALREADY_EXISTS',
  CONFLICT:                  'CONFLICT',
  // Validation
  VALIDATION_ERROR:          'VALIDATION_ERROR',
  INVALID_DATE_RANGE:        'INVALID_DATE_RANGE',
  // Business
  PRODUCT_UNAVAILABLE:       'PRODUCT_UNAVAILABLE',
  RENTAL_NOT_CANCELLABLE:    'RENTAL_NOT_CANCELLABLE',
  DEPOSIT_ALREADY_PROCESSED: 'DEPOSIT_ALREADY_PROCESSED',
  RETURN_ALREADY_INITIATED:  'RETURN_ALREADY_INITIATED',
  REVIEW_ALREADY_SUBMITTED:  'REVIEW_ALREADY_SUBMITTED',
  VENDOR_NOT_VERIFIED:       'VENDOR_NOT_VERIFIED',
  VENDOR_PENDING:            'VENDOR_PENDING',
  VENDOR_SUSPENDED:          'VENDOR_SUSPENDED',
  VENDOR_BANNED:             'VENDOR_BANNED',
  CUSTOMER_PENDING:          'CUSTOMER_PENDING',
  CUSTOMER_REJECTED:         'CUSTOMER_REJECTED',
  // Payment
  PAYMENT_FAILED:            'PAYMENT_FAILED',
  PAYMENT_GATEWAY_ERROR:     'PAYMENT_GATEWAY_ERROR',
  INSUFFICIENT_FUNDS:        'INSUFFICIENT_FUNDS',
  // System
  INTERNAL_ERROR:            'INTERNAL_ERROR',
  RATE_LIMITED:              'RATE_LIMITED',
  SERVICE_UNAVAILABLE:       'SERVICE_UNAVAILABLE',
} as const

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode]
