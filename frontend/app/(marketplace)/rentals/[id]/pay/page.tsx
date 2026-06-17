'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery }             from '@tanstack/react-query'
import Link                     from 'next/link'
import {
  Loader2, CheckCircle2, ChevronLeft, Wallet, Lock,
  ArrowRight, ShieldCheck, Banknote,
} from 'lucide-react'
import Navbar           from '@/components/shared/Navbar'
import { useAuthStore } from '@/store/auth.store'
import { useMarkReady } from '@/lib/hooks/use-rentals'
import { api }          from '@/lib/api'
import { formatBDT, cn } from '@/lib/utils'
import type { Rental }  from '@/lib/hooks/use-rentals'

type PayStep = 'idle' | 'processing' | 'transfer1' | 'transfer2' | 'done'

function FlowRow({
  label, amount, dest, done, active,
}: {
  label:  string
  amount: number
  dest:   string
  done:   boolean
  active: boolean
}) {
  return (
    <div className={cn(
      'flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-500',
      done   ? 'border-forest bg-forest/5'  :
      active ? 'border-copper bg-copper/5 shadow-sm' :
               'border-ink-100 bg-white',
    )}>
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-500',
        done ? 'bg-forest text-white' : active ? 'bg-copper/20 text-copper' : 'bg-ink-100 text-ink-300',
      )}>
        {done
          ? <CheckCircle2 size={16} />
          : active
            ? <Loader2 size={14} className="animate-spin" />
            : <Banknote size={14} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium transition-colors', done ? 'text-forest' : active ? 'text-ink-800' : 'text-ink-400')}>
          {label}
        </p>
        <p className={cn('text-xs transition-colors', done ? 'text-forest/70' : 'text-ink-400')}>
          → {dest}
        </p>
      </div>
      <span className={cn('font-bold text-sm transition-colors', done ? 'text-forest' : active ? 'text-copper' : 'text-ink-300')}>
        {formatBDT(amount)}
      </span>
      {done && <CheckCircle2 size={16} className="text-forest flex-shrink-0" />}
    </div>
  )
}

export default function DemoPayPage() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()
  const user     = useAuthStore((s) => s.user)
  const markReady = useMarkReady()

  const [step, setStep]         = useState<PayStep>('idle')
  const [phone, setPhone]       = useState('')
  const [phoneErr, setPhoneErr] = useState('')

  useEffect(() => {
    if (!user) router.replace('/login')
  }, [user, router])

  const { data: rental, isLoading } = useQuery<Rental>({
    queryKey: ['rentals', id],
    queryFn:  async () => {
      const { data } = await api.get<{ data: Rental }>(`/rentals/${id}`)
      return data.data
    },
    enabled: !!id,
  })

  // Pre-fill bKash from renterNotes
  useEffect(() => {
    if (!rental || phone) return
    const stored = rental.renterNotes?.match(/Demo bKash payment: (\S+)/)?.[1]
    if (stored) setPhone(stored)
  }, [rental, phone])

  // Redirect if already paid or not in CONFIRMED state
  useEffect(() => {
    if (!rental) return
    if (rental.status === 'READY_FOR_PICKUP' || rental.status === 'ACTIVE') {
      router.replace(`/rentals/${id}?paid=1`)
    }
    if (rental.status !== 'CONFIRMED') {
      router.replace(`/rentals/${id}`)
    }
  }, [rental, id, router])

  const validatePhone = () => {
    if (!phone) { setPhoneErr('Enter your bKash number'); return false }
    if (!/^01[3-9]\d{8}$/.test(phone)) { setPhoneErr('Enter a valid Bangladeshi number (01XXXXXXXXX)'); return false }
    setPhoneErr('')
    return true
  }

  const handlePay = async () => {
    if (!validatePhone() || !rental || step !== 'idle') return

    // ── Step 1: Processing ──
    setStep('processing')
    await delay(1400)

    // ── Step 2: Transfer rental fee ──
    setStep('transfer1')
    await delay(900)

    // ── Step 3: Transfer deposit ──
    setStep('transfer2')
    await delay(900)

    // ── Step 4: Done — call API ──
    setStep('done')
    try {
      await markReady.mutateAsync(rental.id)
    } catch {
      // API error handled in hook; still show done UI briefly
    }
    await delay(2200)
    router.push(`/rentals/${id}?paid=1`)
  }

  if (isLoading || !rental) {
    return (
      <>
        <Navbar />
        <div className="max-w-lg mx-auto px-4 pt-24 pb-10 animate-pulse space-y-4">
          <div className="h-5 w-36 bg-ink-100 rounded" />
          <div className="h-8 w-2/3 bg-ink-100 rounded" />
          <div className="h-48 bg-white rounded-2xl border border-ink-100" />
          <div className="h-32 bg-white rounded-2xl border border-ink-100" />
          <div className="h-12 bg-ink-100 rounded-xl" />
        </div>
      </>
    )
  }

  const rentalFee   = rental.rentalFee
  const deliveryFee = rental.deliveryFee ?? 0
  const deposit     = rental.depositAmount
  const total       = rental.totalAmount
  const isRunning   = step !== 'idle' && step !== 'done'

  return (
    <>
      <Navbar />
      {/* Back link — sits below the fixed navbar */}
      {step === 'idle' && (
        <div className="max-w-md mx-auto px-4 sm:px-6 pt-20 md:pt-[88px]">
          <Link href={`/rentals/${id}`} className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800 transition">
            <ChevronLeft size={16} /> Back
          </Link>
        </div>
      )}
      <div className={`max-w-md mx-auto px-4 sm:px-6 pb-10 ${step === 'idle' ? 'pt-6' : 'pt-20 md:pt-[88px]'}`}>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-4xl">🟣</span>
          <div>
            <h1 className="font-fraunces text-2xl font-bold text-ink-900">Demo bKash</h1>
            <p className="text-ink-400 text-sm">Simulated payment — no real money charged</p>
          </div>
        </div>

        {/* ── Success state ── */}
        {step === 'done' && (
          <div className="text-center py-6 mb-6">
            <div className="w-16 h-16 bg-forest/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-forest" />
            </div>
            <h2 className="font-fraunces text-xl font-bold text-forest mb-1">Payment Successful!</h2>
            <p className="text-ink-500 text-sm">The seller has been notified. Redirecting…</p>
          </div>
        )}

        {/* Payment flow visualization */}
        <div className="space-y-3 mb-6">
          <FlowRow
            label={deliveryFee > 0 ? `Rental Fee + Delivery (${formatBDT(deliveryFee)})` : 'Rental Fee'}
            amount={rentalFee + deliveryFee}
            dest="Seller Wallet"
            done={step === 'transfer2' || step === 'done'}
            active={step === 'transfer1'}
          />
          <FlowRow
            label="Security Deposit"
            amount={deposit}
            dest="Admin Deposit Wallet"
            done={step === 'done'}
            active={step === 'transfer2'}
          />
        </div>

        {/* Total card */}
        <div className="bg-ink-50 rounded-2xl p-4 mb-6">
          <div className="flex justify-between items-center text-sm text-ink-600 mb-2">
            <span>Rental Fee</span>
            <span>{formatBDT(rentalFee)}</span>
          </div>
          {deliveryFee > 0 && (
            <div className="flex justify-between items-center text-sm text-ink-600 mb-2">
              <span>Delivery Fee</span>
              <span>{formatBDT(deliveryFee)}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-sm text-ink-600 mb-3">
            <span className="flex items-center gap-1"><Lock size={11} /> Security Deposit</span>
            <span>{formatBDT(deposit)}</span>
          </div>
          <div className="h-px bg-ink-200 mb-3" />
          <div className="flex justify-between items-center font-bold text-ink-900">
            <span>Total</span>
            <span className="text-copper text-lg">{formatBDT(total)}</span>
          </div>
        </div>

        {/* Status badge */}
        <div className={cn(
          'flex items-center justify-between px-4 py-3 rounded-xl mb-6 transition-all duration-500',
          step === 'done'
            ? 'bg-forest/10 border border-forest/20'
            : step !== 'idle'
              ? 'bg-amber-50 border border-amber-200'
              : 'bg-ink-50 border border-ink-200',
        )}>
          <span className="text-sm font-medium text-ink-700">Payment Status</span>
          <span className={cn(
            'text-sm font-bold flex items-center gap-1.5',
            step === 'done' ? 'text-forest' : step !== 'idle' ? 'text-amber-600' : 'text-ink-400',
          )}>
            {step === 'done' ? (
              <><CheckCircle2 size={14} /> Paid</>
            ) : step !== 'idle' ? (
              <><Loader2 size={13} className="animate-spin" /> Processing…</>
            ) : (
              'Pending'
            )}
          </span>
        </div>

        {/* Phone input — only shown before payment */}
        {step === 'idle' && (
          <div className="mb-5">
            <label className="block text-sm font-medium text-ink-700 mb-1.5">
              Your bKash number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); setPhoneErr('') }}
              placeholder="01XXXXXXXXX"
              className={cn(
                'w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 transition',
                phoneErr
                  ? 'border-red-300 focus:ring-red-200'
                  : 'border-ink-200 focus:ring-[#E2136E]/30 focus:border-[#E2136E]',
              )}
            />
            {phoneErr && <p className="text-xs text-red-500 mt-1">{phoneErr}</p>}
            <p className="text-xs text-ink-400 mt-1.5">
              Demo only — no OTP or real charge will occur.
            </p>
          </div>
        )}

        {/* Pay button */}
        {step !== 'done' && (
          <button
            onClick={handlePay}
            disabled={isRunning}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-4 font-bold rounded-2xl transition text-base',
              isRunning
                ? 'bg-[#E2136E]/60 text-white cursor-not-allowed'
                : 'bg-[#E2136E] text-white hover:bg-[#C4115E]',
            )}
          >
            {step === 'processing' ? (
              <><Loader2 size={18} className="animate-spin" /> Processing payment…</>
            ) : step === 'transfer1' ? (
              <><Loader2 size={18} className="animate-spin" /> Transferring rental fee…</>
            ) : step === 'transfer2' ? (
              <><Loader2 size={18} className="animate-spin" /> Securing deposit…</>
            ) : (
              <>Pay {formatBDT(total)} <ArrowRight size={18} /></>
            )}
          </button>
        )}

        {/* Trust note */}
        {step === 'idle' && (
          <div className="flex items-start gap-2.5 mt-5 p-3.5 bg-ink-50 rounded-xl">
            <ShieldCheck size={15} className="text-forest flex-shrink-0 mt-0.5" />
            <p className="text-xs text-ink-500">
              <strong>Deposit protection:</strong> Your ৳{deposit.toLocaleString()} deposit is held securely
              and refunded within 24h of confirmed return.
            </p>
          </div>
        )}
      </div>
    </>
  )
}

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}
