'use client'
import { useState }             from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link                     from 'next/link'
import { format }               from 'date-fns'
import {
  ArrowLeft, User, Building2, FileText, ShieldAlert, CheckCircle,
  XCircle, Trash2, Loader2, Phone, Mail, MapPin, CreditCard, Star, TrendingUp,
} from 'lucide-react'
import {
  useVendorProfile, useApproveVendor, useRejectVendor, useDeleteVendor,
} from '@/lib/hooks/use-admin'
import { cn } from '@/lib/utils'

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  ACTIVE:               { label: 'Approved', cls: 'bg-forest/10 text-forest' },
  PENDING_VERIFICATION: { label: 'Pending',  cls: 'bg-amber-100 text-amber-700' },
  SUSPENDED:            { label: 'Declined', cls: 'bg-red-100 text-red-600' },
  BANNED:               { label: 'Banned',   cls: 'bg-ink-100 text-ink-500' },
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

export default function VendorProfilePage() {
  const params = useParams()
  const router = useRouter()
  const id     = params['id'] as string

  const { data: vendor, isLoading } = useVendorProfile(id)
  const approveVendor = useApproveVendor()
  const rejectVendor  = useRejectVendor()
  const deleteVendor  = useDeleteVendor()

  const [confirmDelete,  setConfirmDelete]  = useState(false)
  const [showDeclineBox, setShowDeclineBox] = useState(false)
  const [declineReason,  setDeclineReason]  = useState('')

  const handleApprove = async () => {
    await approveVendor.mutateAsync(id)
    router.push('/admin/vendors')
  }
  const handleDecline = async () => {
    await rejectVendor.mutateAsync({ id, reason: declineReason || undefined })
    router.push('/admin/vendors')
  }
  const handleDelete = async () => {
    await deleteVendor.mutateAsync(id)
    router.push('/admin/vendors')
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

  if (!vendor) {
    return (
      <div className="p-8 text-center">
        <p className="text-ink-400">Vendor not found.</p>
        <Link href="/admin/vendors" className="text-copper text-sm hover:underline mt-2 inline-block">
          ← Back
        </Link>
      </div>
    )
  }

  const statusMeta = STATUS_LABEL[vendor.status] ?? { label: vendor.status, cls: 'bg-ink-100 text-ink-500' }
  const isPending  = vendor.status === 'PENDING_VERIFICATION'
  const isDeclined = vendor.status === 'SUSPENDED'
  const isApproved = vendor.status === 'ACTIVE'

  return (
    <div className="p-6 md:p-8 max-w-3xl">
      <Link href="/admin/vendors"
        className="inline-flex items-center gap-2 text-sm text-ink-500 hover:text-ink-800 mb-6 transition">
        <ArrowLeft size={15} /> Back
      </Link>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-ink-100 p-6 mb-6">
        <div className="flex items-start gap-5">
          {vendor.userAvatarUrl
            ? <img src={vendor.userAvatarUrl} alt={vendor.userName}
                className="w-20 h-20 rounded-full object-cover flex-shrink-0 border border-ink-100" />
            : (
              <div className="w-20 h-20 rounded-full bg-copper/10 text-copper font-bold text-2xl flex items-center justify-center flex-shrink-0">
                {vendor.userName.charAt(0).toUpperCase()}
              </div>
            )
          }
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="font-fraunces text-xl font-bold text-ink-900">{vendor.userName}</h1>
              <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', statusMeta.cls)}>
                {statusMeta.label}
              </span>
            </div>
            <p className="text-sm text-ink-500">{vendor.userEmail}</p>
            {vendor.userPhone && <p className="text-sm text-ink-400 mt-0.5">{vendor.userPhone}</p>}
            <p className="text-sm font-medium text-copper mt-1">{vendor.businessName}</p>
            <p className="text-xs text-ink-300 mt-1">
              Registered {format(new Date(vendor.createdAt), 'dd MMM yyyy, hh:mm a')}
            </p>
          </div>
        </div>
      </div>

      {/* Stats — approved only */}
      {isApproved && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Avg Rating',     value: vendor.averageRating?.toFixed(1) ?? '—',                    icon: Star },
            { label: 'Total Rentals',  value: String(vendor.totalRentals),                                 icon: TrendingUp },
            { label: 'Total Earnings', value: `৳${Number(vendor.totalEarnings).toLocaleString()}`,         icon: CreditCard },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-white rounded-2xl border border-ink-100 p-4 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-copper/10">
                <Icon size={16} className="text-copper" />
              </div>
              <div>
                <p className="text-xs text-ink-400">{label}</p>
                <p className="font-semibold text-ink-800">{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Personal info */}
        <div className="bg-white rounded-2xl border border-ink-100 p-6">
          <h2 className="font-semibold text-ink-800 text-sm mb-3 flex items-center gap-2">
            <User size={14} className="text-ink-400" />
            Personal Information
          </h2>
          <InfoRow icon={Mail}       label="Email"      value={vendor.userEmail} />
          <InfoRow icon={Phone}      label="Phone"      value={vendor.userPhone   ?? '—'} />
          <InfoRow icon={MapPin}     label="Address"    value={vendor.userAddress ?? '—'} />
          <InfoRow icon={FileText}   label="NID Number" value={vendor.nidNumber   ?? '—'} />
          <InfoRow icon={CreditCard} label="bKash"      value={vendor.bkashNumber ?? '—'} />
        </div>

        {/* Business info */}
        <div className="bg-white rounded-2xl border border-ink-100 p-6">
          <h2 className="font-semibold text-ink-800 text-sm mb-3 flex items-center gap-2">
            <Building2 size={14} className="text-ink-400" />
            Business Information
          </h2>
          <InfoRow icon={Building2} label="Shop Name" value={vendor.businessName} />
          <InfoRow icon={MapPin}    label="Location"  value={`${vendor.district}, ${vendor.division}`} />
          {vendor.businessAddress && (
            <InfoRow icon={MapPin} label="Address" value={vendor.businessAddress} />
          )}
          {vendor.businessDescription && (
            <div className="flex items-start gap-3 py-3 border-b border-ink-50 last:border-0">
              <div className="p-1.5 rounded-lg bg-ink-50 flex-shrink-0 mt-0.5">
                <FileText size={14} className="text-ink-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-ink-400 mb-0.5">Description</p>
                <p className="text-sm text-ink-800 whitespace-pre-wrap">{vendor.businessDescription}</p>
              </div>
            </div>
          )}
          {isDeclined && vendor.suspensionReason && (
            <div className="flex items-start gap-3 py-3">
              <div className="p-1.5 rounded-lg bg-red-50 flex-shrink-0 mt-0.5">
                <ShieldAlert size={14} className="text-red-400" />
              </div>
              <div>
                <p className="text-xs text-red-400 mb-0.5">Decline Reason</p>
                <p className="text-sm text-red-700">{vendor.suspensionReason}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* NID images */}
      <div className="bg-white rounded-2xl border border-ink-100 p-6 mb-6">
        <h2 className="font-semibold text-ink-800 text-sm mb-4 flex items-center gap-2">
          <FileText size={14} className="text-ink-400" />
          Identity Documents
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <NidImage url={vendor.nidFrontImageUrl} label="NID Front" />
          <NidImage url={vendor.nidBackImageUrl}  label="NID Back" />
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-2xl border border-ink-100 p-6 space-y-3">
        <h2 className="font-semibold text-ink-800 text-sm mb-4">Actions</h2>

        {showDeclineBox && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-ink-600">Decline reason (optional)</label>
            <textarea value={declineReason} onChange={(e) => setDeclineReason(e.target.value)} rows={2}
              placeholder="Reason for declining…"
              className="w-full border border-ink-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-copper/30 resize-none" />
            <div className="flex gap-2">
              <button onClick={() => { setShowDeclineBox(false); setDeclineReason('') }}
                className="flex-1 py-2 text-sm border border-ink-200 rounded-xl text-ink-600 hover:bg-ink-50 transition">Cancel</button>
              <button onClick={handleDecline} disabled={rejectVendor.isPending}
                className="flex-1 py-2 text-sm font-medium bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {rejectVendor.isPending && <Loader2 size={14} className="animate-spin" />} Confirm Decline
              </button>
            </div>
          </div>
        )}

        {confirmDelete && !showDeclineBox && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
            <p className="text-sm font-medium text-red-700">Delete this vendor permanently?</p>
            <p className="text-xs text-red-500">This cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2 border border-red-300 rounded-xl text-red-600 text-sm hover:bg-red-100 transition">Cancel</button>
              <button onClick={handleDelete} disabled={deleteVendor.isPending}
                className="flex-1 py-2 bg-red-600 text-white text-sm rounded-xl hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-1.5">
                {deleteVendor.isPending && <Loader2 size={13} className="animate-spin" />} Yes, Delete
              </button>
            </div>
          </div>
        )}

        {!showDeclineBox && !confirmDelete && (
          <div className="flex flex-wrap gap-3">
            {(isPending || isDeclined) && (
              <button onClick={handleApprove} disabled={approveVendor.isPending}
                className="flex items-center gap-2 px-5 py-2.5 bg-forest text-white font-medium rounded-xl hover:bg-forest/90 disabled:opacity-50 transition text-sm">
                {approveVendor.isPending ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                {isDeclined ? 'Re-approve' : 'Approve'}
              </button>
            )}
            {(isPending || isApproved) && (
              <button onClick={() => setShowDeclineBox(true)}
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
