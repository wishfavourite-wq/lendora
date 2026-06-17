import axios, { type AxiosError, type AxiosRequestConfig } from 'axios'

const BASE_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000/api/v1'

export const api = axios.create({
  baseURL:         BASE_URL,
  withCredentials: true,
  headers:         { 'Content-Type': 'application/json' },
})

// Attach access token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = sessionStorage.getItem('accessToken')
    if (token) config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = []

function drainQueue(token: string | null, error: unknown = null) {
  failedQueue.forEach((p) => (token ? p.resolve(token) : p.reject(error)))
  failedQueue = []
}

const AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh']

// Auto-refresh on 401 — skip for auth endpoints to avoid circular behaviour
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean }
    const isAuthEndpoint = AUTH_PATHS.some((p) => original.url?.includes(p))
    if (error.response?.status !== 401 || original._retry || isAuthEndpoint) return Promise.reject(error)

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then((token) => {
        original.headers = { ...original.headers, Authorization: `Bearer ${token}` }
        return api(original)
      })
    }

    original._retry = true
    isRefreshing = true

    try {
      const { data } = await api.post<{ data: { accessToken: string } }>('/auth/refresh', {})
      const newToken = data.data.accessToken
      if (typeof window !== 'undefined') sessionStorage.setItem('accessToken', newToken)
      drainQueue(newToken)
      original.headers = { ...original.headers, Authorization: `Bearer ${newToken}` }
      return api(original)
    } catch (refreshError) {
      drainQueue(null, refreshError)
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('accessToken')
        window.location.href = '/login'
      }
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export type ApiResponse<T> = { success: true; data: T }
export type ApiError      = { success: false; error: { code: string; message: string; fields?: Record<string, string[]> } }
