'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface AppNotification {
  id:        string
  type:      string
  title:     string
  body:      string
  data:      Record<string, unknown> | null
  readAt:    string | null
  createdAt: string
}

export interface NotificationsResponse {
  items:  AppNotification[]
  unread: number
}

export function useNotifications() {
  return useQuery<NotificationsResponse>({
    queryKey: ['notifications'],
    queryFn:  async () => {
      const res = await api.get('/notifications')
      return res.data.data as NotificationsResponse
    },
    refetchInterval: 30_000,
    staleTime:       20_000,
  })
}

export function useMarkAllRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}

export function useMarkOneRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}
