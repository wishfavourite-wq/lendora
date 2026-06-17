'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api }     from '@/lib/api'

export interface AuthUser {
  id:       string
  email:    string
  name:     string
  role:     'RENTER' | 'CUSTOMER' | 'VENDOR' | 'ADMIN' | 'SUPER_ADMIN'
  avatarUrl: string | null
}

interface AuthState {
  user:         AuthUser | null
  accessToken:  string | null
  isLoading:    boolean

  login(email: string, password: string): Promise<void>
  register(data: { email: string; password: string; name: string; phone?: string; role?: 'RENTER' | 'VENDOR' }): Promise<void>
  logout(): Promise<void>
  setUser(user: AuthUser): void
  setToken(token: string): void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user:        null,
      accessToken: null,
      isLoading:   false,

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const { data } = await api.post<{ data: { accessToken: string; user: AuthUser } }>('/auth/login', { email, password })
          const { accessToken, user } = data.data
          sessionStorage.setItem('accessToken', accessToken)
          set({ user, accessToken, isLoading: false })
        } catch (err) {
          set({ isLoading: false })
          throw err
        }
      },

      register: async (input) => {
        set({ isLoading: true })
        try {
          const { data } = await api.post<{ data: { accessToken: string; user: AuthUser } }>('/auth/register', input)
          const { accessToken, user } = data.data
          sessionStorage.setItem('accessToken', accessToken)
          set({ user, accessToken, isLoading: false })
        } catch (err) {
          set({ isLoading: false })
          throw err
        }
      },

      logout: async () => {
        try {
          await api.post('/auth/logout')
        } finally {
          sessionStorage.removeItem('accessToken')
          set({ user: null, accessToken: null })
        }
      },

      setUser:  (user)  => set({ user }),
      setToken: (token) => {
        if (typeof window !== 'undefined') sessionStorage.setItem('accessToken', token)
        set({ accessToken: token })
      },
    }),
    {
      name:    'lendora-auth',
      partialize: (s) => ({ user: s.user }),
    }
  )
)
