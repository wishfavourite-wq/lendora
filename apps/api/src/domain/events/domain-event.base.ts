import { randomUUID } from 'node:crypto'

/**
 * Domain events enable decoupled side-effects.
 * A rental being confirmed dispatches RentalConfirmedEvent;
 * the notification service subscribes — without the rental use case
 * knowing anything about notifications.
 */
export abstract class DomainEvent {
  readonly eventId:    string
  readonly occurredAt: Date
  abstract readonly eventName: string

  constructor() {
    this.eventId    = randomUUID()
    this.occurredAt = new Date()
  }
}
