import type { RentalId, UserId, ProductId } from '@lendora/shared'
import { DomainEvent } from './domain-event.base.js'

export class RentalCreatedEvent extends DomainEvent {
  readonly eventName = 'rental.created' as const
  constructor(
    public readonly rentalId:  RentalId,
    public readonly productId: ProductId,
    public readonly renterId:  UserId,
    public readonly vendorId:  UserId,
  ) { super() }
}

export class RentalConfirmedEvent extends DomainEvent {
  readonly eventName = 'rental.confirmed' as const
  constructor(
    public readonly rentalId: RentalId,
    public readonly renterId: UserId,
    public readonly vendorId: UserId,
  ) { super() }
}

export class RentalCancelledEvent extends DomainEvent {
  readonly eventName = 'rental.cancelled' as const
  constructor(
    public readonly rentalId:     RentalId,
    public readonly renterId:     UserId,
    public readonly vendorId:     UserId,
    public readonly cancelledBy:  UserId,
    public readonly reason:       string,
  ) { super() }
}

export class RentalCompletedEvent extends DomainEvent {
  readonly eventName = 'rental.completed' as const
  constructor(
    public readonly rentalId: RentalId,
    public readonly renterId: UserId,
    public readonly vendorId: UserId,
  ) { super() }
}

export class ReturnInitiatedEvent extends DomainEvent {
  readonly eventName = 'return.initiated' as const
  constructor(
    public readonly rentalId: RentalId,
    public readonly renterId: UserId,
    public readonly vendorId: UserId,
  ) { super() }
}

export class DepositRefundedEvent extends DomainEvent {
  readonly eventName = 'deposit.refunded' as const
  constructor(
    public readonly rentalId:     RentalId,
    public readonly renterId:     UserId,
    public readonly fullAmount:   number,
    public readonly refundAmount: number,
  ) { super() }
}

export class DisputeOpenedEvent extends DomainEvent {
  readonly eventName = 'dispute.opened' as const
  constructor(
    public readonly rentalId:   RentalId,
    public readonly raisedById: UserId,
    public readonly againstId:  UserId,
  ) { super() }
}
