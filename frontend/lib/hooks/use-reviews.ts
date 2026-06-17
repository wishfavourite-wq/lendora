'use client'
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api }   from '@/lib/api'
import { toast } from 'sonner'

/* ── Homepage featured reviews ───────────────────────────────────────────── */

export interface ApiReview {
  id:              string
  rating:          number
  body:            string
  daysAgo:         number
  productName:     string
  reviewerName:    string
  reviewerInitial: string
}

export interface ReviewStats {
  averageRating:     number | null
  totalReviews:      number
  depositReturnRate: number | null
}

interface ReviewsResponse {
  reviews: ApiReview[]
  stats:   ReviewStats
}

export function useReviews(): ReviewsResponse | null {
  const [data, setData] = useState<ReviewsResponse | null>(null)

  useEffect(() => {
    api.get<{ data: ReviewsResponse }>('/reviews/featured')
      .then(({ data: res }) => setData(res.data))
      .catch(() => setData({ reviews: [], stats: { averageRating: null, totalReviews: 0, depositReturnRate: null } }))
  }, [])

  return data
}

/* ── Review for a specific rental ────────────────────────────────────────── */

export interface RentalReview {
  id:              string
  rentalId:        string
  reviewerId:      string
  productId:       string
  vendorId:        string
  rating:          number
  title:           string | null
  body:            string
  vendorReply:     string | null
  vendorRepliedAt: string | null
  helpfulCount:    number
  isVerified:      boolean
  createdAt:       string
  reviewerName:    string | null
  reviewerAvatar:  string | null
}

export function useRentalReview(rentalId: string | undefined) {
  return useQuery<RentalReview | null>({
    queryKey: ['reviews', 'rental', rentalId],
    queryFn:  async () => {
      const { data } = await api.get<{ data: RentalReview | null }>(`/reviews/rental/${rentalId}`)
      return data.data
    },
    enabled: !!rentalId,
  })
}

/* ── Submit review (customer) ────────────────────────────────────────────── */

export interface SubmitReviewInput {
  rentalId: string
  rating:   number
  title?:   string
  body:     string
}

export function useSubmitReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: SubmitReviewInput) => {
      const { data } = await api.post<{ data: RentalReview }>('/reviews', input)
      return data.data
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['reviews', 'rental', vars.rentalId] })
      qc.invalidateQueries({ queryKey: ['rentals'] })
      toast.success('Review submitted! Thank you for your feedback.')
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message ?? 'Failed to submit review.'
      toast.error(msg)
    },
  })
}

/* ── Vendor reply to review ──────────────────────────────────────────────── */

export function useVendorReply() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ reviewId, reply, rentalId }: { reviewId: string; reply: string; rentalId: string }) => {
      const { data } = await api.post<{ data: RentalReview }>(`/reviews/${reviewId}/reply`, { reply })
      return data.data
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['reviews', 'rental', vars.rentalId] })
      toast.success('Reply posted.')
    },
    onError: () => toast.error('Failed to post reply.'),
  })
}

/* ── Vendor feedback for a customer ──────────────────────────────────────── */

export interface VendorFeedback {
  id:         string
  rentalId:   string
  vendorId:   string
  customerId: string
  rating:     number
  comment:    string | null
  createdAt:  string
}

export function useRentalVendorFeedback(rentalId: string | undefined) {
  return useQuery<VendorFeedback | null>({
    queryKey: ['vendor-feedback', 'rental', rentalId],
    queryFn:  async () => {
      const { data } = await api.get<{ data: VendorFeedback | null }>(`/reviews/vendor-feedback/rental/${rentalId}`)
      return data.data
    },
    enabled: !!rentalId,
  })
}

export function useSubmitVendorFeedback() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { rentalId: string; rating: number; comment?: string }) => {
      const { data } = await api.post<{ data: VendorFeedback }>('/reviews/vendor-feedback', input)
      return data.data
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['vendor-feedback', 'rental', vars.rentalId] })
      toast.success('Customer feedback submitted.')
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message ?? 'Failed to submit feedback.'
      toast.error(msg)
    },
  })
}
