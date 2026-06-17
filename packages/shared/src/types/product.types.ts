import type { ProductStatus, ProductCondition } from '../enums/rental.enum.js'
import type { ProductId, VendorId, CategoryId, MediaId, UserId } from './brand.js'

export interface Category {
  readonly id:   CategoryId
  name:          string
  slug:          string
  emoji:         string
  description:   string | null
  parentId:      CategoryId | null
  productCount:  number
  isActive:      boolean
}

export interface ProductMedia {
  readonly id:   MediaId
  productId:     ProductId
  url:           string
  altText:       string | null
  sortOrder:     number
  isPrimary:     boolean
}

export interface Product {
  readonly id:            ProductId
  readonly vendorId:      VendorId
  categoryId:             CategoryId
  name:                   string
  slug:                   string
  description:            string
  pricePerDay:            number
  pricePerWeek:           number | null
  pricePerMonth:          number | null
  depositAmount:          number
  condition:              ProductCondition
  status:                 ProductStatus
  brand:                  string | null
  model:                  string | null
  district:               string
  division:               string
  address:                string | null
  availableFrom:          Date | null
  availableUntil:         Date | null
  minRentalDays:          number
  maxRentalDays:          number | null
  deliveryAvailable:      boolean
  deliveryFee:            number | null
  specifications:         Record<string, string> | null
  tags:                   string[]
  totalRentals:           number
  averageRating:          number
  reviewCount:            number
  quantity:               number
  isInstantBooking:       boolean
  media:                  ProductMedia[]
  readonly createdAt:     Date
  readonly updatedAt:     Date
}

export interface ProductAvailability {
  productId:        ProductId
  unavailableDates: DateRange[]
}

export interface DateRange {
  startDate: Date
  endDate:   Date
}

export interface ProductSearchFilters {
  query?:          string
  categoryId?:     CategoryId
  categorySlug?:   string
  district?:       string
  division?:       string
  minPrice?:       number
  maxPrice?:       number
  minRating?:      number
  condition?:      ProductCondition[]
  deliveryOnly?:   boolean
  instantBooking?: boolean
  availableFrom?:  Date
  availableUntil?: Date
}

export interface ProductSearchResult {
  items:      Product[]
  total:      number
  page:       number
  pageSize:   number
  totalPages: number
}

export interface WishlistItem {
  readonly productId: ProductId
  readonly userId:    UserId
  readonly addedAt:   Date
  product:            Product
}
