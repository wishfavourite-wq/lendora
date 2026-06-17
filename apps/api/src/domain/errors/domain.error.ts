import { type ErrorCode } from '@lendora/shared'

/**
 * Base class for all domain errors.
 * Domain errors are intentional, expected failures — not system crashes.
 * They carry a code for programmatic handling and an HTTP status hint.
 */
export class DomainError extends Error {
  constructor(
    public readonly code:       ErrorCode,
    public readonly message:    string,
    public readonly statusHint: number = 400,
    public readonly field?:     string,
  ) {
    super(message)
    this.name = 'DomainError'
    Error.captureStackTrace(this, this.constructor)
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string, id?: string) {
    super(
      'NOT_FOUND',
      id ? `${resource} with id "${id}" not found` : `${resource} not found`,
      404,
    )
    this.name = 'NotFoundError'
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = 'Authentication required') {
    super('UNAUTHORIZED', message, 401)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = 'You do not have permission to perform this action') {
    super('FORBIDDEN', message, 403)
    this.name = 'ForbiddenError'
  }
}

export class ConflictError extends DomainError {
  constructor(message: string, field?: string) {
    super('CONFLICT', message, 409, field)
    this.name = 'ConflictError'
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, field?: string) {
    super('VALIDATION_ERROR', message, 422, field)
    this.name = 'ValidationError'
  }
}

export class ProductUnavailableError extends DomainError {
  constructor(_productId: string, _startDate: Date, _endDate: Date) {
    super(
      'PRODUCT_UNAVAILABLE',
      'This product is already booked for the selected dates. Please choose different dates.',
      409,
    )
    this.name = 'ProductUnavailableError'
  }
}

export class RentalNotCancellableError extends DomainError {
  constructor(reason: string) {
    super('RENTAL_NOT_CANCELLABLE', `Cannot cancel rental: ${reason}`, 409)
    this.name = 'RentalNotCancellableError'
  }
}

export class PaymentError extends DomainError {
  constructor(message: string) {
    super('PAYMENT_FAILED', message, 402)
    this.name = 'PaymentError'
  }
}

export class VendorNotVerifiedError extends DomainError {
  constructor() {
    super('VENDOR_NOT_VERIFIED', 'Vendor account is pending verification', 403)
    this.name = 'VendorNotVerifiedError'
  }
}
