import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBDT(amount: number): string {
  return '৳' + new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatShort(amount: number): string {
  if (amount >= 1_000_000) return `৳${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000)     return `৳${(amount / 1_000).toFixed(0)}K`
  return `৳${amount}`
}
