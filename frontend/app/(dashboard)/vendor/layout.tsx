'use client'
import { ProtectedRoute } from '@/components/shared/ProtectedRoute'

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute roles={['VENDOR', 'ADMIN', 'SUPER_ADMIN']}>
      {children}
    </ProtectedRoute>
  )
}
