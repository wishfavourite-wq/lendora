'use client'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

export interface PlatformStats {
  products:      number
  vendors:       number
  activeRentals: number
  cities:        number
  todayRentals:  number
}

export function useStats(): PlatformStats | null {
  const [stats, setStats] = useState<PlatformStats | null>(null)

  useEffect(() => {
    api.get<{ data: PlatformStats }>('/stats')
      .then(({ data }) => setStats(data.data))
      .catch(() => {/* backend unavailable — leave null */})
  }, [])

  return stats
}

export function formatCount(n: number): string {
  if (n >= 1_000_000) return `৳${(n / 1_000_000).toFixed(1)}M+`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K+`
  return String(n)
}
