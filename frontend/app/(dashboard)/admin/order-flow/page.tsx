'use client'
import { cn } from '@/lib/utils'
import {
  UserCheck, Store, Package, ShoppingCart, Eye, CheckCircle2,
  CreditCard, Truck, Activity, RotateCcw, Search, Shield,
  Banknote, CheckSquare, XCircle, Ban, ArrowDown, ArrowRight,
  Info,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

type StepVariant = 'customer' | 'vendor' | 'system' | 'admin' | 'terminal-ok' | 'terminal-bad'

interface FlowStep {
  id:       string
  label:    string
  desc:     string
  actor:    string
  variant:  StepVariant
  icon:     React.ElementType
}

interface Phase {
  id:    string
  label: string
  color: string
  bg:    string
  steps: FlowStep[]
}

// ── Data ─────────────────────────────────────────────────────────────────────

const PHASES: Phase[] = [
  {
    id: 'onboarding', label: 'Platform Onboarding', color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200',
    steps: [
      { id: 'pv',  label: 'Pending Verification', desc: 'User registers and submits NID documents for review', actor: 'Customer / Seller',  variant: 'customer', icon: UserCheck },
      { id: 'app', label: 'Approved',              desc: 'Admin verifies identity and activates the account',   actor: 'Admin',            variant: 'admin',    icon: CheckCircle2 },
    ],
  },
  {
    id: 'listing', label: 'Product Listing', color: 'text-forest', bg: 'bg-forest/5 border-forest/20',
    steps: [
      { id: 'pub', label: 'Product Published', desc: 'Verified seller lists a product with pricing, deposit rules, and availability', actor: 'Seller', variant: 'vendor', icon: Package },
    ],
  },
  {
    id: 'booking', label: 'Booking & Payment', color: 'text-copper', bg: 'bg-copper/5 border-copper/20',
    steps: [
      { id: 'req', label: 'Rental Requested',   desc: 'Customer selects dates and submits a rental request with bKash reference', actor: 'Customer', variant: 'customer', icon: ShoppingCart },
      { id: 'rev', label: 'Seller Review',       desc: 'Seller examines the booking — customer profile, dates, and payment note',  actor: 'Seller',   variant: 'vendor',   icon: Eye },
      { id: 'acc', label: 'Accepted',            desc: 'Seller confirms the booking; rental moves to payment confirmation state',  actor: 'Seller',   variant: 'vendor',   icon: CheckCircle2 },
      { id: 'pay', label: 'Payment Completed',   desc: 'System registers the rental fee + security deposit as paid (demo bKash)',  actor: 'System',   variant: 'system',   icon: CreditCard },
    ],
  },
  {
    id: 'active', label: 'Active Rental', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200',
    steps: [
      { id: 'dis', label: 'Product Dispatched', desc: 'Seller ships or hands off the item; rental status becomes ACTIVE',                    actor: 'Seller',   variant: 'vendor',   icon: Truck },
      { id: 'act', label: 'Rental Active',       desc: 'Customer holds the item and uses it within the agreed rental period',                  actor: 'Customer', variant: 'customer', icon: Activity },
      { id: 'ret', label: 'Return Requested',    desc: 'Customer initiates return before or on the due date (late penalty applies if overdue)', actor: 'Customer', variant: 'customer', icon: RotateCcw },
    ],
  },
  {
    id: 'return', label: 'Return & Settlement', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200',
    steps: [
      { id: 'ins', label: 'Seller Inspection',  desc: 'Seller receives item, photographs condition, and logs damage report if any',              actor: 'Seller',   variant: 'vendor',   icon: Search },
      { id: 'adm', label: 'Admin Review',        desc: 'If damage or late penalty is disputed, admin adjudicates and sets final deduction amounts', actor: 'Admin',   variant: 'admin',    icon: Shield },
      { id: 'dep', label: 'Deposit Refunded',   desc: 'System calculates net refund: deposit minus any deductions, then marks as settled',        actor: 'System',  variant: 'system',   icon: Banknote },
      { id: 'com', label: 'Completed',           desc: 'Rental is fully settled; commission is transferred to platform wallet',                     actor: 'System',  variant: 'system',   icon: CheckSquare },
    ],
  },
]

const TERMINAL_REJECTED: FlowStep = {
  id: 'rej', label: 'Rejected', desc: 'Seller declines the booking; customer is notified and no payment is taken', actor: 'Seller', variant: 'terminal-bad', icon: XCircle,
}
const TERMINAL_CANCELLED: FlowStep = {
  id: 'can', label: 'Cancelled', desc: 'Customer or seller cancels the rental; deposit refund follows platform cancellation policy', actor: 'Customer / Seller', variant: 'terminal-bad', icon: Ban,
}

// ── Style maps ────────────────────────────────────────────────────────────────

const ACTOR_PILL: Record<string, string> = {
  'Customer':          'bg-blue-100 text-blue-700',
  'Seller':            'bg-copper/10 text-copper',
  'Admin':             'bg-forest/10 text-forest',
  'System':            'bg-ink-100 text-ink-600',
  'Customer / Seller': 'bg-indigo-100 text-indigo-700',
}

const VARIANT_ICON_BG: Record<StepVariant, string> = {
  'customer':    'bg-blue-100 text-blue-700',
  'vendor':      'bg-copper/10 text-copper',
  'system':      'bg-ink-100 text-ink-600',
  'admin':       'bg-forest/10 text-forest',
  'terminal-ok': 'bg-forest/10 text-forest',
  'terminal-bad':'bg-red-100 text-red-600',
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StepCard({ step, isLast }: { step: FlowStep; isLast?: boolean }) {
  const Icon     = step.icon
  const iconCls  = VARIANT_ICON_BG[step.variant]
  const pillCls  = ACTOR_PILL[step.actor] ?? 'bg-ink-100 text-ink-600'
  const isTermBad = step.variant === 'terminal-bad'

  return (
    <div className={cn(
      'flex gap-4 p-4 rounded-2xl border',
      isTermBad
        ? 'border-red-200 bg-red-50'
        : 'border-ink-100 bg-white',
    )}>
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', iconCls)}>
        <Icon size={17} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <p className={cn('text-sm font-semibold', isTermBad ? 'text-red-700' : 'text-ink-900')}>
            {step.label}
          </p>
          <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', pillCls)}>
            {step.actor}
          </span>
        </div>
        <p className="text-xs text-ink-500 leading-relaxed">{step.desc}</p>
      </div>
    </div>
  )
}

function ConnectorArrow({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center py-1 gap-0.5">
      <div className="w-0.5 h-3 bg-ink-200" />
      <ArrowDown size={12} className="text-ink-300" />
      {label && <span className="text-[10px] text-ink-400 font-medium">{label}</span>}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminOrderFlowPage() {
  return (
    <div className="p-8 max-w-3xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-fraunces text-2xl font-bold text-ink-900 mb-1">Order Status Flow</h1>
        <p className="text-ink-400 text-sm">
          Complete lifecycle of a rental on the Lendora platform — from account signup to order completion.
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-8 p-4 bg-white border border-ink-100 rounded-2xl">
        <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide w-full mb-1">Actor legend</p>
        {Object.entries(ACTOR_PILL).map(([actor, cls]) => (
          <span key={actor} className={cn('text-xs font-semibold px-3 py-1 rounded-full', cls)}>
            {actor}
          </span>
        ))}
      </div>

      {/* Phases */}
      <div className="space-y-6">
        {PHASES.map((phase, pi) => (
          <div key={phase.id}>
            {/* Phase header */}
            <div className={cn('flex items-center gap-2 px-4 py-2 rounded-xl border mb-3', phase.bg)}>
              <span className={cn('text-xs font-bold uppercase tracking-wider', phase.color)}>{phase.label}</span>
            </div>

            {/* Steps */}
            <div className="pl-4 space-y-0">
              {phase.steps.map((step, si) => {
                const isLastStep = si === phase.steps.length - 1
                return (
                  <div key={step.id}>
                    <StepCard step={step} isLast={isLastStep} />
                    {!isLastStep && <ConnectorArrow />}
                  </div>
                )
              })}
            </div>

            {/* Connector to next phase */}
            {pi < PHASES.length - 1 && <ConnectorArrow />}

            {/* Branch terminals after "Seller Review" (booking phase) */}
            {phase.id === 'booking' && (
              <div className="mt-1">
                <ConnectorArrow />
                <div className="pl-4 grid grid-cols-2 gap-3">
                  {/* Continue path */}
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-[10px] text-ink-400 font-semibold uppercase tracking-wide mb-2">
                      <ArrowDown size={11} /> Accepted path
                    </div>
                    <div className="h-px bg-ink-100" />
                  </div>
                  {/* Rejected path */}
                  <div>
                    <div className="flex items-center justify-center gap-1 text-[10px] text-red-400 font-semibold uppercase tracking-wide mb-2">
                      <ArrowRight size={11} /> Rejection path
                    </div>
                    <StepCard step={TERMINAL_REJECTED} />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Cancellation terminal — can happen at multiple points */}
        <div className={cn('p-4 rounded-2xl border border-amber-200 bg-amber-50')}>
          <div className="flex items-start gap-3">
            <Info size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800 mb-1">Cancellation (can occur at any stage)</p>
              <p className="text-xs text-amber-700 mb-3">
                Either party may cancel the rental before it becomes active. After dispatch, cancellations require admin intervention.
              </p>
              <StepCard step={TERMINAL_CANCELLED} />
            </div>
          </div>
        </div>

        {/* Status reference table */}
        <div className="bg-white border border-ink-100 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 bg-ink-50 border-b border-ink-100">
            <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide">System status reference</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-50">
                <th className="text-left px-5 py-2.5 text-xs font-semibold text-ink-400 uppercase tracking-wide">Flow step</th>
                <th className="text-left px-5 py-2.5 text-xs font-semibold text-ink-400 uppercase tracking-wide">System status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {[
                ['Rental Requested',   'PENDING_CONFIRMATION'],
                ['Seller Review',      'PENDING_CONFIRMATION'],
                ['Accepted',           'CONFIRMED'],
                ['Payment Completed',  'READY_FOR_PICKUP'],
                ['Product Dispatched', 'ACTIVE'],
                ['Rental Active',      'ACTIVE'],
                ['Return Requested',   'RETURN_REQUESTED'],
                ['Seller Inspection',  'RETURN_RECEIVED'],
                ['Admin Review',       'RETURN_RECEIVED (adminReviewRequired = true)'],
                ['Deposit Settled',    'COMPLETED'],
                ['Completed',          'COMPLETED'],
                ['Rejected / Cancelled', 'CANCELLED'],
              ].map(([step, status]) => (
                <tr key={step} className="hover:bg-ink-50/50">
                  <td className="px-5 py-2.5 text-ink-700 font-medium">{step}</td>
                  <td className="px-5 py-2.5">
                    <code className="text-xs bg-ink-100 text-ink-600 px-2 py-0.5 rounded font-mono">{status}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
