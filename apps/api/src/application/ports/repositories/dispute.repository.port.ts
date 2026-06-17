import type { Dispute, DisputeId, RentalId, UserId, DisputeEvidence } from '@lendora/shared'
import type { DisputeStatus } from '@lendora/shared'

export interface FindDisputesOptions {
  raisedById?: UserId
  againstId?:  UserId
  status?:     DisputeStatus | DisputeStatus[]
  page?:       number
  limit?:      number
}

export interface IDisputeRepository {
  findById(id: DisputeId): Promise<Dispute | null>
  findByRentalId(rentalId: RentalId): Promise<Dispute | null>
  findMany(opts: FindDisputesOptions): Promise<{ items: Dispute[]; total: number }>

  create(data: Omit<Dispute, 'id' | 'createdAt' | 'updatedAt' | 'evidence'>): Promise<Dispute>
  updateStatus(id: DisputeId, status: DisputeStatus, meta?: Partial<Dispute>): Promise<Dispute>
  addEvidence(disputeId: DisputeId, evidence: Omit<DisputeEvidence, 'id'>): Promise<DisputeEvidence>
  resolve(id: DisputeId, data: {
    resolution:       string
    depositDeduction: number | null
    note:             string
    resolvedById:     UserId
  }): Promise<Dispute>

  existsForRental(rentalId: RentalId): Promise<boolean>
}
