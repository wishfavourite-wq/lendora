import type { DomainEvent } from '@/domain/events/domain-event.base.js'
import type { IEventBus }   from '@/application/ports/services/event-bus.service.port.js'
import { logger }            from '@/infrastructure/logger/logger.js'

type Handler = (event: DomainEvent) => Promise<void>

/**
 * In-process event bus for development and single-server deployments.
 * Swap for a Redis Pub/Sub or RabbitMQ adapter in distributed production.
 */
export class InMemoryEventBus implements IEventBus {
  private readonly handlers = new Map<string, Handler[]>()

  subscribe<T extends DomainEvent>(eventName: string, handler: (event: T) => Promise<void>): void {
    const existing = this.handlers.get(eventName) ?? []
    this.handlers.set(eventName, [...existing, handler as Handler])
  }

  async publish<T extends DomainEvent>(event: T): Promise<void> {
    const handlers = this.handlers.get(event.eventName) ?? []
    logger.debug(`[EventBus] Publishing ${event.eventName}`, { eventId: event.eventId })

    await Promise.allSettled(
      handlers.map((h) =>
        h(event).catch((err: unknown) => {
          logger.error(`[EventBus] Handler failed for ${event.eventName}`, { err, eventId: event.eventId })
        })
      )
    )
  }
}
