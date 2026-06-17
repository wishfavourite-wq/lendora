'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, CheckCircle, Mail, User, MessageSquare } from 'lucide-react'

interface Props {
  open:    boolean
  onClose: () => void
}

type Status = 'idle' | 'sending' | 'sent'

export default function ContactModal({ open, onClose }: Props) {
  const [name,    setName]    = useState('')
  const [email,   setEmail]   = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [status,  setStatus]  = useState<Status>('idle')
  const firstRef = useRef<HTMLInputElement>(null)

  /* Focus first field on open */
  useEffect(() => {
    if (open) setTimeout(() => firstRef.current?.focus(), 150)
  }, [open])

  /* Reset on close */
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setName(''); setEmail(''); setSubject(''); setMessage(''); setStatus('idle')
      }, 300)
    }
  }, [open])

  /* Close on ESC */
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !message.trim()) return
    setStatus('sending')

    const body = `Name: ${name}\nEmail: ${email}\n\n${message}`
    const sub  = subject.trim() || 'Enquiry from Lendora'
    const href = `mailto:support@lendora.com.bd?subject=${encodeURIComponent(sub)}&body=${encodeURIComponent(body)}`

    setTimeout(() => {
      window.location.href = href
      setStatus('sent')
    }, 800)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-md bg-white dark:bg-surface-base rounded-3xl shadow-warm-xl
                         border border-ink-100 dark:border-surface-raised overflow-hidden"
              initial={{ scale: 0.95, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 16 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4">
                <div>
                  <h2 id="contact-modal-title" className="font-fraunces text-xl font-bold text-ink-900 dark:text-ink-100">
                    Contact Us
                  </h2>
                  <p className="text-xs text-ink-400 mt-0.5">We usually reply within a few hours</p>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-ink-100 dark:bg-surface-raised flex items-center justify-center
                             text-ink-500 hover:text-ink-900 dark:hover:text-ink-100 transition-colors
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper"
                  aria-label="Close contact form"
                >
                  <X size={15} />
                </button>
              </div>

              {status === 'sent' ? (
                <div className="flex flex-col items-center gap-3 px-6 pb-8 pt-4 text-center">
                  <div className="w-14 h-14 rounded-full bg-forest/10 flex items-center justify-center">
                    <CheckCircle size={28} className="text-forest" />
                  </div>
                  <p className="font-semibold text-ink-900 dark:text-ink-100">Email composed!</p>
                  <p className="text-sm text-ink-500">Your mail client should have opened with your message. Send it from there and we&apos;ll get back to you soon.</p>
                  <button onClick={onClose} className="btn-primary mt-2 px-6 py-2 text-sm h-9 min-h-0">
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="px-6 pb-6 space-y-4">
                  {/* Name */}
                  <div className="relative">
                    <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" aria-hidden="true" />
                    <input
                      ref={firstRef}
                      type="text"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full h-11 pl-9 pr-4 rounded-xl text-sm border border-ink-200 dark:border-surface-raised
                                 bg-ink-50 dark:bg-surface-raised text-ink-900 dark:text-ink-100
                                 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-copper/50 focus:border-copper"
                    />
                  </div>

                  {/* Email */}
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" aria-hidden="true" />
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full h-11 pl-9 pr-4 rounded-xl text-sm border border-ink-200 dark:border-surface-raised
                                 bg-ink-50 dark:bg-surface-raised text-ink-900 dark:text-ink-100
                                 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-copper/50 focus:border-copper"
                    />
                  </div>

                  {/* Subject */}
                  <input
                    type="text"
                    placeholder="Subject (optional)"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl text-sm border border-ink-200 dark:border-surface-raised
                               bg-ink-50 dark:bg-surface-raised text-ink-900 dark:text-ink-100
                               placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-copper/50 focus:border-copper"
                  />

                  {/* Message */}
                  <div className="relative">
                    <MessageSquare size={15} className="absolute left-3 top-3 text-ink-400 pointer-events-none" aria-hidden="true" />
                    <textarea
                      placeholder="How can we help you?"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      rows={4}
                      className="w-full pl-9 pr-4 pt-2.5 pb-2.5 rounded-xl text-sm border border-ink-200 dark:border-surface-raised
                                 bg-ink-50 dark:bg-surface-raised text-ink-900 dark:text-ink-100
                                 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-copper/50 focus:border-copper
                                 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!name.trim() || !email.trim() || !message.trim() || status === 'sending'}
                    className="btn-primary w-full h-11 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {status === 'sending' ? (
                      <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    ) : (
                      <Send size={15} />
                    )}
                    {status === 'sending' ? 'Opening mail client…' : 'Send Message'}
                  </button>

                  <p className="text-center text-xs text-ink-400">
                    Or email us directly at{' '}
                    <a href="mailto:support@lendora.com.bd" className="text-copper hover:underline">
                      support@lendora.com.bd
                    </a>
                  </p>
                </form>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
