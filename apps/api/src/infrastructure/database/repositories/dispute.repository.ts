import type { PrismaClient, Prisma } from '@prisma/client'
import type {
  IDisputeRepository, FindDisputesOptions,
} from '@/application/ports/repositories/dispute.repository.port.js'
import type {
  Dispute, DisputeId, RentalId, UserId,
  DisputeEvidence,
} from '@lendora/shared'
import type { DisputeStatus } from '@lendora/shared'
import { asId } from '@lendora/shared'

type PrismaDispute = Prisma.DisputeGetPayload<{
  include: { evidence: true }
}>

export class PrismaDisputeRepository implements IDisputeRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: DisputeId): Promise<Dispute | null> {
    const row = await this.db.dispute.findUnique({
      where:   { id },
      include: { evidence: true },
    })
    return row ? this.mapDispute(row) : null
  }

  async findByRentalId(rentalId: RentalId): Promise<Dispute | null> {
    const row = await this.db.dispute.findUnique({
      where:   { rentalId },
      include: { evidence: true },
    })
    return row ? this.mapDispute(row) : null
  }

  async findMany(opts: FindDisputesOptions): Promise<{ items: Dispute[]; total: number }> {
    const where: Prisma.DisputeWhereInput = {
      ...(opts.raisedById && { raisedById: opts.raisedById }),
      ...(opts.againstId  && { againstId:  opts.againstId }),
      ...(opts.status     && {
        status: Array.isArray(opts.status)
          ? { in: opts.status }
          : opts.status,
      }),
    }

    const page  = opts.page  ?? 1
    const limit = opts.limit ?? 20

    const [rows, total] = await this.db.$transaction([
      this.db.dispute.findMany({
        where,
        include: { evidence: true },
        skip:    (page - 1) * limit,
        take:    limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.db.dispute.count({ where }),
    ])

    return { items: rows.map(this.mapDispute), total }
  }

  async create(data: Omit<Dispute, 'id' | 'createdAt' | 'updatedAt' | 'evidence'>): Promise<Dispute> {
    const row = await this.db.dispute.create({
      data: {
        rentalId:    data.rentalId,
        raisedById:  data.raisedById,
        againstId:   data.againstId,
        type:        data.type as import('@prisma/client').DisputeType,
        status:      data.status,
        description: data.description,
        claimedAmount: data.claimedAmount ?? undefined,
      },
      include: { evidence: true },
    })
    return this.mapDispute(row)
  }

  async updateStatus(id: DisputeId, status: DisputeStatus, meta?: Partial<Dispute>): Promise<Dispute> {
    const row = await this.db.dispute.update({
      where:   { id },
      data:    {
        status,
        ...(meta?.adminNote && { adminNote: meta.adminNote }),
      },
      include: { evidence: true },
    })
    return this.mapDispute(row)
  }

  async addEvidence(
    disputeId: DisputeId,
    evidence:  Omit<DisputeEvidence, 'id'>,
  ): Promise<DisputeEvidence> {
    const row = await this.db.disputeEvidence.create({
      data: {
        disputeId:    disputeId,
        uploadedById: evidence.uploadedById,
        type:         evidence.type as import('@prisma/client').EvidenceType,
        fileUrl:      evidence.fileUrl,
        description:  evidence.description ?? undefined,
      },
    })
    return {
      id:           row.id,
      disputeId:    asId<DisputeId>(row.disputeId),
      uploadedById: asId<UserId>(row.uploadedById),
      type:         row.type as 'photo' | 'video' | 'document',
      fileUrl:      row.fileUrl,
      description:  row.description,
      uploadedAt:   row.uploadedAt,
    }
  }

  async resolve(id: DisputeId, data: {
    resolution:       string
    depositDeduction: number | null
    note:             string
    resolvedById:     UserId
  }): Promise<Dispute> {
    const row = await this.db.dispute.update({
      where: { id },
      data:  {
        status:           'RESOLVED',
        resolution:       data.resolution,
        depositDeduction: data.depositDeduction ?? undefined,
        adminNote:        data.note,
        resolvedById:     data.resolvedById,
        resolvedAt:       new Date(),
      },
      include: { evidence: true },
    })
    return this.mapDispute(row)
  }

  async existsForRental(rentalId: RentalId): Promise<boolean> {
    const count = await this.db.dispute.count({ where: { rentalId } })
    return count > 0
  }

  private mapDispute(row: PrismaDispute): Dispute {
    return {
      id:               asId<DisputeId>(row.id),
      rentalId:         asId<RentalId>(row.rentalId),
      raisedById:       asId<UserId>(row.raisedById),
      againstId:        asId<UserId>(row.againstId),
      type:             row.type        as import('@lendora/shared').DisputeType,
      status:           row.status      as DisputeStatus,
      description:      row.description,
      claimedAmount:    row.claimedAmount ? Number(row.claimedAmount) : null,
      resolution:       row.resolution,
      depositDeduction: row.depositDeduction ? Number(row.depositDeduction) : null,
      adminNote:        row.adminNote,
      resolvedById:     row.resolvedById ? asId<UserId>(row.resolvedById) : null,
      resolvedAt:       row.resolvedAt,
      createdAt:        row.createdAt,
      updatedAt:        row.updatedAt,
      evidence:         row.evidence.map((e) => ({
        id:           e.id,
        disputeId:    asId<DisputeId>(e.disputeId),
        uploadedById: asId<UserId>(e.uploadedById),
        type:         e.type as 'photo' | 'video' | 'document',
        fileUrl:      e.fileUrl,
        description:  e.description,
        uploadedAt:   e.uploadedAt,
      })),
    }
  }
}
