'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Loader2 } from 'lucide-react'

interface Message {
  id:     number
  from:   'user' | 'support'
  text:   string
  time:   string
}

const BOT_REPLIES = [
  'Thanks for reaching out! Our support team will get back to you very soon.',
  'Got it! We\'ll look into this and respond as quickly as possible.',
  'Thanks for your message. For urgent queries you can also WhatsApp us directly.',
  'Noted! A support agent will follow up with you shortly.',
]

function now() {
  return new Date().toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit' })
}

const WELCOME: Message = {
  id:   0,
  from: 'support',
  text: 'Hi! 👋 Welcome to Lendora Support. How can we help you today?',
  time: now(),
}

interface Props {
  open:    boolean
  onClose: () => void
}

export default function SupportChat({ open, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [input,    setInput]    = useState('')
  const [typing,   setTyping]   = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)

  /* Scroll to bottom when messages change */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  /* Focus input when chat opens */
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300)
  }, [open])

  /* Reset to welcome message each time chat is opened */
  useEffect(() => {
    if (open) setMessages([{ ...WELCOME, time: now() }])
  }, [open])

  function send() {
    const text = input.trim()
    if (!text) return
    setInput('')

    const userMsg: Message = { id: Date.now(), from: 'user', text, time: now() }
    setMessages((prev) => [...prev, userMsg])
    setTyping(true)

    const delay = 1200 + Math.random() * 800
    setTimeout(() => {
      const reply = BOT_REPLIES[Math.floor(Math.random() * BOT_REPLIES.length)]
      setMessages((prev) => [...prev, { id: Date.now() + 1, from: 'support', text: reply!, time: now() }])
      setTyping(false)
    }, delay)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop — closes on click */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Chat panel */}
          <motion.div
            role="dialog"
            aria-label="Lendora support chat"
            aria-modal="true"
            className="fixed bottom-6 right-6 z-50 w-[340px] max-w-[calc(100vw-2rem)]
                       flex flex-col rounded-3xl shadow-warm-xl overflow-hidden
                       bg-white dark:bg-surface-base border border-ink-100 dark:border-surface-raised"
            initial={{ opacity: 0, y: 32, scale: 0.95 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{ opacity: 0, y: 32, scale: 0.95 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{ height: 460 }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-forest text-white flex-shrink-0">
              <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center
                              font-fraunces font-bold text-sm select-none flex-shrink-0">
                L
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-tight">Lendora Support</p>
                <p className="text-[11px] text-white/70 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                  Online · usually replies within minutes
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center
                           transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                aria-label="Close support chat"
              >
                <X size={14} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.from === 'support' && (
                    <div className="w-7 h-7 rounded-full bg-forest/10 flex items-center justify-center
                                    text-xs font-bold text-forest flex-shrink-0 mt-0.5">
                      L
                    </div>
                  )}
                  <div className={`max-w-[75%] flex flex-col gap-0.5 ${msg.from === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed
                      ${msg.from === 'user'
                        ? 'bg-copper text-white rounded-br-sm'
                        : 'bg-ink-100 dark:bg-surface-raised text-ink-800 dark:text-ink-200 rounded-bl-sm'}`}>
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-ink-400 dark:text-ink-600 px-1">{msg.time}</span>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {typing && (
                <div className="flex gap-2 justify-start">
                  <div className="w-7 h-7 rounded-full bg-forest/10 flex items-center justify-center text-xs font-bold text-forest flex-shrink-0">
                    L
                  </div>
                  <div className="bg-ink-100 dark:bg-surface-raised px-4 py-2.5 rounded-2xl rounded-bl-sm flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-ink-400 animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-ink-400 animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-ink-400 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 px-3 pb-3 pt-2 border-t border-ink-100 dark:border-surface-raised flex-shrink-0">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="Type a message…"
                className="flex-1 text-sm bg-ink-50 dark:bg-surface-raised rounded-xl px-3 py-2
                           border border-ink-200 dark:border-surface-overlay
                           text-ink-900 dark:text-ink-100 placeholder:text-ink-400
                           focus:outline-none focus:ring-2 focus:ring-copper/50"
                aria-label="Type your support message"
              />
              <button
                onClick={send}
                disabled={!input.trim() || typing}
                className="w-9 h-9 rounded-xl bg-copper flex items-center justify-center
                           text-white hover:bg-copper/90 transition-colors
                           disabled:opacity-40 disabled:cursor-not-allowed
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper"
                aria-label="Send message"
              >
                {typing ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
