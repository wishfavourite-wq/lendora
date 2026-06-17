'use client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast }  from 'sonner'
import { api }    from '@/lib/api'

export interface Payment {
  id:                   string
  rentalId:             string
  payerId:              string
  type:                 string
  amount:               number
  currency:             'BDT'
  method:               string
  status:               string
  externalReference:    string | null
  gatewayTransactionId: string | null
  initiatedAt:          string
  completedAt:          string | null
  failedAt:             string | null
  failureReason:        string | null
  createdAt:            string
}

export interface VendorPayout {
  id:              string
  vendorId:        string
  rentalId:        string
  amount:          number
  method:          string
  status:          string
  transactionRef:  string | null
  processedAt:     string | null
  failureReason:   string | null
  createdAt:       string
  // enriched from rental
  productName:     string | null
  rentalFee:       number
  platformFee:     number
  platformFeeRate: number
}

export interface InitiatePaymentResult {
  payment:     Payment
  redirectUrl: string
}

// ── Initiate payment ───────────────────────────────────────────────────────

export function useInitiatePayment() {
  return useMutation({
    mutationFn: async (input: { rentalId: string; method: 'BKASH' | 'NAGAD'; payerPhone?: string }) => {
      const { data } = await api.post<{ data: InitiatePaymentResult }>('/payments/initiate', input)
      return data.data
    },
    onSuccess: (result) => {
      // Redirect the browser to the gateway payment page
      window.location.href = result.redirectUrl
    },
    onError: () => toast.error('Failed to initiate payment. Please try again.'),
  })
}

// ── Payments for a rental ──────────────────────────────────────────────────

export function useRentalPayments(rentalId: string | undefined) {
  return useQuery<Payment[]>({
    queryKey: ['payments', 'rental', rentalId],
    queryFn:  async () => {
      const { data } = await api.get<{ data: Payment[] }>(`/payments/rental/${rentalId}`)
      return data.data
    },
    enabled: !!rentalId,
  })
}

// ── My payment history ─────────────────────────────────────────────────────

export function useMyPayments(page = 1) {
  return useQuery<{ items: Payment[]; total: number }>({
    queryKey: ['payments', 'my', page],
    queryFn:  async () => {
      const { data } = await api.get<{ data: { items: Payment[]; total: number } }>(`/payments/my?page=${page}`)
      return data.data
    },
  })
}

// ── Admin: release deposit ────────────────────────────────────────────────

export function useReleaseDeposit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { rentalId: string; deduction: number; reason?: string }) => {
      const { data } = await api.post<{ data: unknown }>(`/payments/rental/${input.rentalId}/release-deposit`, {
        deduction: input.deduction,
        reason:    input.reason,
      })
      return data.data
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['payments', 'rental', vars.rentalId] })
      qc.invalidateQueries({ queryKey: ['rentals'] })
      toast.success('Deposit released successfully')
    },
    onError: () => toast.error('Failed to release deposit'),
  })
}

// ── Admin: process vendor payout ──────────────────────────────────────────

export function useProcessPayout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (rentalId: string) => {
      const { data } = await api.post<{ data: { payout: VendorPayout; netAmount: number; platformFee: number } }>(
        '/payments/payouts/process',
        { rentalId },
      )
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payouts'] })
      toast.success('Payout processed successfully')
    },
    onError: () => toast.error('Failed to process payout'),
  })
}

// ── Vendor: my payouts ────────────────────────────────────────────────────

export function useMyPayouts(page = 1) {
  return useQuery<{ items: VendorPayout[]; total: number }>({
    queryKey: ['payouts', 'vendor', page],
    queryFn:  async () => {
      const { data } = await api.get<{ data: { items: VendorPayout[]; total: number } }>(`/payments/payouts?page=${page}`)
      return data.data
    },
  })
}
