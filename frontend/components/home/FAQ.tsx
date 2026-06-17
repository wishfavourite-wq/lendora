'use client'

import { useRef, useState } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { Plus, Minus, MessageCircle } from 'lucide-react'
import { FAQ_ITEMS } from '@/data/homeData'
import SupportChat from '@/components/ui/SupportChat'

function FAQItem({
  question, answer, index, isOpen, onToggle,
}: {
  question: string
  answer: string
  index: number
  isOpen: boolean
  onToggle: () => void
}) {
  const answerId = `faq-answer-${index}`
  const btnId    = `faq-btn-${index}`

  return (
    <div className={`border-b border-ink-100 dark:border-surface-raised last:border-0 transition-colors duration-200
                     ${isOpen ? 'bg-copper/3 dark:bg-copper/5 rounded-2xl px-2 -mx-2' : ''}`}>
      <h3>
        <button
          id={btnId}
          aria-expanded={isOpen}
          aria-controls={answerId}
          onClick={onToggle}
          className="w-full flex items-start justify-between gap-4 py-5 text-left
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper
                     focus-visible:ring-offset-2 rounded-xl group"
        >
          <span className={`text-sm md:text-base font-semibold leading-snug transition-colors
                            ${isOpen ? 'text-copper' : 'text-ink-800 dark:text-ink-200 group-hover:text-copper'}`}>
            {question}
          </span>
          <span
            className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center
                        transition-colors ${isOpen
                          ? 'bg-copper text-white'
                          : 'bg-ink-100 dark:bg-surface-raised text-ink-500 dark:text-ink-400'}`}
            aria-hidden="true"
          >
            {isOpen ? <Minus size={13} /> : <Plus size={13} />}
          </span>
        </button>
      </h3>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={answerId}
            role="region"
            aria-labelledby={btnId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.04, 0.62, 0.23, 0.98] }}
            style={{ overflow: 'hidden' }}
          >
            <p className="pb-5 text-sm text-ink-600 dark:text-ink-400 leading-relaxed pr-10">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function FAQ() {
  const ref    = useRef(null as HTMLElement | null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const [openIndex,   setOpenIndex]   = useState<number | null>(0)
  const [chatOpen,    setChatOpen]    = useState(false)

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i)

  return (
    <section
      ref={ref}
      className="section-pad bg-white dark:bg-surface-base"
      aria-labelledby="faq-heading"
    >
      <div className="container-page">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-10">
            <p className="section-label mb-2">Got questions?</p>
            <h2 id="faq-heading" className="section-title">Frequently asked</h2>
            <p className="section-desc mx-auto mt-3">
              Everything about renting, deposits, and getting started as a vendor.
            </p>
          </div>

          {/* Accordion */}
          <div
            className="bg-ink-50/50 dark:bg-surface-base rounded-3xl border
                       border-ink-100 dark:border-surface-raised px-6 divide-y-0"
            role="list"
          >
            {FAQ_ITEMS.map((item, i) => (
              <FAQItem
                key={i}
                question={item.question}
                answer={item.answer}
                index={i}
                isOpen={openIndex === i}
                onToggle={() => toggle(i)}
              />
            ))}
          </div>

          {/* Support CTA */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 text-center">
            <p className="text-sm text-ink-500 dark:text-ink-400">
              Still have questions?
            </p>
            <button
              onClick={() => setChatOpen(true)}
              className="flex items-center gap-2 text-sm font-semibold text-copper
                         hover:underline underline-offset-4 transition-colors
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper rounded"
            >
              <MessageCircle size={15} aria-hidden="true" />
              Chat with support
            </button>
          </div>

          <SupportChat open={chatOpen} onClose={() => setChatOpen(false)} />
        </motion.div>
      </div>
    </section>
  )
}
