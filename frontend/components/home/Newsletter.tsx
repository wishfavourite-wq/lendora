'use client'

import { useRef, useState, useId } from 'react'
import { motion, useInView } from 'framer-motion'
import { Send, CheckCircle } from 'lucide-react'

type Status = 'idle' | 'loading' | 'success' | 'error'

export default function Newsletter() {
  const ref    = useRef(null as HTMLElement | null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const [email,  setEmail]  = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errMsg, setErrMsg] = useState('')
  const inputId = useId()
  const statusId = useId()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.includes('@')) {
      setErrMsg('Please enter a valid email address.')
      setStatus('error')
      return
    }
    setStatus('loading')
    setErrMsg('')
    await new Promise((r) => setTimeout(r, 1200))
    setStatus('success')
  }

  return (
    <section
      ref={ref}
      className="section-pad bg-ink-900 dark:bg-surface-bg relative overflow-hidden"
      aria-labelledby="newsletter-heading"
    >
      {/* Background kantha pattern */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="kantha-nl" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <line x1="0" y1="20" x2="40" y2="20" stroke="#C87941" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="20" y1="0" x2="20" y2="40" stroke="#C87941" strokeWidth="1" strokeDasharray="4 4" />
            <circle cx="20" cy="20" r="2.5" fill="none" stroke="#C87941" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#kantha-nl)" />
      </svg>

      {/* Copper glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                   w-full max-w-[500px] h-[300px] rounded-full bg-copper/15 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="container-page relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="max-w-xl mx-auto text-center"
        >
          <p className="section-label mb-2 text-copper">Stay in the loop</p>
          <h2 id="newsletter-heading" className="font-fraunces text-3xl md:text-4xl font-bold text-white leading-tight mb-4">
            Get weekly deals &amp;<br />new arrivals
          </h2>
          <p className="text-sm text-ink-400 mb-8">
            Be first to know about flash discounts, newly listed items, and vendor spotlights.
          </p>

          {status === 'success' ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-3 py-6"
              role="status"
              aria-live="polite"
            >
              <div className="w-14 h-14 rounded-full bg-forest/20 flex items-center justify-center">
                <CheckCircle size={28} className="text-forest-light" />
              </div>
              <p className="text-white font-semibold">You&apos;re subscribed!</p>
              <p className="text-sm text-ink-400">Check your inbox for a welcome offer.</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1">
                  <label htmlFor={inputId} className="sr-only">Email address</label>
                  <input
                    id={inputId}
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setStatus('idle'); setErrMsg('') }}
                    placeholder="your@email.com"
                    required
                    aria-describedby={status === 'error' ? statusId : undefined}
                    aria-invalid={status === 'error'}
                    className={`w-full h-12 px-4 rounded-xl text-sm bg-white/10 border text-white
                                placeholder:text-ink-500 outline-none transition-all
                                focus-visible:ring-2 focus-visible:ring-copper
                                ${status === 'error' ? 'border-red-500' : 'border-white/15 focus-visible:border-copper'}`}
                  />
                  {status === 'error' && (
                    <p id={statusId} role="alert" className="text-xs text-red-400 mt-1.5 text-left">
                      {errMsg}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="btn-primary h-12 px-6 rounded-xl flex-shrink-0 disabled:opacity-60"
                >
                  {status === 'loading' ? (
                    <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" aria-hidden="true" />
                  ) : (
                    <Send size={15} aria-hidden="true" />
                  )}
                  {status === 'loading' ? 'Subscribing…' : 'Subscribe'}
                </button>
              </div>
            </form>
          )}

        </motion.div>
      </div>
    </section>
  )
}
