'use client'

import { useRef, useState, useEffect } from 'react'
import { Bell, Check, CheckCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNotifications, useMarkAllRead, useMarkOneRead, type AppNotification } from '@/lib/hooks/use-notifications'
import { formatDistanceToNow } from 'date-fns'

export default function NotificationBell() {
  const [open, setOpen]   = useState(false)
  const panelRef          = useRef<HTMLDivElement>(null)
  const { data }          = useNotifications()
  const markAll           = useMarkAllRead()
  const markOne           = useMarkOneRead()

  const items  = data?.items  ?? []
  const unread = data?.unread ?? 0

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleMarkOne = (item: AppNotification) => {
    if (!item.readAt) markOne.mutate(item.id)
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((p) => !p)}
        className="relative w-9 h-9 flex items-center justify-center rounded-full
                   text-ink-600 dark:text-ink-400
                   hover:bg-ink-100 dark:hover:bg-surface-raised transition-colors
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper"
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none select-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-surface-base rounded-xl border border-ink-100 dark:border-surface-raised shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-ink-100 dark:border-surface-raised">
            <span className="text-sm font-semibold text-ink-900 dark:text-ink-100">Notifications</span>
            {unread > 0 && (
              <button
                onClick={() => markAll.mutate()}
                className="flex items-center gap-1 text-xs text-copper hover:text-copper/80 transition-colors"
              >
                <CheckCheck size={13} />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-ink-50 dark:divide-surface-raised">
            {items.length === 0 ? (
              <p className="text-sm text-ink-400 text-center py-8">No notifications yet</p>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleMarkOne(item)}
                  className={cn(
                    'w-full text-left px-4 py-3 hover:bg-ink-50 dark:hover:bg-surface-raised transition-colors',
                    !item.readAt && 'bg-copper/5'
                  )}
                >
                  <div className="flex items-start gap-2">
                    {!item.readAt && (
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-copper flex-shrink-0" />
                    )}
                    <div className={cn('min-w-0', item.readAt && 'pl-3.5')}>
                      <p className={cn('text-sm font-medium text-ink-900 dark:text-ink-100 truncate', item.readAt && 'font-normal text-ink-600 dark:text-ink-400')}>
                        {item.title}
                      </p>
                      <p className="text-xs text-ink-500 dark:text-ink-500 mt-0.5 line-clamp-2">{item.body}</p>
                      <p className="text-[11px] text-ink-300 dark:text-ink-600 mt-1">
                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
