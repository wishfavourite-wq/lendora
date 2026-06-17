import type { PrismaClient } from '@prisma/client'
import type { ICategoryRepository } from '@/application/ports/repositories/category.repository.port.js'
import type { Category, CategoryId } from '@lendora/shared'
import { asId } from '@lendora/shared'

interface PrismaCategory {
  id:          string
  name:        string
  slug:        string
  emoji:       string
  description: string | null
  parentId:    string | null
  sortOrder:   number
  isActive:    boolean
  createdAt:   Date
  updatedAt:   Date
}

export class PrismaCategoryRepository implements ICategoryRepository {
  constructor(private readonly db: PrismaClient) {}

  async findAll(): Promise<Category[]> {
    const rows = await this.db.category.findMany({
      where:   { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    })
    return rows.map(this.mapCategory)
  }

  async findById(id: CategoryId): Promise<Category | null> {
    const row = await this.db.category.findUnique({ where: { id } })
    return row ? this.mapCategory(row) : null
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const row = await this.db.category.findUnique({ where: { slug } })
    return row ? this.mapCategory(row) : null
  }

  async findRoots(): Promise<Category[]> {
    const rows = await this.db.category.findMany({
      where:   { parentId: null, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    })
    return rows.map(this.mapCategory)
  }

  async findChildren(parentId: CategoryId): Promise<Category[]> {
    const rows = await this.db.category.findMany({
      where:   { parentId, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    })
    return rows.map(this.mapCategory)
  }

  async findWithProductCounts(): Promise<(Category & { productCount: number })[]> {
    const rows = await this.db.category.findMany({
      where:   { isActive: true },
      include: {
        _count: { select: { products: { where: { status: 'ACTIVE', deletedAt: null } } } },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    })

    return rows.map((row) => ({
      ...this.mapCategory(row),
      productCount: row._count.products,
    }))
  }

  async create(data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> {
    const row = await this.db.category.create({
      data: {
        name:        data.name,
        slug:        data.slug,
        description: data.description ?? undefined,
        icon:        data.icon        ?? undefined,
        parentId:    data.parentId    ?? undefined,
        sortOrder:   data.sortOrder,
        isActive:    data.isActive,
      },
    })
    return this.mapCategory(row)
  }

  async update(id: CategoryId, data: Partial<Omit<Category, 'id' | 'createdAt'>>): Promise<Category> {
    const row = await this.db.category.update({
      where: { id },
      data:  {
        ...(data.name        !== undefined && { name:        data.name }),
        ...(data.description !== undefined && { description: data.description ?? undefined }),
        ...(data.icon        !== undefined && { icon:        data.icon        ?? undefined }),
        ...(data.sortOrder   !== undefined && { sortOrder:   data.sortOrder }),
        ...(data.isActive    !== undefined && { isActive:    data.isActive }),
      },
    })
    return this.mapCategory(row)
  }

  private mapCategory(row: PrismaCategory): Category {
    return {
      id:           asId<CategoryId>(row.id),
      name:         row.name,
      slug:         row.slug,
      emoji:        row.emoji,
      description:  row.description,
      parentId:     row.parentId ? asId<CategoryId>(row.parentId) : null,
      productCount: 0,
      isActive:     row.isActive,
    }
  }
}
