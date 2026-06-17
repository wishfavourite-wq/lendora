import type { IRentalRepository }  from '@/application/ports/repositories/rental.repository.port.js'
import type { IDisputeRepository } from '@/application/ports/repositories/dispute.repository.port.js'
import type { Dispute, RentalId, UserId } from '@lendora/shared'
import type { DisputeType } from '@lendora/shared'
import { DomainError }             from '@/domain/errors/index.js'

interface Deps {
  rentalRepo:  IRentalRepository
  disputeRepo: IDisputeRepository
}

interface OpenDisputeInput {
  rentalId:      RentalId
  raisedById:    UserId
  type:          DisputeType
  description:   string
  claimedAmount?: number
}

const DISPUTABLE_STATES = [
  'ACTIVE', 'RETURN_INITIATED', 'RETURN_IN_TRANSIT',
  'RETURN_RECEIVED', 'DEPOSIT_PROCESSING', 'COMPLETED',
] as const

export class OpenDisputeUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: OpenDisputeInput): Promise<Dispute> {
    const rental = await this.deps.rentalRepo.findById(input.rentalId)
    if (!rental) throw new DomainError('RENTAL_NOT_FOUND', 'Rental not found', 404)

    const isParty = rental.renterId === input.raisedById || rental.vendorId === input.raisedById
    if (!isParty) throw new DomainError('FORBIDDEN', 'Not a party to this rental', 403)

    if (!(DISPUTABLE_STATES as readonly string[]).includes(rental.status)) {
      throw new DomainError('INVALID_STATE', `Cannot open a dispute for a rental in '${rental.status}' status`, 422)
    }

    const alreadyExists = await this.deps.disputeRepo.existsForRental(input.rentalId)
    if (alreadyExists) throw new DomainError('DISPUTE_EXISTS', 'A dispute already exists for this rental', 409)

    const againstId = rental.renterId === input.raisedById ? rental.vendorId : rental.renterId

    return this.deps.disputeRepo.create({
      rentalId:      input.rentalId,
      raisedById:    input.raisedById,
      againstId,
      type:          input.type,
      status:        'OPEN',
      description:   input.description,
      claimedAmount: input.claimedAmount ?? null,
      resolution:       null,
      depositDeduction: null,
      adminNote:        null,
      resolvedById:     null,
      resolvedAt:       null,
    })
  }
}
