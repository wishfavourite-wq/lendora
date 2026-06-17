'use client'
import { useState, useEffect } from 'react'
import { Settings, Save, CheckCircle, Loader2, AlertTriangle, Truck, Zap } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Setting {
  key:   string
  label: string
  desc:  string
  type:  'number' | 'text' | 'toggle' | 'select'
  value: string | boolean
  unit?: string
  options?: string[]
}

const SECTIONS: { title: string; settings: Setting[] }[] = [
  {
    title: 'Commission & Fees',
    settings: [
      { key: 'platform_commission_pct', label: 'Platform commission (%)',    desc: 'Percentage deducted from vendor earnings on each completed rental.',       type: 'number',  value: '5',    unit: '%'      },
      { key: 'min_rental_days',         label: 'Minimum rental days',        desc: 'Minimum number of days a renter must book an item.',                        type: 'number',  value: '1',    unit: 'days'   },
      { key: 'max_rental_days',         label: 'Maximum rental days',        desc: 'Maximum allowed rental duration without admin approval.',                   type: 'number',  value: '30',   unit: 'days'   },
    ],
  },
  {
    title: 'Deposit Rules',
    settings: [
      { key: 'deposit_refund_hours',    label: 'Deposit refund window (hrs)', desc: 'Hours within which vendors must confirm return and initiate deposit refund.', type: 'number', value: '24', unit: 'hrs' },
      { key: 'dispute_window_hours',    label: 'Dispute filing window (hrs)', desc: 'Window after rental end within which a dispute can be filed.',              type: 'number',  value: '48',   unit: 'hrs'    },
    ],
  },
  {
    title: 'Vendor Onboarding',
    settings: [
      { key: 'vendor_auto_approve',     label: 'Auto-approve vendors',       desc: 'Automatically approve new vendor applications without manual review.',      type: 'toggle',  value: false                  },
      { key: 'require_nid',             label: 'Require NID verification',   desc: 'Vendors must upload their National ID before listing any products.',        type: 'toggle',  value: true                   },
      { key: 'max_products_pending',    label: 'Max listings before approval', desc: 'How many items a new vendor can list before first approval.',             type: 'number',  value: '5',    unit: 'items'  },
    ],
  },
  {
    title: 'Platform Features',
    settings: [
      { key: 'rentals_enabled',         label: 'Rentals enabled',            desc: 'Allow new rental bookings across the platform.',                            type: 'toggle',  value: true                   },
      { key: 'new_registrations',       label: 'New registrations open',     desc: 'Allow new users to register. Disable during maintenance.',                  type: 'toggle',  value: true                   },
      { key: 'vendor_signups',          label: 'Vendor sign-ups open',       desc: 'Allow new vendor applications. Independent of renter registration.',        type: 'toggle',  value: true                   },
      { key: 'review_system',           label: 'Reviews enabled',            desc: 'Allow renters to leave reviews after completing a rental.',                 type: 'toggle',  value: true                   },
    ],
  },
  {
    title: 'Contact & Support',
    settings: [
      { key: 'support_email',     label: 'Support email',  desc: 'Public-facing email address shown in contact forms and footer.',  type: 'text',   value: 'support@lendora.com.bd' },
      { key: 'platform_timezone', label: 'Server timezone', desc: 'Timezone used for all timestamps and scheduled tasks.',          type: 'select', value: 'Asia/Dhaka', options: ['Asia/Dhaka', 'UTC'] },
    ],
  },
]

function DemoModeSection() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery<{ enabled: boolean }>({
    queryKey: ['admin', 'demo-mode'],
    queryFn:  async () => {
      const { data } = await api.get<{ data: { enabled: boolean } }>('/admin/settings/demo-mode')
      return data.data
    },
  })

  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    if (data !== undefined) setEnabled(data.enabled)
  }, [data])

  const save = useMutation({
    mutationFn: async (val: boolean) => {
      await api.put('/admin/settings/demo-mode', { enabled: val })
    },
    onSuccess: (_data, val) => {
      setEnabled(val)
      toast.success(val ? 'Demo mode enabled — 1 minute = 1 rental day.' : 'Demo mode disabled.')
      qc.invalidateQueries({ queryKey: ['admin', 'demo-mode'] })
      qc.invalidateQueries({ queryKey: ['settings', 'demo-mode'] })
    },
    onError: () => toast.error('Failed to update demo mode.'),
  })

  return (
    <div className={cn(
      'bg-white dark:bg-surface-base rounded-2xl overflow-hidden',
      enabled
        ? 'border-2 border-amber-400 dark:border-amber-500'
        : 'border border-ink-100 dark:border-surface-raised',
    )}>
      <div className={cn(
        'px-6 py-4 border-b flex items-center gap-2',
        enabled
          ? 'border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20'
          : 'border-ink-100 dark:border-surface-raised bg-ink-50 dark:bg-surface-raised',
      )}>
        <Zap size={14} className={enabled ? 'text-amber-600' : 'text-ink-400'} />
        <h2 className={cn(
          'font-semibold text-sm',
          enabled ? 'text-amber-800 dark:text-amber-300' : 'text-ink-800 dark:text-ink-200',
        )}>
          Demo Mode
        </h2>
        {enabled && (
          <span className="ml-1 px-2 py-0.5 text-xs font-bold bg-amber-500 text-white rounded-full">
            ACTIVE
          </span>
        )}
      </div>
      {isLoading ? (
        <div className="px-6 py-8 flex justify-center">
          <Loader2 size={20} className="animate-spin text-amber-500" />
        </div>
      ) : (
        <div className="px-6 py-4 flex items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-ink-800 dark:text-ink-200">Enable Demo Mode</p>
            <p className="text-xs text-ink-400 mt-0.5 leading-relaxed">
              Compresses time for demonstrations: 1 real minute = 1 rental day. Overdue detection and
              late fee deduction run at accelerated speed. Disable to restore normal calendar-based dates.
            </p>
          </div>
          <button
            onClick={() => save.mutate(!enabled)}
            disabled={save.isPending}
            className={cn(
              'relative w-11 h-6 rounded-full transition-colors disabled:opacity-50 flex-shrink-0',
              enabled ? 'bg-amber-500' : 'bg-ink-200 dark:bg-surface-overlay',
            )}
            role="switch"
            aria-checked={enabled}
          >
            <span className={cn(
              'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
              enabled ? 'translate-x-5' : 'translate-x-0',
            )} />
          </button>
        </div>
      )}
    </div>
  )
}

function CourierFeesSection() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery<{ forwardFee: number; returnFee: number }>({
    queryKey: ['admin', 'courier-settings'],
    queryFn:  async () => {
      const { data } = await api.get<{ data: { forwardFee: number; returnFee: number } }>('/admin/settings/courier')
      return data.data
    },
  })

  const [fwd, setFwd] = useState<string>('')
  const [ret, setRet] = useState<string>('')
  const [dirty, setDirty] = useState(false)

  // Initialize inputs when data loads (only if user hasn't started editing)
  useEffect(() => {
    if (data && !dirty) {
      setFwd(String(data.forwardFee))
      setRet(String(data.returnFee))
    }
  }, [data])

  const save = useMutation({
    mutationFn: async () => {
      await api.put('/admin/settings/courier', {
        forwardFee: Number(fwd),
        returnFee:  Number(ret),
      })
    },
    onSuccess: () => {
      toast.success('Courier fees updated.')
      setDirty(false)
      qc.invalidateQueries({ queryKey: ['admin', 'courier-settings'] })
      qc.invalidateQueries({ queryKey: ['courier-fees'] })
    },
    onError: () => toast.error('Failed to save courier fees.'),
  })

  const inputCls = 'w-32 border border-ink-200 dark:border-surface-overlay rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-copper/30 text-right bg-white dark:bg-surface-raised text-ink-900 dark:text-ink-100'

  return (
    <div className="bg-white dark:bg-surface-base rounded-2xl border border-ink-100 dark:border-surface-raised overflow-hidden">
      <div className="px-6 py-4 border-b border-ink-100 dark:border-surface-raised bg-ink-50 dark:bg-surface-raised flex items-center justify-between">
        <h2 className="font-semibold text-ink-800 dark:text-ink-200 text-sm flex items-center gap-2">
          <Truck size={14} className="text-copper" /> Courier Fees
        </h2>
        <button
          onClick={() => save.mutate()}
          disabled={save.isPending || !dirty}
          className={cn(
            'flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg transition',
            dirty ? 'bg-copper text-white hover:bg-copper/90 disabled:opacity-60' : 'bg-ink-100 text-ink-400 cursor-not-allowed',
          )}
        >
          {save.isPending ? <><Loader2 size={12} className="animate-spin" /> Saving…</> : <><Save size={12} /> Save</>}
        </button>
      </div>
      {isLoading ? (
        <div className="px-6 py-8 flex justify-center">
          <Loader2 size={20} className="animate-spin text-copper" />
        </div>
      ) : (
        <div className="divide-y divide-ink-50 dark:divide-surface-raised">
          <div className="px-6 py-4 flex items-start justify-between gap-6">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink-800 dark:text-ink-200">Forward courier fee (৳)</p>
              <p className="text-xs text-ink-400 mt-0.5">Added to rental total when customer selects Courier delivery.</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <input
                type="number"
                value={fwd}
                onChange={(e) => { setFwd(e.target.value); setDirty(true) }}
                className={inputCls}
              />
              <span className="text-xs text-ink-400">৳</span>
            </div>
          </div>
          <div className="px-6 py-4 flex items-start justify-between gap-6">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink-800 dark:text-ink-200">Return courier fee (৳)</p>
              <p className="text-xs text-ink-400 mt-0.5 leading-relaxed">
                Non-refundable. Deducted from deposit when customer returns via courier.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <input
                type="number"
                value={ret}
                onChange={(e) => { setRet(e.target.value); setDirty(true) }}
                className={inputCls}
              />
              <span className="text-xs text-ink-400">৳</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminSettingsPage() {
  const [values,  setValues]  = useState<Record<string, string | boolean>>(() =>
    Object.fromEntries(SECTIONS.flatMap((s) => s.settings).map((s) => [s.key, s.value]))
  )
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)

  function update(key: string, val: string | boolean) {
    setValues((v) => ({ ...v, [key]: val }))
    setSaved(false)
  }

  async function save() {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 1200))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-fraunces text-2xl font-bold text-ink-900 dark:text-ink-100 flex items-center gap-2">
            <Settings size={22} className="text-ink-400" />
            Platform Settings
          </h1>
          <p className="text-ink-400 text-sm mt-0.5">Controls global behaviour of the Lendora platform</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition',
            saved ? 'bg-forest text-white' : 'bg-copper text-white hover:bg-copper/90 disabled:opacity-60'
          )}
        >
          {saving  ? <><Loader2 size={15} className="animate-spin" /> Saving…</> :
           saved   ? <><CheckCircle size={15} /> Saved</> :
                     <><Save size={15} /> Save settings</>}
        </button>
      </div>

      <div className="space-y-8">
        {/* Demo Mode — must appear first so it's prominent */}
        <DemoModeSection />

        {/* Live courier fees section */}
        <CourierFeesSection />

        {SECTIONS.map((section) => (
          <div key={section.title} className="bg-white dark:bg-surface-base rounded-2xl border border-ink-100 dark:border-surface-raised overflow-hidden">
            <div className="px-6 py-4 border-b border-ink-100 dark:border-surface-raised bg-ink-50 dark:bg-surface-raised">
              <h2 className="font-semibold text-ink-800 dark:text-ink-200 text-sm">{section.title}</h2>
            </div>
            <div className="divide-y divide-ink-50 dark:divide-surface-raised">
              {section.settings.map((s) => (
                <div key={s.key} className="px-6 py-4 flex items-start justify-between gap-6">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink-800 dark:text-ink-200">{s.label}</p>
                    <p className="text-xs text-ink-400 mt-0.5 leading-relaxed">{s.desc}</p>
                  </div>
                  <div className="flex-shrink-0">
                    {s.type === 'toggle' ? (
                      <button
                        onClick={() => update(s.key, !values[s.key])}
                        className={cn(
                          'relative w-11 h-6 rounded-full transition-colors',
                          values[s.key] ? 'bg-forest' : 'bg-ink-200 dark:bg-surface-overlay'
                        )}
                        role="switch"
                        aria-checked={!!values[s.key]}
                      >
                        <span className={cn(
                          'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                          values[s.key] ? 'translate-x-5' : 'translate-x-0'
                        )} />
                      </button>
                    ) : s.type === 'select' ? (
                      <select
                        value={values[s.key] as string}
                        onChange={(e) => update(s.key, e.target.value)}
                        className="border border-ink-200 dark:border-surface-overlay rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-copper/30 bg-white dark:bg-surface-raised text-ink-900 dark:text-ink-100"
                      >
                        {s.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          type={s.type}
                          value={values[s.key] as string}
                          onChange={(e) => update(s.key, e.target.value)}
                          className="w-32 border border-ink-200 dark:border-surface-overlay rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-copper/30 text-right bg-white dark:bg-surface-raised text-ink-900 dark:text-ink-100"
                          min={s.type === 'number' ? 0 : undefined}
                        />
                        {s.unit && <span className="text-xs text-ink-400">{s.unit}</span>}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Warning */}
      <div className="mt-6 flex items-start gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30">
        <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
          Changing platform commission, deposit windows, or toggling registrations takes immediate effect. Review carefully before saving.
        </p>
      </div>
    </div>
  )
}
