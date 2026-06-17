'use client'
import { useState } from 'react'
import { format }   from 'date-fns'
import {
  Star, Trash2, MessageSquare, ShieldCheck, ShieldAlert,
  Loader2, Search,
} from 'lucide-react'
import {
  useAdminReviews, useDeleteAdminReview, useDeleteAdminVendorFeedback,
  type AdminReviewRow, type AdminFeedbackRow,
} from '@/lib/hooks/use-admin'
import { cn } from '@/lib/utils'

// ── Helpers ──────────────────────────────────────────────────────────────────

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} size={12}
          className={cn(rating >= s ? 'text-amber-400 fill-amber-400' : 'text-ink-200')} />
      ))}
    </span>
  )
}

// ── Delete confirm button ─────────────────────────────────────────────────────

function DeleteBtn({ onDelete, isPending }: { onDelete: () => void; isPending: boolean }) {
  const [confirm, setConfirm] = useState(false)

  if (confirm) {
    return (
      <div className="flex items-center gap-1">
        <button onClick={() => setConfirm(false)}
          className="text-xs text-ink-400 hover:text-ink-600 px-2 py-1 rounded-lg hover:bg-ink-100 transition">
          Cancel
        </button>
        <button onClick={onDelete} disabled={isPending}
          className="text-xs text-red-600 font-semibold px-2 py-1 rounded-lg hover:bg-red-50 transition flex items-center gap-1 disabled:opacity-50">
          {isPending ? <Loader2 size={11} className="animate-spin" /> : null}
          Delete
        </button>
      </div>
    )
  }

  return (
    <button onClick={() => setConfirm(true)}
      className="p-1.5 text-ink-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
      <Trash2 size={14} />
    </button>
  )
}

// ── Customer reviews table ────────────────────────────────────────────────────

function ReviewsTable({ page, setPage }: { page: number; setPage: (p: number) => void }) {
  const { data, isLoading } = useAdminReviews('reviews', page)
  const deleteReview        = useDeleteAdminReview()

  const items = (data?.items ?? []) as AdminReviewRow[]

  return (
    <>
      <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="grid">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50">
                {['Reviewer', 'Product / Seller', 'Rating', 'Review', 'Seller Reply', 'Verified', 'Date', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-ink-400 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-4 bg-ink-100 rounded animate-pulse" style={{ width: `${40 + j * 7}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : !items.length ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-ink-400">
                    <Star size={32} className="mx-auto mb-3 opacity-30" />
                    No reviews yet
                  </td>
                </tr>
              ) : items.map((r) => (
                <tr key={r.id} className="hover:bg-ink-50/50 transition align-top">
                  <td className="px-4 py-4">
                    <p className="font-medium text-ink-800 whitespace-nowrap">{r.reviewerName}</p>
                    <p className="text-xs text-ink-400">{r.reviewerEmail}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-ink-700 whitespace-nowrap">{r.productName}</p>
                    <p className="text-xs text-ink-400">{r.vendorName}</p>
                  </td>
                  <td className="px-4 py-4">
                    <Stars rating={r.rating} />
                    <span className="text-xs text-ink-400 mt-0.5 block">{r.rating}/5</span>
                  </td>
                  <td className="px-4 py-4 max-w-[200px]">
                    {r.title && <p className="font-medium text-ink-800 text-xs mb-0.5">{r.title}</p>}
                    <p className="text-ink-600 text-xs line-clamp-3">{r.body}</p>
                  </td>
                  <td className="px-4 py-4 max-w-[160px]">
                    {r.vendorReply ? (
                      <div className="flex items-start gap-1">
                        <MessageSquare size={12} className="text-forest mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-ink-600 line-clamp-2">{r.vendorReply}</p>
                      </div>
                    ) : (
                      <span className="text-xs text-ink-300 italic">No reply</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {r.isVerified
                      ? <ShieldCheck size={15} className="text-forest" />
                      : <ShieldAlert size={15} className="text-ink-300" />}
                  </td>
                  <td className="px-4 py-4 text-xs text-ink-400 whitespace-nowrap">
                    {format(new Date(r.createdAt), 'dd MMM yyyy')}
                  </td>
                  <td className="px-4 py-4">
                    <DeleteBtn
                      onDelete={() => deleteReview.mutate(r.id)}
                      isPending={deleteReview.isPending && deleteReview.variables === r.id}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data && data.total > 20 && (
          <div className="px-5 py-3 border-t border-ink-100 flex items-center justify-between text-sm text-ink-500">
            <span>Page {page} · {data.total} total reviews</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}
                className="px-3 py-1.5 border border-ink-200 rounded-lg disabled:opacity-40 text-xs hover:border-copper/50 transition">
                Previous
              </button>
              <button onClick={() => setPage(page + 1)} disabled={page * 20 >= data.total}
                className="px-3 py-1.5 border border-ink-200 rounded-lg disabled:opacity-40 text-xs hover:border-copper/50 transition">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// ── Vendor feedback table ─────────────────────────────────────────────────────

function FeedbackTable({ page, setPage }: { page: number; setPage: (p: number) => void }) {
  const { data, isLoading } = useAdminReviews('feedback', page)
  const deleteFb            = useDeleteAdminVendorFeedback()

  const items = (data?.items ?? []) as AdminFeedbackRow[]

  return (
    <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" role="grid">
          <thead>
            <tr className="border-b border-ink-100 bg-ink-50">
              {['Seller', 'Customer', 'Rating', 'Comment', 'Date', ''].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-ink-400 uppercase tracking-wide whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-50">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-4">
                      <div className="h-4 bg-ink-100 rounded animate-pulse" style={{ width: `${45 + j * 8}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : !items.length ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center text-ink-400">
                  <Star size={32} className="mx-auto mb-3 opacity-30" />
                  No vendor feedback yet
                </td>
              </tr>
            ) : items.map((r) => (
              <tr key={r.id} className="hover:bg-ink-50/50 transition align-top">
                <td className="px-4 py-4">
                  <p className="font-medium text-ink-800 whitespace-nowrap">{r.vendorName}</p>
                </td>
                <td className="px-4 py-4">
                  <p className="text-ink-700 whitespace-nowrap">{r.customerName}</p>
                  <p className="text-xs text-ink-400">{r.customerEmail}</p>
                </td>
                <td className="px-4 py-4">
                  <Stars rating={r.rating} />
                  <span className="text-xs text-ink-400 mt-0.5 block">{r.rating}/5</span>
                </td>
                <td className="px-4 py-4 max-w-[240px]">
                  {r.comment
                    ? <p className="text-xs text-ink-600 line-clamp-3">{r.comment}</p>
                    : <span className="text-xs text-ink-300 italic">No comment</span>}
                </td>
                <td className="px-4 py-4 text-xs text-ink-400 whitespace-nowrap">
                  {format(new Date(r.createdAt), 'dd MMM yyyy')}
                </td>
                <td className="px-4 py-4">
                  <DeleteBtn
                    onDelete={() => deleteFb.mutate(r.id)}
                    isPending={deleteFb.isPending && deleteFb.variables === r.id}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.total > 20 && (
        <div className="px-5 py-3 border-t border-ink-100 flex items-center justify-between text-sm text-ink-500">
          <span>Page {page} · {data.total} total</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}
              className="px-3 py-1.5 border border-ink-200 rounded-lg disabled:opacity-40 text-xs hover:border-copper/50 transition">
              Previous
            </button>
            <button onClick={() => setPage(page + 1)} disabled={page * 20 >= data.total}
              className="px-3 py-1.5 border border-ink-200 rounded-lg disabled:opacity-40 text-xs hover:border-copper/50 transition">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminReviewsPage() {
  const [tab,  setTab]  = useState<'reviews' | 'feedback'>('reviews')
  const [page, setPage] = useState(1)

  const { data: reviewsData }  = useAdminReviews('reviews',  1, 1)
  const { data: feedbackData } = useAdminReviews('feedback', 1, 1)

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-fraunces text-2xl font-bold text-ink-900">Reviews</h1>
          <p className="text-ink-400 text-sm mt-0.5">
            Moderate customer reviews and seller feedback across all rentals
          </p>
        </div>

        {/* Counts */}
        <div className="flex gap-3">
          <div className="bg-white border border-ink-100 rounded-2xl px-4 py-3 text-center min-w-[100px]">
            <p className="text-xl font-bold text-ink-900">{reviewsData?.total ?? '—'}</p>
            <p className="text-xs text-ink-400 mt-0.5">Customer reviews</p>
          </div>
          <div className="bg-white border border-ink-100 rounded-2xl px-4 py-3 text-center min-w-[100px]">
            <p className="text-xl font-bold text-ink-900">{feedbackData?.total ?? '—'}</p>
            <p className="text-xs text-ink-400 mt-0.5">Seller feedbacks</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-ink-100 p-1 rounded-xl w-fit">
        {([
          { key: 'reviews',  label: 'Customer Reviews' },
          { key: 'feedback', label: 'Seller Feedback' },
        ] as const).map(({ key, label }) => (
          <button key={key}
            onClick={() => { setTab(key); setPage(1) }}
            className={cn('px-4 py-2 rounded-lg text-sm font-medium transition',
              tab === key ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-700')}>
            {label}
          </button>
        ))}
      </div>

      {/* Info banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700 mb-6 flex items-center gap-2">
        <ShieldAlert size={14} className="flex-shrink-0" />
        Deleting a review is permanent and cannot be undone. Only remove content that violates platform policies.
      </div>

      {tab === 'reviews'
        ? <ReviewsTable  page={page} setPage={setPage} />
        : <FeedbackTable page={page} setPage={setPage} />}
    </div>
  )
}
