import type {
  Product, ProductId, VendorId, CategoryId,
  ProductSearchFilters, ProductSearchResult, DateRange,
} from '@lendora/shared'

export interface IProductRepository {
  findById(id: ProductId): Promise<Product | null>
  findBySlug(slug: string): Promise<Product | null>
  findByVendorId(vendorId: VendorId, page?: number, limit?: number, status?: string): Promise<{ items: Product[]; total: number }>
  search(filters: ProductSearchFilters, page: number, limit: number): Promise<ProductSearchResult>
  findFeatured(limit: number): Promise<Product[]>
  findRecent(limit: number): Promise<Product[]>

  create(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'totalRentals' | 'averageRating' | 'reviewCount' | 'media'>, mediaUrls?: string[]): Promise<Product>
  update(id: ProductId, data: Partial<Omit<Product, 'id' | 'createdAt' | 'vendorId'>>): Promise<Product>
  softDelete(id: ProductId): Promise<void>

  getUnavailableDates(id: ProductId): Promise<Date[]>
  isAvailableForRange(id: ProductId, range: DateRange): Promise<boolean>
  blockDates(id: ProductId, dates: Date[], reason?: string): Promise<void>
  unblockDates(id: ProductId, dates: Date[]): Promise<void>

  updateRatingCache(id: ProductId, avg: number, count: number): Promise<void>
  incrementRentalCount(id: ProductId): Promise<void>

  findByCategory(categoryId: CategoryId, page: number, limit: number): Promise<ProductSearchResult>
}
