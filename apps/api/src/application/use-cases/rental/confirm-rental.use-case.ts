import type { IRentalRepository }  from '@/application/ports/repositories/rental.repository.port.js'
import type { IEventBus }          from '@/application/ports/services/event-bus.port.js'
import type { RentalId, UserId }   from '@lendora/shared'
import type { Rental }             from '@lendora/shared'
import { DomainError }             from '@/domain/errors/index.js'
import { RentalConfirmedEvent }    from '@/domain/events/rental.events.js'

interface Deps {
  rentalRepo: IRentalRepository
  eventBus:   IEventBus
}

export class ConfirmRentalUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(rentalId: RentalId, vendorId: UserId): Promise<Rental> {
    const rental = await this.deps.rentalRepo.findById(rentalId)
    if (!rental) throw new DomainError('RENTAL_NOT_FOUND', 'Rental not found', 404)

    if (rental.vendorId !== vendorId) {
      throw new DomainError('FORBIDDEN', 'Only the vendor can confirm this rental', 403)
    }
    if (rental.status !== 'PENDING_CONFIRMATION') {
      throw new DomainError('INVALID_STATE', `Cannot confirm a rental in '${rental.status}' status`, 422)
    }

    const updated = await this.deps.rentalRepo.updateStatus(rentalId, 'CONFIRMED')
    await this.deps.eventBus.publish(new RentalConfirmedEvent(updated))
    return updated
  }
}
