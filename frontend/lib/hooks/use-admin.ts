'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api }   from '@/lib/api'
import { toast } from 'sonner'

export interface AdminStats {
  totalUsers:       number
  totalVendors:     number
  activeCustomers:  number
  totalProducts:    number
  openDisputes:     number
  pendingVendors:   number
  pendingCustomers: number
  pendingProducts:  number
  totalRentals:     number
  activeRentals:    number
  pendingRentals:   number
  totalCommission:  number
}

export interface AdminRentalRow {
  id:               string
  renterName:       string
  renterEmail:      string
  vendorName:       string
  productName:      string
  status:           string
  startDate:        string
  endDate:          string
  totalDays:        number
  pricePerDay:      number
  rentalFee:        number
  platformFee:      number
  depositAmount:    number
  depositStatus:    string
  totalAmount:      number
  lateDays:         number
  lateFeeAmount:    number
  depositRemaining: number
  createdAt:        string
}

export interface AdminPaymentRow {
  id:        string
  rentalId:  string
  payerName: string
  vendorName: string
  type:      string
  amount:    number
  method:    string
  status:    string
  reference: string | null
  createdAt: string
}

export interface AdminReturnRow {
  id:                string
  rentalId:          string
  renterName:        string
  vendorName:        string
  productName:       string
  condition:         string
  damageDescription: string | null
  damageAmount:      number
  depositDeduction:  number
  depositRefund:     number
  depositPaid:       number
  depositStatus:     string
  createdAt:         string
}

export interface AdminDepositRow {
  id:               string
  renterName:       string
  vendorName:       string
  productName:      string
  depositAmount:    number
  depositStatus:    string
  depositDeduction: number
  depositRefund:    number
  condition:        string | null
  rentalStatus:     string
  updatedAt:        string
}

export interface AdminCommissionRow {
  id:              string
  vendorName:      string
  productName:     string
  rentalFee:       number
  platformFeeRate: number
  platformFee:     number
  status:          string
  createdAt:       string
}

// ── Vendor types ──────────────────────────────────────────────────────────────

export interface PendingVendorDetail {
  id:                  string
  userId:              string
  businessName:        string
  businessDescription: string | null
  businessAddress:     string | null
  district:            string
  division:            string
  bkashNumber:         string | null
  nidNumber:           string | null
  nidFrontImageUrl:    string | null
  nidBackImageUrl:     string | null
  status:              string
  createdAt:           string
  // joined from user
  userName:            string
  userEmail:           string
  userPhone:           string | null
  userAvatarUrl:       string | null
  userAddress:         string | null
}

export interface VendorRow {
  id:                  string
  businessName:        string
  district:            string
  division:            string
  status:              string
  averageRating:       number
  totalRentals:        number
  totalEarnings:       number
  responseTimeMinutes: number
  createdAt:           string
}

export interface ActiveVendorRow {
  id:            string
  userId:        string
  businessName:  string
  district:      string
  division:      string
  status:        string
  averageRating: number
  totalRentals:  number
  totalEarnings: number
  createdAt:     string
  userName:      string
  userEmail:     string
}

export interface SuspendedVendorRow {
  id:               string
  userId:           string
  businessName:     string
  district:         string
  division:         string
  status:           string
  suspensionReason: string | null
  createdAt:        string
  userName:         string
  userEmail:        string
}

// ── Customer types ────────────────────────────────────────────────────────────

export interface PendingCustomerDetail {
  id:               string
  name:             string
  email:            string
  phone:            string | null
  address:          string | null
  avatarUrl:        string | null
  nidNumber:        string | null
  nidFrontImageUrl: string | null
  nidBackImageUrl:  string | null
  bkashNumber:      string | null
  status:           string
  createdAt:        string
}

export interface UserRow {
  id:              string
  name:            string
  email:           string
  phone:           string | null
  role:            string
  status:          string
  emailVerifiedAt: string | null
  lastLoginAt:     string | null
  createdAt:       string
}

export interface DisputeRow {
  id:            string
  rentalId:      string
  type:          string
  status:        string
  description:   string
  claimedAmount: number | null
  raisedById:    string
  againstId:     string
  createdAt:     string
  resolvedAt:    string | null
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export interface AdminAnalytics {
  monthly:    { month: string; rentals: number; revenue: number }[]
  categories: { name: string; count: number; pct: number }[]
  topVendors: { name: string; rentals: number; revenue: number; rating: number }[]
}

export function useAdminAnalytics() {
  return useQuery<AdminAnalytics>({
    queryKey: ['admin', 'analytics'],
    queryFn:  async () => {
      const { data } = await api.get<{ data: AdminAnalytics }>('/admin/analytics')
      return data.data
    },
    staleTime: 60_000,
  })
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export function useAdminStats() {
  return useQuery<AdminStats>({
    queryKey:  ['admin', 'stats'],
    staleTime: 0,
    queryFn:   async () => {
      const { data } = await api.get<{ data: AdminStats }>('/admin/stats')
      return data.data
    },
  })
}

// ── Vendors ───────────────────────────────────────────────────────────────────

export function usePendingVendors(page = 1, limit = 20) {
  return useQuery<{ items: PendingVendorDetail[]; total: number }>({
    queryKey: ['admin', 'vendors', 'pending', page],
    queryFn:  async () => {
      const { data } = await api.get<{ data: { items: PendingVendorDetail[]; total: number } }>(
        '/admin/vendors/pending', { params: { page, limit } }
      )
      return data.data
    },
    staleTime: 0,
  })
}

export function useAllVendors(page = 1, limit = 20) {
  return useQuery<{ items: VendorRow[]; total: number }>({
    queryKey: ['admin', 'vendors', 'all', page],
    queryFn:  async () => {
      const { data } = await api.get<{ data: { items: VendorRow[]; total: number } }>(
        '/admin/vendors/all', { params: { page, limit } }
      )
      return data.data
    },
  })
}

export function useActiveVendors(page = 1, limit = 20) {
  return useQuery<{ items: ActiveVendorRow[]; total: number }>({
    queryKey:  ['admin', 'vendors', 'active', page],
    staleTime: 0,
    queryFn:   async () => {
      const { data } = await api.get<{ data: { items: ActiveVendorRow[]; total: number } }>(
        '/admin/vendors/active', { params: { page, limit } }
      )
      return data.data
    },
  })
}

export function useSuspendedVendors(page = 1, limit = 20) {
  return useQuery<{ items: SuspendedVendorRow[]; total: number }>({
    queryKey:  ['admin', 'vendors', 'suspended', page],
    staleTime: 0,
    queryFn:   async () => {
      const { data } = await api.get<{ data: { items: SuspendedVendorRow[]; total: number } }>(
        '/admin/vendors/suspended', { params: { page, limit } }
      )
      return data.data
    },
  })
}

export interface VendorProfileDetail {
  id:                  string
  userId:              string
  businessName:        string
  businessDescription: string | null
  businessAddress:     string | null
  district:            string
  division:            string
  bkashNumber:         string | null
  nidNumber:           string | null
  nidFrontImageUrl:    string | null
  nidBackImageUrl:     string | null
  status:              string
  suspensionReason:    string | null
  verifiedAt:          string | null
  totalRentals:        number
  totalEarnings:       number
  averageRating:       number
  createdAt:           string
  userName:            string
  userEmail:           string
  userPhone:           string | null
  userAddress:         string | null
  userAvatarUrl:       string | null
}

export function useVendorProfile(id: string | null) {
  return useQuery<VendorProfileDetail>({
    queryKey: ['admin', 'vendors', 'profile', id],
    queryFn:  async () => {
      const { data } = await api.get<{ data: VendorProfileDetail }>(`/admin/vendors/${id}`)
      return data.data
    },
    enabled: !!id,
  })
}

export function useApproveVendor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => { await api.post(`/admin/vendors/${id}/approve`) },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'vendors'] })
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
      toast.success('Vendor approved.')
    },
    onError: () => toast.error('Failed to approve vendor.'),
  })
}

export function useRejectVendor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      await api.post(`/admin/vendors/${id}/reject`, { reason })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'vendors'] })
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
      toast.success('Vendor rejected.')
    },
    onError: () => toast.error('Failed to reject vendor.'),
  })
}

export function useSuspendVendor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      await api.post(`/admin/vendors/${id}/suspend`, { reason })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'vendors'] })
      toast.success('Vendor suspended.')
    },
    onError: () => toast.error('Failed to suspend vendor.'),
  })
}

export function useDeleteVendor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => { await api.delete(`/admin/vendors/${id}`) },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'vendors'] })
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
      toast.success('Vendor deleted.')
    },
    onError: () => toast.error('Failed to delete vendor.'),
  })
}

// ── Customers ─────────────────────────────────────────────────────────────────

export function usePendingCustomers(page = 1, limit = 20) {
  return useQuery<{ items: PendingCustomerDetail[]; total: number }>({
    queryKey:  ['admin', 'customers', 'pending', page],
    staleTime: 0,
    queryFn:   async () => {
      const { data } = await api.get<{ data: { items: PendingCustomerDetail[]; total: number } }>(
        '/admin/customers/pending', { params: { page, limit } }
      )
      return data.data
    },
  })
}

export function useApprovedCustomers(page = 1, limit = 20) {
  return useQuery<{ items: PendingCustomerDetail[]; total: number }>({
    queryKey:  ['admin', 'customers', 'approved', page],
    staleTime: 0,
    queryFn:   async () => {
      const { data } = await api.get<{ data: { items: PendingCustomerDetail[]; total: number } }>(
        '/admin/customers/approved', { params: { page, limit } }
      )
      return data.data
    },
  })
}

export function useDeclinedCustomers(page = 1, limit = 20) {
  return useQuery<{ items: PendingCustomerDetail[]; total: number }>({
    queryKey:  ['admin', 'customers', 'declined', page],
    staleTime: 0,
    queryFn:   async () => {
      const { data } = await api.get<{ data: { items: PendingCustomerDetail[]; total: number } }>(
        '/admin/customers/declined', { params: { page, limit } }
      )
      return data.data
    },
  })
}

export interface CustomerProfile extends PendingCustomerDetail {
  role:            string
  emailVerifiedAt: string | null
  lastLoginAt:     string | null
}

export function useCustomerProfile(id: string | null) {
  return useQuery<CustomerProfile>({
    queryKey: ['admin', 'customers', 'profile', id],
    queryFn:  async () => {
      const { data } = await api.get<{ data: CustomerProfile }>(`/admin/customers/${id}`)
      return data.data
    },
    enabled: !!id,
  })
}

export function useApproveCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => { await api.post(`/admin/customers/${id}/approve`) },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'customers'] })
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
      toast.success('Customer approved.')
    },
    onError: () => toast.error('Failed to approve customer.'),
  })
}

export function useRejectCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => { await api.post(`/admin/customers/${id}/reject`) },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'customers'] })
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
      toast.success('Customer declined.')
    },
    onError: () => toast.error('Failed to decline customer.'),
  })
}

export function useDeleteCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => { await api.delete(`/admin/customers/${id}`) },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'customers'] })
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
      toast.success('Customer deleted.')
    },
    onError: () => toast.error('Failed to delete customer.'),
  })
}

// ── All users ─────────────────────────────────────────────────────────────────

export function useAllUsers(page = 1, search = '', limit = 20) {
  return useQuery<{ items: UserRow[]; total: number }>({
    queryKey: ['admin', 'users', page, search],
    queryFn:  async () => {
      const { data } = await api.get<{ data: { items: UserRow[]; total: number } }>(
        '/users', { params: { page, limit, search: search || undefined } }
      )
      return data.data
    },
  })
}

// ── Disputes ──────────────────────────────────────────────────────────────────

export function useDisputes(status = '', page = 1, limit = 20) {
  return useQuery<{ items: DisputeRow[]; total: number }>({
    queryKey: ['admin', 'disputes', status, page],
    queryFn:  async () => {
      const { data } = await api.get<{ data: { items: DisputeRow[]; total: number } }>(
        '/admin/disputes', { params: { page, limit, status: status || undefined } }
      )
      return data.data
    },
  })
}

export function useResolveDispute() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { id: string; resolution: string; depositDeduction: number | null; note: string }) => {
      const { id, ...body } = data
      await api.post(`/admin/disputes/${id}/resolve`, body)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'disputes'] })
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
      toast.success('Dispute resolved.')
    },
    onError: () => toast.error('Failed to resolve dispute.'),
  })
}

// ── Rentals ───────────────────────────────────────────────────────────────────

export function useAdminRentals(status = '', search = '', page = 1, limit = 20) {
  return useQuery<{ items: AdminRentalRow[]; total: number }>({
    queryKey: ['admin', 'rentals', status, search, page],
    queryFn:  async () => {
      const { data } = await api.get<{ data: { items: AdminRentalRow[]; total: number } }>(
        '/admin/rentals', { params: { status: status || undefined, search: search || undefined, page, limit } }
      )
      return data.data
    },
  })
}

export function useAdjustLateFee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, lateFeeAmount, note }: { id: string; lateFeeAmount: number; note?: string }) => {
      const { data } = await api.patch<{ data: { lateFeeAmount: number; depositRemaining: number } }>(
        `/admin/rentals/${id}/late-fee`, { lateFeeAmount, note }
      )
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'rentals'] })
      toast.success('Late fee adjusted.')
    },
  })
}

// ── Payments ──────────────────────────────────────────────────────────────────

export function useAdminPayments(page = 1, limit = 20) {
  return useQuery<{ items: AdminPaymentRow[]; total: number }>({
    queryKey: ['admin', 'payments', page],
    queryFn:  async () => {
      const { data } = await api.get<{ data: { items: AdminPaymentRow[]; total: number } }>(
        '/admin/payments', { params: { page, limit } }
      )
      return data.data
    },
  })
}

// ── Returns ───────────────────────────────────────────────────────────────────

export function useAdminReturns(page = 1, limit = 20) {
  return useQuery<{ items: AdminReturnRow[]; total: number }>({
    queryKey: ['admin', 'returns', page],
    queryFn:  async () => {
      const { data } = await api.get<{ data: { items: AdminReturnRow[]; total: number } }>(
        '/admin/returns', { params: { page, limit } }
      )
      return data.data
    },
  })
}

// ── Deposits ──────────────────────────────────────────────────────────────────

export function useAdminDeposits(page = 1, limit = 20) {
  return useQuery<{ items: AdminDepositRow[]; total: number }>({
    queryKey: ['admin', 'deposits', page],
    queryFn:  async () => {
      const { data } = await api.get<{ data: { items: AdminDepositRow[]; total: number } }>(
        '/admin/deposits', { params: { page, limit } }
      )
      return data.data
    },
  })
}

// ── Damage claims ─────────────────────────────────────────────────────────────

export interface AdminDamageEvidence {
  id:         string
  fileUrl:    string
  type:       string
  uploadedAt: string
}

export interface AdminDamageClaim {
  id:                     string
  rentalId:               string
  renterName:             string
  vendorName:             string
  vendorProfileId:        string
  productName:            string
  depositAmount:          number
  pricePerDay:            number
  endDate:                string
  lateDays:               number
  latePenalty:            number
  vendorClaimedDeduction: number
  damageDescription:      string | null
  damageAmount:           number
  condition:              string
  evidence:               AdminDamageEvidence[]
  createdAt:              string
}

export function useAdminDamageClaims(page = 1, limit = 20) {
  return useQuery<{ items: AdminDamageClaim[]; total: number }>({
    queryKey: ['admin', 'damage-claims', page],
    queryFn:  async () => {
      const { data } = await api.get<{ data: { items: AdminDamageClaim[]; total: number } }>(
        '/admin/damage-claims', { params: { page, limit } }
      )
      return data.data
    },
    refetchInterval: 30_000,
  })
}

export function useResolveDamageClaim() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, lateDeduction, damageDeduction }: { id: string; lateDeduction: number; damageDeduction: number }) => {
      const { data } = await api.post<{ data: { depositStatus: string; actualDeduction: number; refundAmount: number; outstandingDue: number } }>(
        `/admin/damage-claims/${id}/resolve`, { lateDeduction, damageDeduction }
      )
      return data.data
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['admin', 'damage-claims'] })
      qc.invalidateQueries({ queryKey: ['admin', 'returns'] })
      qc.invalidateQueries({ queryKey: ['admin', 'deposits'] })
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
      const { actualDeduction, refundAmount, outstandingDue, depositStatus } = result
      if (actualDeduction === 0) {
        toast.success('Full deposit refunded. Rental marked complete.')
      } else {
        const parts = [`৳${actualDeduction.toLocaleString()} → Vendor payout queued`, `৳${refundAmount.toLocaleString()} → Renter refund`]
        if (outstandingDue > 0) parts.push(`৳${outstandingDue.toLocaleString()} outstanding due`)
        toast.success(parts.join(' · '))
      }
    },
    onError: () => toast.error('Failed to resolve claim.'),
  })
}

// ── Reviews ───────────────────────────────────────────────────────────────────

export interface AdminReviewRow {
  id:            string
  type:          'review'
  rentalId:      string
  reviewerName:  string
  reviewerEmail: string
  productName:   string
  vendorName:    string
  rating:        number
  title:         string | null
  body:          string
  vendorReply:   string | null
  isVerified:    boolean
  helpfulCount:  number
  createdAt:     string
}

export interface AdminFeedbackRow {
  id:            string
  type:          'feedback'
  rentalId:      string
  vendorName:    string
  customerName:  string
  customerEmail: string
  rating:        number
  comment:       string | null
  createdAt:     string
}

export function useAdminReviews(type: 'reviews' | 'feedback', page = 1, limit = 20) {
  return useQuery<{ items: (AdminReviewRow | AdminFeedbackRow)[]; total: number }>({
    queryKey: ['admin', 'reviews', type, page, limit],
    queryFn:  async () => {
      const { data } = await api.get<{ data: { items: (AdminReviewRow | AdminFeedbackRow)[]; total: number } }>(
        '/admin/reviews', { params: { type, page, limit } }
      )
      return data.data
    },
  })
}

export function useDeleteAdminReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => { await api.delete(`/admin/reviews/${id}`) },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'reviews'] })
      toast.success('Review deleted.')
    },
    onError: () => toast.error('Failed to delete review.'),
  })
}

export function useDeleteAdminVendorFeedback() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => { await api.delete(`/admin/vendor-feedback/${id}`) },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'reviews'] })
      toast.success('Feedback deleted.')
    },
    onError: () => toast.error('Failed to delete feedback.'),
  })
}

// ── Commissions ───────────────────────────────────────────────────────────────

export function useAdminCommissions(page = 1, limit = 20) {
  return useQuery<{ items: AdminCommissionRow[]; total: number; totalCommission: number }>({
    queryKey: ['admin', 'commissions', page],
    queryFn:  async () => {
      const { data } = await api.get<{ data: { items: AdminCommissionRow[]; total: number; totalCommission: number } }>(
        '/admin/commissions', { params: { page, limit } }
      )
      return data.data
    },
  })
}

// ── Categories ────────────────────────────────────────────────────────────────

export interface AdminCategoryChild {
  id:           string
  name:         string
  slug:         string
  emoji:        string
  isActive:     boolean
  listingCount: number
}

export interface AdminCategoryRow {
  id:           string
  name:         string
  slug:         string
  emoji:        string
  description:  string | null
  isActive:     boolean
  sortOrder:    number
  listingCount: number
  createdAt:    string
  children:     AdminCategoryChild[]
}

export function useAdminCategories() {
  return useQuery<AdminCategoryRow[]>({
    queryKey:  ['admin', 'categories'],
    staleTime: 0,
    queryFn:   async () => {
      const { data } = await api.get<{ data: AdminCategoryRow[] }>('/admin/categories')
      return data.data
    },
  })
}

export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { name: string; emoji: string; description?: string }) => {
      await api.post('/admin/categories', payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'categories'] })
      toast.success('Category created.')
    },
    onError: () => toast.error('Failed to create category.'),
  })
}

export function useUpdateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; name?: string; emoji?: string; description?: string }) => {
      await api.patch(`/admin/categories/${id}`, payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'categories'] })
      toast.success('Category updated.')
    },
    onError: () => toast.error('Failed to update category.'),
  })
}

export function useToggleCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => { await api.post(`/admin/categories/${id}/toggle`) },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'categories'] }) },
    onError: () => toast.error('Failed to toggle category.'),
  })
}

export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => { await api.delete(`/admin/categories/${id}`) },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'categories'] })
      toast.success('Category deleted.')
    },
    onError: () => toast.error('Failed to delete category.'),
  })
}

// ── Product Approval ──────────────────────────────────────────────────────────

export interface AdminProductRow {
  id:           string
  name:         string
  slug:         string
  status:       string
  condition:    string
  pricePerDay:  number
  district:     string
  division:     string
  vendorId:     string
  vendorName:   string
  vendorEmail:  string
  categoryName: string
  imageUrl:     string | null
  createdAt:    string
}

export function useAdminProducts(status?: 'PENDING_REVIEW' | 'ACTIVE' | 'REJECTED' | 'INACTIVE', page = 1, limit = 20) {
  return useQuery<{ items: AdminProductRow[]; total: number }>({
    queryKey:  ['admin', 'products', status, page],
    staleTime: 0,
    queryFn:   async () => {
      const { data } = await api.get<{ data: { items: AdminProductRow[]; total: number } }>(
        '/admin/products', { params: { status: status || undefined, page, limit } }
      )
      return data.data
    },
  })
}

export function useApproveProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => { await api.post(`/admin/products/${id}/approve`) },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'products'] })
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
      toast.success('Product approved — now visible to customers.')
    },
    onError: () => toast.error('Failed to approve product.'),
  })
}

export function useRejectProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      await api.post(`/admin/products/${id}/reject`, { reason })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'products'] })
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
      toast.success('Product declined.')
    },
    onError: () => toast.error('Failed to decline product.'),
  })
}
