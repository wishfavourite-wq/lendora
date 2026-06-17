'use client'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface CategoryItem {
  id:           string
  name:         string
  slug:         string
  emoji:        string
  parentId:     string | null
  productCount: number
}

export function useCategories() {
  return useQuery({
    queryKey:  ['categories'],
    queryFn:   async () => {
      const { data } = await api.get<{ data: CategoryItem[] }>('/categories')
      return data.data
    },
    staleTime: 300_000,
  })
}
