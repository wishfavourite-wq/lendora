'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'sonner'

export interface RentalSummary {
  id:            string
  status:        string
  startDate:     string
  endDate:       string
  totalDays:     number
  totalAmount:   number
  depositAmount: number
  depositStatus: string
  createdAt:     string
  pricePerDay:   number
  lateDays:      number
  lateFeeAmount: number
  productName:   string
  productImage:  string | null
  vendorName:    string
  renterName:    string
}

export interface ReturnRecordSummary {
  id:                  string
  condition:           string
  damageDescription:   string | null
  damageAmount:        number | null
  lateDays:            number | null
  latePenalty:         number | null
  outstandingDue:      number | null
  depositDeduction:    number
  depositRefund:       number
  adminReviewRequired: boolean
  createdAt:           string
}

export interface Rental {
  id:                   string
  productId:            string
  renterId:             string
  vendorId:             string
  status:               string
  startDate:            string
  endDate:              string
  totalDays:            number
  pricePerDay:          number
  rentalFee:            number
  depositAmount:        number
  depositStatus:        string
  platformFeeRate:      number
  platformFee:          number
  vendorPayout:         number
  deliveryFee:          number
  totalAmount:          number
  deliveryAddress:      string | null
  pickupAddress:        string | null
  returnAddress:        string | null
  renterNotes:          string | null
  vendorNotes:          string | null
  lateDays:             number
  lateFeeAmount:        number
  confirmedAt:          string | null
  startedAt:            string | null
  returnInitiatedAt:    string | null
  returnReceivedAt:     string | null
  completedAt:          string | null
  cancelledAt:          string | null
  cancellationReason:   string | null
  cancellationNote:     string | null
  createdAt:            string
  updatedAt:            string
  // Shipment fields
  shipmentMethod:       string | null
  trackingNumber:       string | null
  estimatedDeliveryDate: string | null
  shippedAt:            string | null
  deliveredAt:          string | null
  // Return fields
  returnMethod:         string | null
  returnDate:           string | null
  returnTrackingNumber: string | null
  returnRecord:         ReturnRecordSummary | null
  // Courier fields
  selectedDelivery:     string | null
  courierForwardFee:    number | null
  courierReturnFee:     number | null
}

export interface CreateRentalInput {
  productId:        string
  startDate:        string
  endDate:          string
  selectedDelivery?: string
  deliveryAddress?:  string
  pickupAddress?:    string
  renterNotes?:      string
}

export function useMyRentals(status?: string, options?: { refetchInterval?: number | false }) {
  return useQuery({
    queryKey: ['rentals', 'mine', status ?? 'all'],
    queryFn:  async () => {
      const params: Record<string, string> = {}
      if (status) params['status'] = status
      const { data } = await api.get<{ data: { items: RentalSummary[]; total: number } }>('/rentals', { params })
      return data.data
    },
    enabled: true,
    ...options,
  })
}

export function useDemoMode() {
  return useQuery<boolean>({
    queryKey: ['settings', 'demo-mode'],
    queryFn:  async () => {
      const { data } = await api.get<{ data: { enabled: boolean } }>('/stats/demo-mode')
      return data.data.enabled
    },
    refetchInterval: 30_000,
  })
}

export function useRental(id: string) {
  return useQuery({
    queryKey: ['rentals', id],
    queryFn:  async () => {
      const { data } = await api.get<{ data: RentalSummary }>(`/rentals/${id}`)
      return data.data
    },
    enabled: !!id,
  })
}

export function useCreateRental() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateRentalInput) => {
      const { data } = await api.post<{ data: Rental }>('/rentals', input)
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rentals'] })
    },
    onError: (err: any) => {
      const code = err.response?.data?.error?.code
      const msg  = code === 'PRODUCT_UNAVAILABLE'
        ? 'These dates are already booked. Please choose different dates.'
        : err.response?.data?.error?.message ?? 'Failed to create rental'
      toast.error(msg)
    },
  })
}

export interface RenterProfile {
  name:      string
  phone:     string | null
  avatarUrl: string | null
  address:   string | null
  createdAt: string
}

export function useRenterInfo(rentalId: string | undefined) {
  return useQuery<RenterProfile>({
    queryKey: ['rentals', rentalId, 'renter-info'],
    queryFn:  async () => {
      const { data } = await api.get<{ data: RenterProfile }>(`/rentals/${rentalId}/renter-info`)
      return data.data
    },
    enabled: !!rentalId,
  })
}

export function useDeclineRental() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, note }: { id: string; note?: string }) => {
      const { data } = await api.post<{ data: RentalSummary }>(`/rentals/${id}/cancel`, {
        reason: 'VENDOR_UNAVAILABLE',
        note,
      })
      return data.data
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['rentals'] })
      qc.invalidateQueries({ queryKey: ['rentals', vars.id] })
      toast.success('Rental request declined.')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message ?? 'Failed to decline rental')
    },
  })
}

export function useRejectRental() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, note }: { id: string; note: string }) => {
      const { data } = await api.post<{ data: RentalSummary }>(`/rentals/${id}/cancel`, {
        reason: 'OTHER',
        note,
      })
      return data.data
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['rentals'] })
      qc.invalidateQueries({ queryKey: ['rentals', vars.id] })
      toast.success('Rental request rejected.')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message ?? 'Failed to reject rental')
    },
  })
}

export function useMarkReady() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<{ data: Rental }>(`/rentals/${id}/mark-ready`)
      return data.data
    },
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['rentals', id] })
      qc.invalidateQueries({ queryKey: ['rentals'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message ?? 'Payment failed. Please try again.')
    },
  })
}

export interface ShipRentalInput {
  id:                   string
  shipmentMethod:       string
  trackingNumber?:      string
  estimatedDeliveryDate?: string
}

export function useShipRental() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...body }: ShipRentalInput) => {
      const { data } = await api.post<{ data: Rental }>(`/rentals/${id}/dispatch`, body)
      return data.data
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['rentals', vars.id] })
      qc.invalidateQueries({ queryKey: ['rentals'] })
      toast.success('Product shipped! Waiting for customer to confirm receipt.')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message ?? 'Failed to ship. Please try again.')
    },
  })
}

export function useMarkCollected() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<{ data: Rental }>(`/rentals/${id}/mark-collected`)
      return data.data
    },
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['rentals', id] })
      qc.invalidateQueries({ queryKey: ['rentals'] })
      toast.success('Item marked as collected! Rental period is now active.')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message ?? 'Failed to mark as collected.')
    },
  })
}

export function useConfirmReceipt() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<{ data: Rental }>(`/rentals/${id}/confirm-receipt`)
      return data.data
    },
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['rentals', id] })
      qc.invalidateQueries({ queryKey: ['rentals'] })
      toast.success('Receipt confirmed! Your rental period is now active.')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message ?? 'Failed to confirm receipt.')
    },
  })
}

export function useCancelRental() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, reason, note }: { id: string; reason: string; note?: string }) => {
      const { data } = await api.post<{ data: RentalSummary }>(`/rentals/${id}/cancel`, { reason, note })
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rentals'] })
      toast.success('Rental cancelled.')
    },
  })
}

export function useConfirmRental() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, pickupAddress, returnAddress }: { id: string; pickupAddress?: string; returnAddress?: string }) => {
      const body: Record<string, string> = {}
      if (pickupAddress) body['pickupAddress'] = pickupAddress
      if (returnAddress) body['returnAddress'] = returnAddress
      const { data } = await api.post<{ data: RentalSummary }>(`/rentals/${id}/confirm`, body)
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rentals'] })
      toast.success('Rental confirmed!')
    },
  })
}

export function useUpdatePickupAddress() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, pickupAddress }: { id: string; pickupAddress: string }) => {
      const { data } = await api.patch<{ data: { pickupAddress: string } }>(`/rentals/${id}/pickup-address`, { pickupAddress })
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rentals'] })
      toast.success('Pickup address saved!')
    },
  })
}

export function useUpdateReturnAddress() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, returnAddress }: { id: string; returnAddress: string }) => {
      const { data } = await api.patch<{ data: { returnAddress: string } }>(`/rentals/${id}/return-address`, { returnAddress })
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rentals'] })
      toast.success('Return address saved!')
    },
  })
}

export interface LateFeeTransaction {
  id:               string
  lateDays:         number
  dailyRate:        number
  amount:           number
  totalLateFee:     number
  depositRemaining: number
  createdAt:        string
}

export interface LateFeeHistory {
  lateDays:         number
  lateFeeAmount:    number
  depositRemaining: number
  transactions:     LateFeeTransaction[]
}

export function useLateFeeHistory(rentalId?: string) {
  return useQuery({
    queryKey: ['rentals', rentalId, 'late-fee-history'],
    queryFn:  async () => {
      const { data } = await api.get<{ data: LateFeeHistory }>(`/rentals/${rentalId}/late-fee-history`)
      return data.data
    },
    enabled: !!rentalId,
  })
}

export function useExtendRental() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, newEndDate }: { id: string; newEndDate: string }) => {
      const { data } = await api.post<{ data: Rental }>(`/rentals/${id}/extend`, { newEndDate })
      return data.data
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['rentals', vars.id] })
      qc.invalidateQueries({ queryKey: ['rentals'] })
      toast.success('Rental period extended successfully.')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message ?? 'Failed to extend rental.')
    },
  })
}

export interface InitiateReturnInput {
  id:                   string
  returnMethod:         'SELLER_PICKUP' | 'COURIER_RETURN' | 'CUSTOMER_DROPOFF'
  returnDate?:          string
  returnTrackingNumber?: string
}

export function useInitiateReturn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...body }: InitiateReturnInput) => {
      const { data } = await api.post<{ data: Rental }>(`/rentals/${id}/initiate-return`, body)
      return data.data
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['rentals', vars.id] })
      qc.invalidateQueries({ queryKey: ['rentals'] })
      toast.success('Return requested! The seller will inspect and confirm.')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message ?? 'Failed to initiate return.')
    },
  })
}

interface ConfirmReturnInput {
  id:                string
  condition:         'PERFECT' | 'GOOD' | 'MINOR_DAMAGE' | 'MAJOR_DAMAGE' | 'DAMAGED'
  damageDescription?: string
  damageAmount?:     number
  photos?:           File[]
}

export function useConfirmReturn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, condition, damageDescription, damageAmount, photos }: ConfirmReturnInput) => {
      if (photos && photos.length > 0) {
        const fd = new FormData()
        fd.append('condition', condition)
        if (damageDescription) fd.append('damageDescription', damageDescription)
        if (damageAmount != null) fd.append('damageAmount', String(damageAmount))
        photos.forEach((f) => fd.append('files', f))
        const { data } = await api.post<{ data: any }>(`/rentals/${id}/confirm-return`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        return data.data
      }
      const { data } = await api.post<{ data: any }>(`/rentals/${id}/confirm-return`, {
        condition, damageDescription, damageAmount,
      })
      return data.data
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['rentals', vars.id] })
      qc.invalidateQueries({ queryKey: ['rentals'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message ?? 'Failed to confirm return.')
    },
  })
}
