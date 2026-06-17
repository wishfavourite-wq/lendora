'use client'
import { useState }                     from 'react'
import { useParams, useRouter }          from 'next/navigation'
import Link                              from 'next/link'
import { format }                        from 'date-fns'
import {
  ArrowLeft, User, FileText, ShieldAlert, CheckCircle,
  XCircle, Trash2, Loader2, Phone, Mail, MapPin, CreditCard,
} from 'lucide-react'
import {
  useCustomerProfile, useApproveCustomer,
  useRejectCustomer, useDeleteCustomer,
} from '@/lib/hooks/use-admin'
import { cn } from '@/lib/utils'

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  ACTIVE:               { label: 'Approved',  cls: 'bg-forest/10 text-forest' },
  PENDING_VERIFICATION: { label: 'Pending',   cls: 'bg-amber-100 text-amber-700' },
  SUSPENDED:            { label: 'Declined',  cls: 'bg-red-100 text-red-600' },
  BANNED:               { label: 'Banned',    cls: 'bg-ink-100 text-ink-500' },
  INACTIVE:             { label: 'Inactive',  cls: 'bg-ink-100 text-ink-500' },
}

function NidImage({ url, label }: { url: string | null; label: string }) {
  if (!url) return (
    <div className="flex flex-col items-center justify-center h-44 rounded-2xl border-2 border-dashed border-ink-200 bg-ink-50 text-ink-400 text-sm gap-2">
      <ShieldAlert size={24} className="opacity-30" />
      <span>Not provided</span>
    </div>
  )
  return (
    <div>
      <p className="text-xs text-ink-400 font-medium mb-2">{label}</p>
      <a href={url} target="_blank" rel="noopener noreferrer">
        <img src={url} alt={label}
          className="w-full h-44 object-cover rounded-2xl border border-ink-100 hover:opacity-90 transition cursor-zoom-in" />
      </a>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string; value: string
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-ink-50 last:border-0">
      <div className="p-1.5 rounded-lg bg-ink-50 flex-shrink-0 mt-0.5">
        <Icon size={14} className="text-ink-400" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-ink-400 mb-0.5">{label}</p>
        <p className="text-sm text-ink-800 font-medium break-all">{value}</p>
      </div>
    </div>
  )
}

export default function CustomerProfilePage() {
  const params  = useParams()
  const router  = useRouter()
  const id      = params['id'] as string

  const { data: customer, isLoading } = useCustomerProfile(id)
  const approveCustomer = useApproveCustomer()
  const rejectCustomer  = useRejectCustomer()
  const deleteCustomer  = useDeleteCustomer()

  const [confirmDelete,  setConfirmDelete]  = useState(false)
  const [confirmDecline, setConfirmDecline] = useState(false)

  const handleApprove = async () => {
    await approveCustomer.mutateAsync(id)
    router.push('/admin/users')
  }
  const handleDecline = async () => {
    await rejectCustomer.mutateAsync(id)
    router.push('/admin/users')
  }
  const handleDelete = async () => {
    await deleteCustomer.mutateAsync(id)
    router.push('/admin/users')
  }

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 animate-pulse space-y-5">
        <div className="h-6 w-32 bg-ink-100 rounded" />
        <div className="h-36 bg-white rounded-2xl border border-ink-100" />
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="h-48 bg-white rounded-2xl border border-ink-100" />
          <div className="h-48 bg-white rounded-2xl border border-ink-100" />
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="p-8 text-center">
        <p className="text-ink-400">Customer not found.</p>
        <Link href="/admin/users" className="text-copper text-sm hover:underline mt-2 inline-block">
          ← Back
        </Link>
      </div>
    )
  }

  const statusMeta = STATUS_LABEL[customer.status] ?? { label: customer.status, cls: 'bg-ink-100 text-ink-500' }
  const isPending  = customer.status === 'PENDING_VERIFICATION'
  const isDeclined = customer.status === 'SUSPENDED'
  const isApproved = customer.status === 'ACTIVE'

  return (
    <div className="p-6 md:p-8 max-w-3xl">

      {/* Back */}
      <Link href="/admin/users"
        className="inline-flex items-center gap-2 text-sm text-ink-500 hover:text-ink-800 mb-6 transition">
        <ArrowLeft size={15} /> Back
      </Link>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-ink-100 p-6 mb-6">
        <div className="flex items-start gap-5">
          {customer.avatarUrl
            ? <img src={customer.avatarUrl} alt={customer.name}
                className="w-20 h-20 rounded-full object-cover flex-shrink-0 border border-ink-100" />
            : (
              <div className="w-20 h-20 rounded-full bg-blue-100 text-blue-600 font-bold text-2xl flex items-center justify-center flex-shrink-0">
                {customer.name.charAt(0).toUpperCase()}
              </div>
            )
          }
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="font-fraunces text-xl font-bold text-ink-900">{customer.name}</h1>
              <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', statusMeta.cls)}>
                {statusMeta.label}
              </span>
            </div>
            <p className="text-sm text-ink-500">{customer.email}</p>
            {customer.phone && <p className="text-sm text-ink-400 mt-0.5">{customer.phone}</p>}
            <p className="text-xs text-ink-300 mt-2">
              Registered {format(new Date(customer.createdAt), 'dd MMM yyyy, hh:mm a')}
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Personal info */}
        <div className="bg-white rounded-2xl border border-ink-100 p-6">
          <h2 className="font-semibold text-ink-800 text-sm mb-3 flex items-center gap-2">
            <User size={14} className="text-ink-400" />
            Personal Information
          </h2>
          <div>
            <InfoRow icon={Mail}       label="Email"      value={customer.email} />
            <InfoRow icon={Phone}      label="Phone"      value={customer.phone      ?? '—'} />
            <InfoRow icon={MapPin}     label="Address"    value={customer.address    ?? '—'} />
            <InfoRow icon={FileText}   label="NID Number" value={customer.nidNumber  ?? '—'} />
            <InfoRow icon={CreditCard} label="bKash"      value={customer.bkashNumber ?? '—'} />
          </div>
        </div>

        {/* Account info */}
        <div className="bg-white rounded-2xl border border-ink-100 p-6">
          <h2 className="font-semibold text-ink-800 text-sm mb-3 flex items-center gap-2">
            <ShieldAlert size={14} className="text-ink-400" />
            Account Details
          </h2>
          <div>
            <InfoRow icon={User}       label="Role"           value={customer.role} />
            <InfoRow icon={CheckCircle} label="Email verified" value={customer.emailVerifiedAt ? format(new Date(customer.emailVerifiedAt), 'dd MMM yyyy') : 'Not verified'} />
            <InfoRow icon={FileText}   label="Last login"     value={customer.lastLoginAt ? format(new Date(customer.lastLoginAt), 'dd MMM yyyy') : '—'} />
          </div>
        </div>
      </div>

      {/* NID images */}
      <div className="bg-white rounded-2xl border border-ink-100 p-6 mb-6">
        <h2 className="font-semibold text-ink-800 text-sm mb-4 flex items-center gap-2">
          <FileText size={14} className="text-ink-400" />
          Identity Documents
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <NidImage url={customer.nidFrontImageUrl} label="NID Front" />
          <NidImage url={customer.nidBackImageUrl}  label="NID Back" />
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-2xl border border-ink-100 p-6 space-y-3">
        <h2 className="font-semibold text-ink-800 text-sm mb-4">Actions</h2>

        {/* Decline confirm */}
        {confirmDecline && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
            <p className="text-sm font-medium text-red-700">Decline this customer?</p>
            <p className="text-xs text-red-500">They will be moved to the Declined section.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDecline(false)}
                className="flex-1 py-2 border border-red-300 rounded-xl text-red-600 text-sm hover:bg-red-100 transition">
                Cancel
              </button>
              <button onClick={handleDecline} disabled={rejectCustomer.isPending}
                className="flex-1 py-2 bg-red-600 text-white text-sm rounded-xl hover:bg-red-700 disabled:opacity-50 transition flex items-center justify-center gap-1.5">
                {rejectCustomer.isPending && <Loader2 size={13} className="animate-spin" />} Yes, Decline
              </button>
            </div>
          </div>
        )}

        {/* Delete confirm */}
        {confirmDelete && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
            <p className="text-sm font-medium text-red-700">Delete this account permanently?</p>
            <p className="text-xs text-red-500">This cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2 border border-red-300 rounded-xl text-red-600 text-sm hover:bg-red-100 transition">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleteCustomer.isPending}
                className="flex-1 py-2 bg-red-600 text-white text-sm rounded-xl hover:bg-red-700 disabled:opacity-50 transition flex items-center justify-center gap-1.5">
                {deleteCustomer.isPending && <Loader2 size={13} className="animate-spin" />} Yes, Delete
              </button>
            </div>
          </div>
        )}

        {!confirmDecline && !confirmDelete && (
          <div className="flex flex-wrap gap-3">
            {(isPending || isDeclined) && (
              <button onClick={handleApprove} disabled={approveCustomer.isPending}
                className="flex items-center gap-2 px-5 py-2.5 bg-forest text-white font-medium rounded-xl hover:bg-forest/90 disabled:opacity-50 transition text-sm">
                {approveCustomer.isPending ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                {isDeclined ? 'Re-approve' : 'Approve'}
              </button>
            )}
            {(isPending || isApproved) && (
              <button onClick={() => setConfirmDecline(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white font-medium rounded-xl hover:bg-amber-600 transition text-sm">
                <XCircle size={15} />
                {isPending ? 'Decline' : 'Revoke Access'}
              </button>
            )}
            <button onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-2 px-5 py-2.5 border border-red-200 text-red-600 font-medium rounded-xl hover:bg-red-50 transition text-sm ml-auto">
              <Trash2 size={15} /> Delete Account
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
