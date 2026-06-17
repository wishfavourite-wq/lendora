'use client'
import { useState }       from 'react'
import { useRouter }      from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { format }         from 'date-fns'
import {
  CheckCircle, XCircle, Trash2, Eye, Star, Loader2, X,
  User, Building2, CreditCard, ExternalLink,
} from 'lucide-react'
import {
  usePendingVendors, useActiveVendors, useSuspendedVendors,
  useApproveVendor, useRejectVendor, useDeleteVendor,
  type PendingVendorDetail, type ActiveVendorRow, type SuspendedVendorRow,
} from '@/lib/hooks/use-admin'
import { cn } from '@/lib/utils'

// ── Helpers ────────────────────────────────────────────────────────────────────

function Avatar({ src, name, size = 40 }: { src?: string | null; name: string; size?: number }) {
  if (src) return <img src={src} alt={name} className="rounded-full object-cover" style={{ width: size, height: size }} />
  return (
    <div className="rounded-full bg-copper/10 text-copper font-semibold flex items-center justify-center text-sm"
      style={{ width: size, height: size }}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}


function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-ink-500">
        {icon}<span className="text-xs font-semibold uppercase tracking-wider">{title}</span>
      </div>
      <div className="space-y-2 pl-5">{children}</div>
    </div>
  )
}

function InfoRow({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-ink-400 min-w-[120px] shrink-0">{label}</span>
      <span className={cn('text-ink-800', multiline && 'whitespace-pre-wrap')}>{value}</span>
    </div>
  )
}

// ── Pending vendor body ────────────────────────────────────────────────────────

function PendingVendorBody({ vendor }: { vendor: PendingVendorDetail }) {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
      <div className="flex items-center gap-4">
        <Avatar src={vendor.userAvatarUrl} name={vendor.userName} size={56} />
        <div>
          <p className="font-semibold text-ink-900 text-base">{vendor.userName}</p>
          <p className="text-sm text-ink-500">{vendor.userEmail}</p>
          {vendor.userPhone && <p className="text-xs text-ink-400">{vendor.userPhone}</p>}
        </div>
      </div>

      <Section icon={<User size={14} />} title="Personal Information">
        <InfoRow label="Address"    value={vendor.userAddress ?? '—'} />
        <InfoRow label="Applied" value={format(new Date(vendor.createdAt), 'dd MMM yyyy, hh:mm a')} />
      </Section>

      <Section icon={<Building2 size={14} />} title="Shop Information">
        <InfoRow label="Shop Name" value={vendor.businessName} />
        {vendor.businessDescription && <InfoRow label="Description" value={vendor.businessDescription} multiline />}
        <InfoRow label="Location"  value={`${vendor.district}, ${vendor.division}`} />
        {vendor.businessAddress && <InfoRow label="Address" value={vendor.businessAddress} />}
      </Section>

      <Section icon={<CreditCard size={14} />} title="Payment Details">
        <InfoRow label="bKash Number" value={vendor.bkashNumber ?? '—'} />
      </Section>
    </div>
  )
}

// ── Vendor summary body (approved / declined) ──────────────────────────────────

function VendorSummaryBody({ businessName, district, division, userName, userEmail, createdAt, suspensionReason }: {
  businessName: string; district: string; division: string
  userName: string; userEmail: string; createdAt: string
  suspensionReason?: string | null
}) {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
      <div className="flex items-center gap-4">
        <div className="rounded-full bg-copper/10 text-copper font-semibold flex items-center justify-center text-sm w-14 h-14">
          {userName.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-ink-900 text-base">{userName}</p>
          <p className="text-sm text-ink-500">{userEmail}</p>
        </div>
      </div>

      <Section icon={<Building2 size={14} />} title="Shop Information">
        <InfoRow label="Shop Name" value={businessName} />
        <InfoRow label="Location"  value={`${district}, ${division}`} />
        <InfoRow label="Joined"    value={format(new Date(createdAt), 'dd MMM yyyy')} />
      </Section>

      {suspensionReason && (
        <Section icon={<ShieldAlert size={14} />} title="Decline Reason">
          <p className="text-sm text-red-600 pl-1">{suspensionReason}</p>
        </Section>
      )}
    </div>
  )
}

// ── Drawers ────────────────────────────────────────────────────────────────────

function PendingDrawer({
  vendor, onClose, onApprove, onDecline, onDelete, approving, declining, deleting,
}: {
  vendor: PendingVendorDetail
  onClose: () => void; onApprove: () => void; onDecline: (reason?: string) => void; onDelete: () => void
  approving: boolean; declining: boolean; deleting: boolean
}) {
  const [declineReason,  setDeclineReason]  = useState('')
  const [showDeclineBox, setShowDeclineBox] = useState(false)
  const [confirmDelete,  setConfirmDelete]  = useState(false)

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-xl bg-white shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100">
          <h2 className="font-fraunces text-lg font-bold text-ink-900">Vendor Application</h2>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700 p-1 rounded-lg hover:bg-ink-100 transition">
            <X size={20} />
          </button>
        </div>
        <PendingVendorBody vendor={vendor} />
        <div className="px-6 py-4 border-t border-ink-100 space-y-3">
          {showDeclineBox && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-ink-600">Decline reason (optional)</label>
              <textarea value={declineReason} onChange={(e) => setDeclineReason(e.target.value)} rows={2}
                placeholder="Reason for declining…"
                className="w-full border border-ink-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-copper/30 resize-none" />
              <div className="flex gap-2">
                <button onClick={() => { setShowDeclineBox(false); setDeclineReason('') }}
                  className="flex-1 py-2 text-sm border border-ink-200 rounded-xl text-ink-600 hover:bg-ink-50 transition">Cancel</button>
                <button onClick={() => onDecline(declineReason || undefined)} disabled={declining}
                  className="flex-1 py-2 text-sm font-medium bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 transition flex items-center justify-center gap-2">
                  {declining && <Loader2 size={14} className="animate-spin" />} Confirm Decline
                </button>
              </div>
            </div>
          )}
          {confirmDelete && !showDeclineBox && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 space-y-2">
              <p className="font-medium">Delete this vendor permanently?</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmDelete(false)}
                  className="flex-1 py-2 border border-red-300 rounded-xl text-red-600 hover:bg-red-100 transition text-xs">Cancel</button>
                <button onClick={onDelete} disabled={deleting}
                  className="flex-1 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 transition text-xs flex items-center justify-center gap-1.5">
                  {deleting && <Loader2 size={12} className="animate-spin" />} Yes, Delete
                </button>
              </div>
            </div>
          )}
          {!showDeclineBox && !confirmDelete && (
            <div className="flex gap-2">
              <button onClick={onApprove} disabled={approving}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-forest text-white font-medium rounded-xl hover:bg-forest/90 disabled:opacity-50 transition text-sm">
                {approving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />} Approve
              </button>
              <button onClick={() => setShowDeclineBox(true)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-500 text-white font-medium rounded-xl hover:bg-amber-600 transition text-sm">
                <XCircle size={15} /> Decline
              </button>
              <button onClick={() => setConfirmDelete(true)}
                className="px-4 flex items-center justify-center py-2.5 border border-ink-200 text-ink-500 rounded-xl hover:bg-ink-50 transition text-sm">
                <Trash2 size={15} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ApprovedDrawer({
  vendor, onClose, onViewProfile, onDelete, deleting,
}: {
  vendor: ActiveVendorRow
  onClose: () => void; onViewProfile: () => void; onDelete: () => void; deleting: boolean
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-lg bg-white shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100">
          <h2 className="font-fraunces text-lg font-bold text-ink-900">Approved Vendor</h2>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700 p-1 rounded-lg hover:bg-ink-100 transition"><X size={20} /></button>
        </div>
        <VendorSummaryBody
          businessName={vendor.businessName}
          district={vendor.district}
          division={vendor.division}
          userName={vendor.userName}
          userEmail={vendor.userEmail}
          createdAt={vendor.createdAt}
        />
        <div className="px-6 py-4 border-t border-ink-100">
          {confirmDelete ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 space-y-2">
              <p className="font-medium">Delete this vendor permanently?</p>
              <p className="text-xs text-red-600">This cannot be undone.</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2 border border-red-300 rounded-xl text-red-600 hover:bg-red-100 transition text-xs">Cancel</button>
                <button onClick={onDelete} disabled={deleting} className="flex-1 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 transition text-xs flex items-center justify-center gap-1.5">
                  {deleting && <Loader2 size={12} className="animate-spin" />} Yes, Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button onClick={onViewProfile} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-copper text-white font-medium rounded-xl hover:bg-copper/90 transition text-sm">
                <ExternalLink size={15} /> View Profile
              </button>
              <button onClick={() => setConfirmDelete(true)} className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-red-200 text-red-600 font-medium rounded-xl hover:bg-red-50 transition text-sm">
                <Trash2 size={15} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DeclinedDrawer({
  vendor, onClose, onViewProfile, onApprove, onDelete, approving, deleting,
}: {
  vendor: SuspendedVendorRow
  onClose: () => void; onViewProfile: () => void; onApprove: () => void; onDelete: () => void
  approving: boolean; deleting: boolean
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-lg bg-white shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100">
          <h2 className="font-fraunces text-lg font-bold text-ink-900">Declined Vendor</h2>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700 p-1 rounded-lg hover:bg-ink-100 transition"><X size={20} /></button>
        </div>
        <VendorSummaryBody
          businessName={vendor.businessName}
          district={vendor.district}
          division={vendor.division}
          userName={vendor.userName}
          userEmail={vendor.userEmail}
          createdAt={vendor.createdAt}
          suspensionReason={vendor.suspensionReason}
        />
        <div className="px-6 py-4 border-t border-ink-100">
          {confirmDelete ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 space-y-2">
              <p className="font-medium">Delete this vendor permanently?</p>
              <p className="text-xs text-red-600">This cannot be undone.</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2 border border-red-300 rounded-xl text-red-600 hover:bg-red-100 transition text-xs">Cancel</button>
                <button onClick={onDelete} disabled={deleting} className="flex-1 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 transition text-xs flex items-center justify-center gap-1.5">
                  {deleting && <Loader2 size={12} className="animate-spin" />} Yes, Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button onClick={onViewProfile} className="flex items-center justify-center gap-2 px-4 py-2.5 border border-ink-200 text-ink-700 font-medium rounded-xl hover:bg-ink-50 transition text-sm">
                <ExternalLink size={15} /> View
              </button>
              <button onClick={onApprove} disabled={approving} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-forest text-white font-medium rounded-xl hover:bg-forest/90 disabled:opacity-50 transition text-sm">
                {approving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />} Re-approve
              </button>
              <button onClick={() => setConfirmDelete(true)} className="px-4 flex items-center justify-center py-2.5 border border-red-200 text-red-500 rounded-xl hover:bg-red-50 transition text-sm">
                <Trash2 size={15} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Pagination ─────────────────────────────────────────────────────────────────

function Pagination({ total, page, onPage }: { total: number; page: number; onPage: (p: number) => void }) {
  if (total <= 20) return null
  return (
    <div className="px-5 py-3 border-t border-ink-100 flex items-center justify-between text-sm text-ink-500">
      <span>Page {page} · {total} total</span>
      <div className="flex gap-2">
        <button onClick={() => onPage(Math.max(1, page - 1))} disabled={page <= 1}
          className="px-3 py-1.5 border border-ink-200 rounded-lg disabled:opacity-40 hover:border-copper/50 transition text-xs">Previous</button>
        <button onClick={() => onPage(page + 1)} disabled={page * 20 >= total}
          className="px-3 py-1.5 border border-ink-200 rounded-lg disabled:opacity-40 hover:border-copper/50 transition text-xs">Next</button>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

type Tab = 'pending' | 'approved' | 'declined'

export default function AdminVendorsPage() {
  const router = useRouter()
  const qc     = useQueryClient()

  const [tab,  setTab]  = useState<Tab>('pending')
  const [page, setPage] = useState(1)

  const [selectedPending,  setSelectedPending]  = useState<PendingVendorDetail | null>(null)
  const [selectedApproved, setSelectedApproved] = useState<ActiveVendorRow | null>(null)
  const [selectedDeclined, setSelectedDeclined] = useState<SuspendedVendorRow | null>(null)

  const { data: pendingData,  isLoading: lPending  } = usePendingVendors(page)
  const { data: approvedData, isLoading: lApproved } = useActiveVendors(page)
  const { data: declinedData, isLoading: lDeclined } = useSuspendedVendors(page)

  const approveVendor = useApproveVendor()
  const rejectVendor  = useRejectVendor()
  const deleteVendor  = useDeleteVendor()

  function evictFromVendors(id: string) {
    const tabs = ['pending', 'active', 'suspended']
    for (let p = 1; p <= 20; p++) {
      tabs.forEach((t) => {
        const key    = ['admin', 'vendors', t, p]
        const cached = qc.getQueryData<{ items: { id: string }[]; total: number }>(key)
        if (!cached || !Array.isArray(cached.items)) return
        const next = cached.items.filter((v) => v.id !== id)
        if (next.length !== cached.items.length)
          qc.setQueryData(key, { ...cached, items: next, total: Math.max(0, cached.total - 1) })
      })
    }
  }

  const handleApproveFromPending = async () => {
    if (!selectedPending) return
    const id = selectedPending.id
    evictFromVendors(id)
    setSelectedPending(null)
    setTab('approved')
    setPage(1)
    await approveVendor.mutateAsync(id)
  }

  const handleDeclineFromPending = async (reason?: string) => {
    if (!selectedPending) return
    const id = selectedPending.id
    evictFromVendors(id)
    setSelectedPending(null)
    setTab('declined')
    setPage(1)
    await rejectVendor.mutateAsync({ id, reason })
  }

  const handleApproveFromDeclined = async () => {
    if (!selectedDeclined) return
    const id = selectedDeclined.id
    evictFromVendors(id)
    setSelectedDeclined(null)
    setTab('approved')
    setPage(1)
    await approveVendor.mutateAsync(id)
  }

  const handleDeleteFromPending = async () => {
    if (!selectedPending) return
    const id = selectedPending.id
    evictFromVendors(id)
    setSelectedPending(null)
    await deleteVendor.mutateAsync(id)
  }

  const handleDeleteFromApproved = async () => {
    if (!selectedApproved) return
    const id = selectedApproved.id
    evictFromVendors(id)
    setSelectedApproved(null)
    await deleteVendor.mutateAsync(id)
  }

  const handleDeleteFromDeclined = async () => {
    if (!selectedDeclined) return
    const id = selectedDeclined.id
    evictFromVendors(id)
    setSelectedDeclined(null)
    await deleteVendor.mutateAsync(id)
  }

  const activeData    = tab === 'pending' ? pendingData  : tab === 'approved' ? approvedData : declinedData
  const activeLoading = tab === 'pending' ? lPending     : tab === 'approved' ? lApproved    : lDeclined

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="font-fraunces text-2xl font-bold text-ink-900">Vendors</h1>
        <p className="text-ink-400 text-sm mt-0.5">Manage vendor applications and accounts</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-ink-100 p-1 rounded-xl w-fit">
        {([
          { key: 'pending',  label: 'Pending',  count: pendingData?.total },
          { key: 'approved', label: 'Approved', count: approvedData?.total },
          { key: 'declined', label: 'Declined', count: declinedData?.total },
        ] as const).map(({ key, label, count }) => (
          <button key={key} onClick={() => { setTab(key); setPage(1) }}
            className={cn('px-4 py-2 rounded-lg text-sm font-medium transition',
              tab === key ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-700')}>
            {label}{count ? ` (${count})` : ''}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50">
                {tab === 'pending' ? (
                  ['Applicant', 'Shop', 'Location', 'Applied', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-ink-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))
                ) : tab === 'approved' ? (
                  ['Business', 'Location', 'Rating', 'Rentals', 'Earnings', 'Joined', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-ink-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))
                ) : (
                  ['Vendor', 'Location', 'Reason', 'Date', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-ink-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {activeLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: tab === 'approved' ? 7 : 5 }).map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 bg-ink-100 rounded animate-pulse" style={{ width: `${60 + j * 5}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : !activeData?.items.length ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-ink-400 text-sm">
                    {tab === 'pending' ? 'No pending applications' : tab === 'approved' ? 'No approved vendors' : 'No declined vendors'}
                  </td>
                </tr>
              ) : tab === 'pending' ? (
                (activeData.items as PendingVendorDetail[]).map((v) => (
                  <tr key={v.id} className="hover:bg-ink-50/50 transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar src={v.userAvatarUrl} name={v.userName} size={32} />
                        <div>
                          <p className="font-medium text-ink-800">{v.userName}</p>
                          <p className="text-xs text-ink-400">{v.userEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-medium text-ink-700">{v.businessName}</td>
                    <td className="px-5 py-4 text-ink-500 text-xs">{v.district}, {v.division}</td>
                    <td className="px-5 py-4 text-ink-400 text-xs whitespace-nowrap">
                      {format(new Date(v.createdAt), 'dd MMM yyyy')}
                    </td>
                    <td className="px-5 py-4">
                      <button onClick={() => setSelectedPending(v)}
                        className="flex items-center gap-1.5 text-xs font-medium text-copper hover:underline">
                        <Eye size={12} /> Review
                      </button>
                    </td>
                  </tr>
                ))
              ) : tab === 'approved' ? (
                (activeData.items as ActiveVendorRow[]).map((v) => (
                  <tr key={v.id} className="hover:bg-ink-50/50 transition">
                    <td className="px-5 py-4">
                      <p className="font-medium text-ink-800">{v.businessName}</p>
                      <p className="text-xs text-ink-400">{v.userEmail}</p>
                    </td>
                    <td className="px-5 py-4 text-ink-500 text-xs">{v.district}, {v.division}</td>
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-1 text-ink-600">
                        <Star size={12} className="text-gold fill-gold" />
                        {v.averageRating?.toFixed(1) ?? '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-ink-600">{v.totalRentals}</td>
                    <td className="px-5 py-4 text-ink-600">৳{Number(v.totalEarnings).toLocaleString()}</td>
                    <td className="px-5 py-4 text-ink-400 text-xs whitespace-nowrap">
                      {format(new Date(v.createdAt), 'dd MMM yyyy')}
                    </td>
                    <td className="px-5 py-4">
                      <button onClick={() => setSelectedApproved(v)}
                        className="flex items-center gap-1.5 text-xs font-medium text-copper hover:underline">
                        <Eye size={12} /> View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                (activeData.items as SuspendedVendorRow[]).map((v) => (
                  <tr key={v.id} className="hover:bg-ink-50/50 transition">
                    <td className="px-5 py-4">
                      <p className="font-medium text-ink-800">{v.businessName}</p>
                      <p className="text-xs text-ink-400">{v.userEmail}</p>
                    </td>
                    <td className="px-5 py-4 text-ink-500 text-xs">{v.district}, {v.division}</td>
                    <td className="px-5 py-4 text-ink-400 text-xs max-w-[200px] truncate">
                      {v.suspensionReason ?? '—'}
                    </td>
                    <td className="px-5 py-4 text-ink-400 text-xs whitespace-nowrap">
                      {format(new Date(v.createdAt), 'dd MMM yyyy')}
                    </td>
                    <td className="px-5 py-4">
                      <button onClick={() => setSelectedDeclined(v)}
                        className="flex items-center gap-1.5 text-xs font-medium text-copper hover:underline">
                        <Eye size={12} /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination total={activeData?.total ?? 0} page={page} onPage={setPage} />
      </div>

      {selectedPending && (
        <PendingDrawer
          vendor={selectedPending}
          onClose={() => setSelectedPending(null)}
          onApprove={handleApproveFromPending}
          onDecline={handleDeclineFromPending}
          onDelete={handleDeleteFromPending}
          approving={approveVendor.isPending}
          declining={rejectVendor.isPending}
          deleting={deleteVendor.isPending}
        />
      )}

      {selectedApproved && (
        <ApprovedDrawer
          vendor={selectedApproved}
          onClose={() => setSelectedApproved(null)}
          onViewProfile={() => { setSelectedApproved(null); router.push(`/admin/vendors/${selectedApproved.id}`) }}
          onDelete={handleDeleteFromApproved}
          deleting={deleteVendor.isPending}
        />
      )}

      {selectedDeclined && (
        <DeclinedDrawer
          vendor={selectedDeclined}
          onClose={() => setSelectedDeclined(null)}
          onViewProfile={() => { setSelectedDeclined(null); router.push(`/admin/vendors/${selectedDeclined.id}`) }}
          onApprove={handleApproveFromDeclined}
          onDelete={handleDeleteFromDeclined}
          approving={approveVendor.isPending}
          deleting={deleteVendor.isPending}
        />
      )}
    </div>
  )
}
