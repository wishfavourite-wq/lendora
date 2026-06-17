import type { Category, CategoryId } from '@lendora/shared'

export interface ICategoryRepository {
  findAll(activeOnly?: boolean): Promise<Category[]>
  findById(id: CategoryId): Promise<Category | null>
  findBySlug(slug: string): Promise<Category | null>
  findWithProductCounts(): Promise<(Category & { productCount: number })[]>
  findChildren(parentId: CategoryId): Promise<Category[]>
}
