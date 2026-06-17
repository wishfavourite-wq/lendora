'use client'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

export interface ApiTopSeller {
  id:                  string
  businessName:        string
  businessDescription: string | null
  district:            string
  division:            string
  averageRating:       number
  totalRentals:        number
  responseTimeMinutes: number | null
  verifiedAt:          string | null
  userName:            string
  avatarUrl:           string | null
  productCount:        number
  topProducts:         string[]
}

export function formatResponseTime(minutes: number | null): string {
  if (!minutes || minutes <= 0) return '< 24 hrs'
  if (minutes <= 60)  return '< 1 hr'
  if (minutes <= 120) return '< 2 hrs'
  if (minutes <= 180) return '< 3 hrs'
  if (minutes <= 1440) return `< ${Math.ceil(minutes / 60)} hrs`
  return '< 24 hrs'
}

export function useTopSellers(): ApiTopSeller[] | null {
  const [sellers, setSellers] = useState<ApiTopSeller[] | null>(null)

  useEffect(() => {
    api.get<{ data: ApiTopSeller[] }>('/vendors/top')
      .then(({ data }) => setSellers(data.data))
      .catch(() => setSellers([]))
  }, [])

  return sellers
}
