import type { IRentalRepository }  from '@/application/ports/repositories/rental.repository.port.js'
import type { IEventBus }          from '@/application/ports/services/event-bus.port.js'
import type { RentalId, UserId }   from '@lendora/shared'
import type { Rental, CancellationReason } from '@lendora/shared'
import { DomainError }             from '@/domain/errors/index.js'

interface Deps {
  rentalRepo: IRentalRepository
  eventBus:   IEventBus
}

interface CancelRentalInput {
  rentalId: RentalId
  userId:   UserId
  role:     'CUSTOMER' | 'VENDOR' | 'ADMIN'
  reason:   CancellationReason
  note?:    string
}

const CANCELLABLE_STATES = ['PENDING_CONFIRMATION', 'CONFIRMED', 'READY_FOR_PICKUP'] as const

export class CancelRentalUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: CancelRentalInput): Promise<Rental> {
    const rental = await this.deps.rentalRepo.findById(input.rentalId)
    if (!rental) throw new DomainError('RENTAL_NOT_FOUND', 'Rental not found', 404)

    const canAct =
      input.role === 'ADMIN' ||
      (input.role === 'CUSTOMER' && rental.renterId === input.userId) ||
      (input.role === 'VENDOR' && rental.vendorId === input.userId)

    if (!canAct) throw new DomainError('FORBIDDEN', 'Not authorized to cancel this rental', 403)

    const isCancellable = (CANCELLABLE_STATES as readonly string[]).includes(rental.status)
    if (!isCancellable) {
      throw new DomainError('INVALID_STATE', `Cannot cancel a rental in '${rental.status}' status`, 422)
    }

    // Vendor cancelling an already-confirmed rental is penalized in payout (handled by payment phase)
    const updated = await this.deps.rentalRepo.updateStatus(input.rentalId, 'CANCELLED', {
      cancellationReason: input.reason,
      cancellationNote:   input.note,
    })

    return updated
  }
}
