import type { IRentalRepository }  from '@/application/ports/repositories/rental.repository.port.js'
import type { RentalId, UserId }   from '@lendora/shared'
import type { Rental }             from '@lendora/shared'
import { DomainError }             from '@/domain/errors/index.js'

interface Deps {
  rentalRepo: IRentalRepository
}

export class InitiateReturnUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(rentalId: RentalId, renterId: UserId): Promise<Rental> {
    const rental = await this.deps.rentalRepo.findById(rentalId)
    if (!rental) throw new DomainError('RENTAL_NOT_FOUND', 'Rental not found', 404)
    if (rental.renterId !== renterId) throw new DomainError('FORBIDDEN', 'Not authorized', 403)
    if (rental.status !== 'ACTIVE' && rental.status !== 'OVERDUE') {
      throw new DomainError('INVALID_STATE', `Cannot initiate return for a rental in '${rental.status}' status`, 422)
    }

    return this.deps.rentalRepo.updateStatus(rentalId, 'RETURN_INITIATED')
  }
}
