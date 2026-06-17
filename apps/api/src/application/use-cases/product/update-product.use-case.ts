import type { IProductRepository } from '@/application/ports/repositories/product.repository.port.js'
import type { IVendorRepository }  from '@/application/ports/repositories/vendor.repository.port.js'
import type { ICache }             from '@/application/ports/services/cache.service.port.js'
import type { Product, ProductId, UserId } from '@lendora/shared'
import { DomainError }             from '@/domain/errors/index.js'

interface Deps {
  productRepo: IProductRepository
  vendorRepo:  IVendorRepository
  cache:       ICache
}

export class UpdateProductUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(
    productId: ProductId,
    userId:    UserId,
    data:      Partial<Omit<Product, 'id' | 'createdAt' | 'vendorId'>>,
  ): Promise<Product> {
    const product = await this.deps.productRepo.findById(productId)
    if (!product) throw new DomainError('PRODUCT_NOT_FOUND', 'Product not found', 404)

    const vendor = await this.deps.vendorRepo.findByUserId(userId)
    if (!vendor || vendor.id !== product.vendorId) {
      throw new DomainError('FORBIDDEN', 'You do not own this product', 403)
    }

    const updated = await this.deps.productRepo.update(productId, data)
    await this.deps.cache.del(`product:${productId}`)
    await this.deps.cache.del('products:featured')
    return updated
  }
}
