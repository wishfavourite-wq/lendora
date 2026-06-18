import type { IProductRepository } from '@/application/ports/repositories/product.repository.port.js'
import type { IVendorRepository }  from '@/application/ports/repositories/vendor.repository.port.js'
import type { IRentalRepository }  from '@/application/ports/repositories/rental.repository.port.js'
import type { ICache }             from '@/application/ports/services/cache.service.port.js'
import type { ProductId, UserId }  from '@lendora/shared'
import { DomainError }             from '@/domain/errors/index.js'

const ACTIVE_STATUSES = ['PENDING_CONFIRMATION', 'CONFIRMED', 'READY_FOR_PICKUP', 'ACTIVE'] as const

interface Deps {
  productRepo: IProductRepository
  vendorRepo:  IVendorRepository
  rentalRepo:  IRentalRepository
  cache:       ICache
}

export class DeleteProductUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(productId: ProductId, userId: UserId, role: 'VENDOR' | 'ADMIN'): Promise<void> {
    const product = await this.deps.productRepo.findById(productId)
    if (!product) throw new DomainError('PRODUCT_NOT_FOUND', 'Product not found', 404)

    if (role === 'VENDOR') {
      const vendor = await this.deps.vendorRepo.findByUserId(userId)
      if (!vendor || vendor.id !== product.vendorId) {
        throw new DomainError('FORBIDDEN', 'You do not own this product', 403)
      }
    }

    // Block deletion if there are active rentals
    const { total } = await this.deps.rentalRepo.findMany({
      productId,
      status: [...ACTIVE_STATUSES],
      page:   1,
      limit:  1,
    })
    if (total > 0) {
      throw new DomainError('ACTIVE_RENTALS_EXIST', 'Cannot delete a product with active rentals', 422)
    }

    await this.deps.productRepo.softDelete(productId)
    await this.deps.cache.del(`product:${productId}`)
    await this.deps.cache.del('products:featured')
    await this.deps.cache.delPattern('categories:flat:*')
  }
}
