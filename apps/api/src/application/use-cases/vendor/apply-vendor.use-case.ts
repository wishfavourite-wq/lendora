import type { IUserRepository }   from '@/application/ports/repositories/user.repository.port.js'
import type { IVendorRepository } from '@/application/ports/repositories/vendor.repository.port.js'
import type { VendorProfile, UserId } from '@lendora/shared'
import { VendorStatus }          from '@lendora/shared'
import { DomainError }            from '@/domain/errors/index.js'

interface Deps {
  userRepo:   IUserRepository
  vendorRepo: IVendorRepository
}

type ApplyVendorInput = {
  businessName:        string
  businessDescription?: string
  businessAddress?:    string
  district:            string
  division:            string
  bkashNumber?:        string
  nagadNumber?:        string
  bankAccountName?:    string
  bankAccountNumber?:  string
  bankName?:           string
}

export class ApplyVendorUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(userId: UserId, input: ApplyVendorInput): Promise<VendorProfile> {
    const existing = await this.deps.vendorRepo.findByUserId(userId)
    if (existing) {
      throw new DomainError('VENDOR_EXISTS', 'You have already applied for a vendor account', 409)
    }

    const profile = await this.deps.vendorRepo.create({
      userId,
      status: VendorStatus.PENDING_VERIFICATION,
      ...input,
    })

    // Upgrade the user role to VENDOR
    await this.deps.userRepo.update(userId, { role: 'VENDOR' })

    return profile
  }
}
