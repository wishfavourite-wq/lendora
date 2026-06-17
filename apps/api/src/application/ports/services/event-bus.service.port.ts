import type { DomainEvent } from '@/domain/events/domain-event.base.js'

type EventHandler<T extends DomainEvent> = (event: T) => Promise<void>

export interface IEventBus {
  publish<T extends DomainEvent>(event: T): Promise<void>
  subscribe<T extends DomainEvent>(eventName: string, handler: EventHandler<T>): void
}
