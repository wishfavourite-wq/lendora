'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface ProductSummary {
  id:               string
  name:             string
  slug:             string
  pricePerDay:      number
  depositAmount:    number
  condition:        string
  averageRating:    number
  reviewCount:      number
  totalRentals:     number
  district:         string
  division:         string
  deliveryAvailable: boolean
  isInstantBooking: boolean
  minRentalDays:    number
  maxRentalDays:    number | null
  availableFrom:    string | null
  availableUntil:   string | null
  deliveryOptions:  string[]
  isAvailableNow:   boolean
  media:            Array<{ url: string; altText: string | null; isPrimary: boolean }>
  vendorId:         string
  vendorName:       string
  vendorAvatarUrl:  string | null
}

export interface ProductDetail extends ProductSummary {
  description:    string
  categoryId:     string
  vendorId:       string
  brand:          string | null
  model:          string | null
  deliveryFee:     number | null
  specifications:  Record<string, string> | null
  tags:            string[]
  pricePerWeek:    number | null
  pricePerMonth:   number | null
}

export interface SearchFilters {
  q?:              string
  categoryId?:     string
  district?:       string
  minPrice?:       number
  maxPrice?:       number
  minRating?:      number
  availableFrom?:  string
  availableUntil?: string
  deliveryOnly?:   boolean
  instantBooking?: boolean
  page?:           number
  limit?:          number
}

export function useProductSearch(filters: SearchFilters) {
  return useQuery({
    queryKey:  ['products', 'search', filters],
    queryFn:   async () => {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== undefined && v !== '')
      )
      const { data } = await api.get<{ data: { items: ProductSummary[]; total: number; page: number; totalPages: number } }>('/products', { params })
      return data.data
    },
    staleTime: 30_000,
  })
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['products', slug],
    queryFn:  async () => {
      const { data } = await api.get<{ data: ProductDetail }>(`/products/${slug}`)
      return data.data
    },
    enabled:  !!slug,
  })
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: ['products', 'featured'],
    queryFn:  async () => {
      const { data } = await api.get<{ data: ProductSummary[] }>('/products/featured')
      return data.data
    },
    staleTime: 300_000,
  })
}

export function useProductAvailability(productId: string) {
  return useQuery({
    queryKey: ['products', productId, 'availability'],
    queryFn:  async () => {
      const { data } = await api.get<{ data: { unavailableDates: string[] } }>(`/products/${productId}/availability`)
      return data.data.unavailableDates.map((d) => new Date(d))
    },
    enabled: !!productId,
  })
}
