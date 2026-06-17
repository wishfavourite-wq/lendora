'use client'
import { useState }  from 'react'
import {
  Tag, Plus, Pencil, Trash2, ToggleLeft, ToggleRight,
  X, Check, Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useAdminCategories, useCreateCategory, useUpdateCategory,
  useToggleCategory, useDeleteCategory,
  type AdminCategoryRow,
} from '@/lib/hooks/use-admin'

interface FormState { name: string; emoji: string }

export default function AdminCategoriesPage() {
  const { data: categories = [], isLoading } = useAdminCategories()
  const createCat  = useCreateCategory()
  const updateCat  = useUpdateCategory()
  const toggleCat  = useToggleCategory()
  const deleteCat  = useDeleteCategory()

  const [showAdd,  setShowAdd]  = useState(false)
  const [editId,   setEditId]   = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form,     setForm]     = useState<FormState>({ name: '', emoji: '' })

  function slugify(s: string) {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }

  function openAdd() { setForm({ name: '', emoji: '' }); setShowAdd(true) }

  function openEdit(cat: AdminCategoryRow) {
    setEditId(cat.id)
    setForm({ name: cat.name, emoji: cat.emoji })
  }

  function saveAdd() {
    if (!form.name.trim()) return
    createCat.mutate({ name: form.name.trim(), emoji: form.emoji || '📦' }, {
      onSuccess: () => setShowAdd(false),
    })
  }

  function saveEdit() {
    if (!form.name.trim() || editId === null) return
    updateCat.mutate({ id: editId, name: form.name.trim(), emoji: form.emoji || undefined }, {
      onSuccess: () => setEditId(null),
    })
  }

  const activeCount = categories.filter((c) => c.isActive).length

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-fraunces text-2xl font-bold text-ink-900 dark:text-ink-100">Categories</h1>
          <p className="text-ink-400 text-sm mt-0.5">
            {isLoading ? 'Loading…' : `${categories.length} categories · ${activeCount} active`}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-copper text-white rounded-xl hover:bg-copper/90 transition"
        >
          <Plus size={15} /> Add category
        </button>
      </div>

      <div className="bg-white dark:bg-surface-base rounded-2xl border border-ink-100 dark:border-surface-raised overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 dark:border-surface-raised bg-ink-50 dark:bg-surface-raised">
              {['Emoji', 'Name', 'Slug', 'Listings', 'Status', 'Actions'].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-ink-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-50 dark:divide-surface-raised">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-4 bg-ink-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center text-ink-400">
                  <Tag size={32} className="mx-auto mb-3 opacity-30" />
                  No categories yet
                </td>
              </tr>
            ) : categories.map((cat) => (
              <tr
                key={cat.id}
                className={cn(
                  'transition hover:bg-ink-50/50 dark:hover:bg-surface-raised/50',
                  !cat.isActive && 'opacity-50',
                )}
              >
                <td className="px-5 py-4 text-xl">{cat.emoji}</td>
                <td className="px-5 py-4 font-medium text-ink-800 dark:text-ink-200">
                  {editId === cat.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        value={form.emoji}
                        onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))}
                        className="w-12 border border-ink-200 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-copper/30"
                        placeholder="🏷️"
                      />
                      <input
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        className="border border-ink-200 rounded-lg px-3 py-1 text-sm outline-none focus:ring-2 focus:ring-copper/30"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <span>{cat.name}</span>
                  )}
                </td>
                <td className="px-5 py-4 text-ink-400 font-mono text-xs">{cat.slug}</td>
                <td className="px-5 py-4 text-ink-600 dark:text-ink-400">{cat.listingCount.toLocaleString()}</td>
                <td className="px-5 py-4">
                  <span className={cn(
                    'text-xs font-medium px-2.5 py-1 rounded-full',
                    cat.isActive ? 'bg-forest/10 text-forest' : 'bg-ink-100 text-ink-500',
                  )}>
                    {cat.isActive ? 'Active' : 'Hidden'}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    {editId === cat.id ? (
                      <>
                        <button
                          onClick={saveEdit}
                          disabled={updateCat.isPending}
                          className="text-forest hover:text-forest/80 transition disabled:opacity-50"
                        >
                          {updateCat.isPending ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                        </button>
                        <button onClick={() => setEditId(null)} className="text-ink-400 hover:text-ink-700 transition">
                          <X size={15} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => openEdit(cat)} className="text-ink-400 hover:text-copper transition" title="Edit">
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => toggleCat.mutate(cat.id)}
                          disabled={toggleCat.isPending}
                          className="text-ink-400 hover:text-copper transition disabled:opacity-50"
                          title={cat.isActive ? 'Hide' : 'Show'}
                        >
                          {cat.isActive ? <ToggleRight size={17} /> : <ToggleLeft size={17} />}
                        </button>
                        <button onClick={() => setDeleteId(cat.id)} className="text-ink-400 hover:text-red-500 transition" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-semibold text-ink-900 mb-4 flex items-center gap-2"><Tag size={16} /> New category</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Emoji</label>
                <input
                  value={form.emoji}
                  onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))}
                  placeholder="📦"
                  className="w-full border border-ink-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-copper/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Photography Gear"
                  autoFocus
                  className="w-full border border-ink-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-copper/30"
                />
                {form.name && (
                  <p className="text-xs text-ink-400 mt-1">Slug: <span className="font-mono">{slugify(form.name)}</span></p>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-5 justify-end">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-ink-600 border border-ink-200 rounded-xl hover:border-ink-300">Cancel</button>
              <button
                onClick={saveAdd}
                disabled={!form.name.trim() || createCat.isPending}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-copper text-white rounded-xl hover:bg-copper/90 disabled:opacity-50 transition"
              >
                {createCat.isPending && <Loader2 size={13} className="animate-spin" />}
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-semibold text-ink-900 mb-2">Delete category?</h3>
            <p className="text-sm text-ink-500 mb-5">
              This will remove <strong>{categories.find((c) => c.id === deleteId)?.name}</strong> from the platform.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm border border-ink-200 rounded-xl text-ink-600">Cancel</button>
              <button
                onClick={() => deleteCat.mutate(deleteId, { onSuccess: () => setDeleteId(null) })}
                disabled={deleteCat.isPending}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 transition"
              >
                {deleteCat.isPending && <Loader2 size={13} className="animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
