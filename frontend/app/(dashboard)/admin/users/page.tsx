'use client'
import { useState }              from 'react'
import { useRouter }             from 'next/navigation'
import { useQueryClient }        from '@tanstack/react-query'
import { format }                from 'date-fns'
import {
  CheckCircle, XCircle, Users, Loader2, X,
  User, Trash2, Eye, ExternalLink,
} from 'lucide-react'
import {
  usePendingCustomers, useApprovedCustomers, useDeclinedCustomers,
  useApproveCustomer, useRejectCustomer, useDeleteCustomer,
  type PendingCustomerDetail,
} from '@/lib/hooks/use-admin'
import { cn } from '@/lib/utils'

// ── Helpers ────────────────────────────────────────────────────────────────────

function Avatar({ src, name, size = 40 }: { src?: string | null; name: string; size?: number }) {
  if (src) return <img src={src} alt={name} className="rounded-full object-cover" style={{ width: size, height: size }} />
  return (
    <div className="rounded-full bg-blue-100 text-blue-600 font-semibold flex items-center justify-center text-sm"
      style={{ width: size, height: size }}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}


function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-ink-400 min-w-[110px] shrink-0">{label}</span>
      <span className="text-ink-800">{value}</span>
    </div>
  )
}

// ── Shared profile body ────────────────────────────────────────────────────────

function CustomerProfileBody({ customer }: { customer: PendingCustomerDetail }) {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
      <div className="flex items-center gap-4">
        <Avatar src={customer.avatarUrl} name={customer.name} size={56} />
        <div>
          <p className="font-semibold text-ink-900 text-base">{customer.name}</p>
          <p className="text-sm text-ink-500">{customer.email}</p>
          {customer.phone && <p className="text-xs text-ink-400">{customer.phone}</p>}
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-ink-500">
          <User size={14} />
          <span className="text-xs font-semibold uppercase tracking-wider">Personal Information</span>
        </div>
        <div className="space-y-2 pl-5">
          <InfoRow label="Address"    value={customer.address     ?? '—'} />
          <InfoRow label="bKash" value={customer.bkashNumber ?? '—'} />
          <InfoRow label="Applied"    value={format(new Date(customer.createdAt), 'dd MMM yyyy, hh:mm a')} />
        </div>
      </div>
    </div>
  )
}

// ── Pending customer drawer ────────────────────────────────────────────────────

function PendingDrawer({
  customer, onClose, onApprove, onDecline, onDelete,
  approving, declining, deleting,
}: {
  customer: PendingCustomerDetail
  onClose: () => void; onApprove: () => void; onDecline: () => void; onDelete: () => void
  approving: boolean; declining: boolean; deleting: boolean
}) {
  const [confirmDecline, setConfirmDecline] = useState(false)
  const [confirmDelete,  setConfirmDelete]  = useState(false)

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-lg bg-white shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100">
          <h2 className="font-fraunces text-lg font-bold text-ink-900">Customer Application</h2>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700 p-1 rounded-lg hover:bg-ink-100 transition"><X size={20} /></button>
        </div>
        <CustomerProfileBody customer={customer} />
        <div className="px-6 py-4 border-t border-ink-100 space-y-3">
          {confirmDecline && !confirmDelete && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 space-y-2">
              <p className="font-medium">Decline this customer&apos;s application?</p>
              <p className="text-xs text-red-600">They will be moved to the Declined section.</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmDecline(false)} className="flex-1 py-2 border border-red-300 rounded-xl text-red-600 hover:bg-red-100 transition text-xs">Cancel</button>
                <button onClick={onDecline} disabled={declining} className="flex-1 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 transition text-xs flex items-center justify-center gap-1.5">
                  {declining && <Loader2 size={12} className="animate-spin" />} Yes, Decline
                </button>
              </div>
            </div>
          )}
          {confirmDelete && !confirmDecline && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 space-y-2">
              <p className="font-medium">Delete this account permanently?</p>
              <p className="text-xs text-red-600">This cannot be undone.</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2 border border-red-300 rounded-xl text-red-600 hover:bg-red-100 transition text-xs">Cancel</button>
                <button onClick={onDelete} disabled={deleting} className="flex-1 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 transition text-xs flex items-center justify-center gap-1.5">
                  {deleting && <Loader2 size={12} className="animate-spin" />} Yes, Delete
                </button>
              </div>
            </div>
          )}
          {!confirmDecline && !confirmDelete && (
            <div className="flex gap-2">
              <button onClick={onApprove} disabled={approving} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-forest text-white font-medium rounded-xl hover:bg-forest/90 disabled:opacity-50 transition text-sm">
                {approving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />} Approve
              </button>
              <button onClick={() => setConfirmDecline(true)} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition text-sm">
                <XCircle size={15} /> Decline
              </button>
              <button onClick={() => setConfirmDelete(true)} className="px-4 flex items-center justify-center py-2.5 border border-ink-200 text-ink-500 rounded-xl hover:bg-ink-50 transition text-sm">
                <Trash2 size={15} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Approved customer drawer ───────────────────────────────────────────────────

function ApprovedDrawer({
  customer, onClose, onViewProfile, onDelete, deleting,
}: {
  customer: PendingCustomerDetail
  onClose: () => void; onViewProfile: () => void; onDelete: () => void; deleting: boolean
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-lg bg-white shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100">
          <h2 className="font-fraunces text-lg font-bold text-ink-900">Approved Customer</h2>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700 p-1 rounded-lg hover:bg-ink-100 transition"><X size={20} /></button>
        </div>
        <CustomerProfileBody customer={customer} />
        <div className="px-6 py-4 border-t border-ink-100 space-y-3">
          {confirmDelete ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 space-y-2">
              <p className="font-medium">Delete this account permanently?</p>
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

// ── Declined customer drawer ───────────────────────────────────────────────────

function DeclinedDrawer({
  customer, onClose, onViewProfile, onApprove, onDelete, approving, deleting,
}: {
  customer: PendingCustomerDetail
  onClose: () => void; onViewProfile: () => void; onApprove: () => void; onDelete: () => void
  approving: boolean; deleting: boolean
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-lg bg-white shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100">
          <h2 className="font-fraunces text-lg font-bold text-ink-900">Declined Customer</h2>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700 p-1 rounded-lg hover:bg-ink-100 transition"><X size={20} /></button>
        </div>
        <CustomerProfileBody customer={customer} />
        <div className="px-6 py-4 border-t border-ink-100 space-y-3">
          {confirmDelete ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 space-y-2">
              <p className="font-medium">Delete this account permanently?</p>
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
                {approving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />} Approve
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

// ── Customer table ─────────────────────────────────────────────────────────────

function CustomerTable({ items, isLoading, emptyText, onSelect }: {
  items:     PendingCustomerDetail[]
  isLoading: boolean
  emptyText: string
  onSelect:  (c: PendingCustomerDetail) => void
}) {
  return (
    <table className="w-full text-sm" role="grid">
      <thead>
        <tr className="border-b border-ink-100 bg-ink-50">
          {['Applicant', 'Phone', 'bKash', 'Date', 'Actions'].map((h) => (
            <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-ink-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-ink-50">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <tr key={i}>{Array.from({ length: 6 }).map((_, j) => (
              <td key={j} className="px-5 py-4"><div className="h-4 bg-ink-100 rounded animate-pulse" style={{ width: `${50 + j * 8}%` }} /></td>
            ))}</tr>
          ))
        ) : !items.length ? (
          <tr>
            <td colSpan={6} className="px-5 py-16 text-center text-ink-400">
              <Users size={32} className="mx-auto mb-3 opacity-30" />
              {emptyText}
            </td>
          </tr>
        ) : items.map((c) => (
          <tr key={c.id} className="hover:bg-ink-50/50 transition">
            <td className="px-5 py-4">
              <div className="flex items-center gap-3">
                <Avatar src={c.avatarUrl} name={c.name} size={32} />
                <div>
                  <p className="font-medium text-ink-800">{c.name}</p>
                  <p className="text-xs text-ink-400">{c.email}</p>
                </div>
              </div>
            </td>
            <td className="px-5 py-4 text-ink-500">{c.phone ?? '—'}</td>
            <td className="px-5 py-4 text-ink-500">{c.bkashNumber ?? <span className="text-ink-300">—</span>}</td>
            <td className="px-5 py-4 text-ink-400 text-xs whitespace-nowrap">{format(new Date(c.createdAt), 'dd MMM yyyy')}</td>
            <td className="px-5 py-4">
              <button onClick={() => onSelect(c)} className="flex items-center gap-1.5 text-xs font-medium text-copper hover:underline">
                <Eye size={12} /> View
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

type Tab = 'pending' | 'approved' | 'declined'

export default function AdminCustomersPage() {
  const router = useRouter()
  const qc     = useQueryClient()

  const [tab,  setTab]  = useState<Tab>('pending')
  const [page, setPage] = useState(1)

  const [selectedPending,  setSelectedPending]  = useState<PendingCustomerDetail | null>(null)
  const [selectedApproved, setSelectedApproved] = useState<PendingCustomerDetail | null>(null)
  const [selectedDeclined, setSelectedDeclined] = useState<PendingCustomerDetail | null>(null)

  const { data: pendingData,  isLoading: loadingPending  } = usePendingCustomers(page)
  const { data: approvedData, isLoading: loadingApproved } = useApprovedCustomers(page)
  const { data: declinedData, isLoading: loadingDeclined } = useDeclinedCustomers(page)

  const approveCustomer = useApproveCustomer()
  const rejectCustomer  = useRejectCustomer()
  const deleteCustomer  = useDeleteCustomer()

  // Immediately wipe the customer from every cached list page
  function evictFromCache(id: string) {
    const prefixes = ['pending', 'approved', 'declined']
    for (let p = 1; p <= 20; p++) {
      prefixes.forEach((prefix) => {
        const key  = ['admin', 'customers', prefix, p]
        const data = qc.getQueryData<{ items: PendingCustomerDetail[]; total: number }>(key)
        if (!data || !Array.isArray(data.items)) return
        const next = data.items.filter((c) => c.id !== id)
        if (next.length !== data.items.length) {
          qc.setQueryData(key, { ...data, items: next, total: Math.max(0, data.total - 1) })
        }
      })
    }
  }

  const handleApprove = async (c: PendingCustomerDetail) => {
    evictFromCache(c.id)
    setSelectedPending(null)
    setSelectedDeclined(null)
    setTab('approved')
    setPage(1)
    await approveCustomer.mutateAsync(c.id)
  }

  const handleDecline = async (c: PendingCustomerDetail) => {
    evictFromCache(c.id)
    setSelectedPending(null)
    setTab('declined')
    setPage(1)
    await rejectCustomer.mutateAsync(c.id)
  }

  const handleDelete = async (c: PendingCustomerDetail) => {
    evictFromCache(c.id)
    setSelectedPending(null)
    setSelectedApproved(null)
    setSelectedDeclined(null)
    await deleteCustomer.mutateAsync(c.id)
  }

  const activeData    = tab === 'pending' ? pendingData  : tab === 'approved' ? approvedData : declinedData
  const activeLoading = tab === 'pending' ? loadingPending : tab === 'approved' ? loadingApproved : loadingDeclined

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="font-fraunces text-2xl font-bold text-ink-900">Customers</h1>
        <p className="text-ink-400 text-sm mt-0.5">Manage customer accounts and verification</p>
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
          <CustomerTable
            items={(activeData?.items as PendingCustomerDetail[]) ?? []}
            isLoading={activeLoading}
            emptyText={
              tab === 'pending'  ? 'No pending applications' :
              tab === 'approved' ? 'No approved customers'   : 'No declined customers'
            }
            onSelect={(c) => {
              if (tab === 'pending')  setSelectedPending(c)
              if (tab === 'approved') setSelectedApproved(c)
              if (tab === 'declined') setSelectedDeclined(c)
            }}
          />
        </div>

        {activeData && activeData.total > 20 && (
          <div className="px-5 py-3 border-t border-ink-100 flex items-center justify-between text-sm text-ink-500">
            <span>Page {page} · {activeData.total} total</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
                className="px-3 py-1.5 border border-ink-200 rounded-lg disabled:opacity-40 text-xs hover:border-copper/50 transition">Previous</button>
              <button onClick={() => setPage((p) => p + 1)} disabled={page * 20 >= activeData.total}
                className="px-3 py-1.5 border border-ink-200 rounded-lg disabled:opacity-40 text-xs hover:border-copper/50 transition">Next</button>
            </div>
          </div>
        )}
      </div>

      {selectedPending && (
        <PendingDrawer
          customer={selectedPending}
          onClose={() => setSelectedPending(null)}
          onApprove={() => handleApprove(selectedPending)}
          onDecline={() => handleDecline(selectedPending)}
          onDelete={() => handleDelete(selectedPending)}
          approving={approveCustomer.isPending}
          declining={rejectCustomer.isPending}
          deleting={deleteCustomer.isPending}
        />
      )}

      {selectedApproved && (
        <ApprovedDrawer
          customer={selectedApproved}
          onClose={() => setSelectedApproved(null)}
          onViewProfile={() => { setSelectedApproved(null); router.push(`/admin/users/${selectedApproved.id}`) }}
          onDelete={() => handleDelete(selectedApproved)}
          deleting={deleteCustomer.isPending}
        />
      )}

      {selectedDeclined && (
        <DeclinedDrawer
          customer={selectedDeclined}
          onClose={() => setSelectedDeclined(null)}
          onViewProfile={() => { setSelectedDeclined(null); router.push(`/admin/users/${selectedDeclined.id}`) }}
          onApprove={() => handleApprove(selectedDeclined)}
          onDelete={() => handleDelete(selectedDeclined)}
          approving={approveCustomer.isPending}
          deleting={deleteCustomer.isPending}
        />
      )}
    </div>
  )
}
