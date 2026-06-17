'use client'
import { useEffect, useState } from 'react'
import { useRouter }           from 'next/navigation'
import { useAuthStore }        from '@/store/auth.store'
import type { AuthUser }       from '@/store/auth.store'

interface Props {
  children:  React.ReactNode
  roles?:    AuthUser['role'][]
  fallback?: string
}

export function ProtectedRoute({ children, roles, fallback = '/login' }: Props) {
  const router  = useRouter()
  const user    = useAuthStore((s) => s.user)
  const [ready, setReady] = useState(false)

  /* Wait one tick for Zustand persist to rehydrate from localStorage */
  useEffect(() => { setReady(true) }, [])

  useEffect(() => {
    if (!ready) return
    if (!user) { router.replace(fallback); return }
    if (roles && !roles.includes(user.role)) router.replace('/')
  }, [ready, user, router, roles, fallback])

  if (!ready) return null
  if (!user)  return null
  if (roles && !roles.includes(user.role)) return null

  return <>{children}</>
}
