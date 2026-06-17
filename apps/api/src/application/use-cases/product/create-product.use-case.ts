import type { IProductRepository } from '@/application/ports/repositories/product.repository.port.js'
import type { IVendorRepository }  from '@/application/ports/repositories/vendor.repository.port.js'
import type { ICache }             from '@/application/ports/services/cache.service.port.js'
import type { Product, UserId }    from '@lendora/shared'
import { DomainError }             from '@/domain/errors/index.js'

interface Deps {
  productRepo: IProductRepository
  vendorRepo:  IVendorRepository
  cache:       ICache
}

type CreateProductInput = Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'totalRentals' | 'averageRating' | 'reviewCount' | 'media' | 'vendorId'> & {
  mediaUrls?: string[]
}

export class CreateProductUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(userId: UserId, input: CreateProductInput): Promise<Product> {
    const vendor = await this.deps.vendorRepo.findByUserId(userId)
    if (!vendor) throw new DomainError('VENDOR_NOT_FOUND', 'Vendor profile not found', 404)
    if (vendor.status !== 'ACTIVE') {
      throw new DomainError('VENDOR_NOT_APPROVED', 'Your vendor account must be approved before listing products', 403)
    }

    const { mediaUrls, ...productData } = input
    const product = await this.deps.productRepo.create({ ...productData, vendorId: vendor.id }, mediaUrls)
    await this.deps.cache.del('products:featured')
    await this.deps.cache.del('products:recent')
    return product
  }
}
