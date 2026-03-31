import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteAllNotifications, deleteNotification, fetchNotifications } from '@/api/notifications'
import type { AppNotification } from '@/types/auction'
import { cn } from '@/lib/utils'

const kindStyles: Record<AppNotification['kind'], string> = {
  WINNER:
    'text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/50',
  ITEM_SOLD: 'text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-950/50',
  OUTBID: 'text-amber-800 bg-amber-50 dark:text-amber-200 dark:bg-amber-950/50',
  AUCTION_CLOSED: 'text-gray-700 bg-gray-100 dark:text-gray-300 dark:bg-muted',
}

export function NotificationMenu() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<AppNotification[]>([])
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    void fetchNotifications().then(setItems)
  }, [open])

  useEffect(() => {
    void fetchNotifications().then(setItems)
  }, [])

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const unread = items.filter((n) => !n.read).length

  async function dismissOne(id: string) {
    const ok = await deleteNotification(id)
    if (ok) setItems((prev) => prev.filter((n) => n.id !== id))
  }

  async function clearAll() {
    if (items.length === 0) return
    if (!window.confirm('Remove all notifications?')) return
    const ok = await deleteAllNotifications()
    if (ok) setItems([])
  }

  return (
    <div className="relative" ref={ref}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="relative text-gray-300 hover:text-white hover:bg-gray-800 h-9 w-9 p-0"
        aria-label="Notifications"
        onClick={() => setOpen((o) => !o)}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-orange-500 ring-2 ring-gray-900" />
        )}
      </Button>
      {open && (
        <div className="absolute right-0 mt-2 w-[min(100vw-2rem,22rem)] rounded-lg border border-gray-200 bg-white shadow-lg z-50 dark:border-border dark:bg-popover">
          <div className="border-b border-gray-100 px-3 py-2 dark:border-border">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide dark:text-muted-foreground">Notifications</p>
                <p className="text-xs text-gray-400 mt-0.5 dark:text-muted-foreground/80">
                  Open an auction to see the full listing. If you won, complete payment from that page.
                </p>
              </div>
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={() => void clearAll()}
                  className="shrink-0 cursor-pointer text-[11px] font-semibold text-gray-500 hover:text-orange-600 uppercase tracking-wide dark:text-muted-foreground dark:hover:text-orange-400"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
          <ul className="max-h-80 overflow-y-auto py-1">
            {items.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-gray-500 dark:text-muted-foreground">No notifications yet.</li>
            )}
            {items.map((n) => (
              <li
                key={n.id}
                className={cn(
                  'px-3 py-2.5 text-sm border-b border-gray-50 last:border-0 dark:border-border',
                  !n.read && 'bg-stone-50 dark:bg-muted/50'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span
                      className={cn(
                        'inline-block text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded mb-1',
                        kindStyles[n.kind]
                      )}
                    >
                      {n.kind.replace('_', ' ')}
                    </span>
                    <p className="font-medium text-gray-900 dark:text-foreground">{n.title}</p>
                    <p className="text-gray-600 dark:text-muted-foreground text-xs mt-0.5 leading-snug">{n.body}</p>
                    {n.auctionItemId && (
                      <Link
                        to={`/auctions/${n.auctionItemId}`}
                        className="inline-block mt-2 text-xs font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
                        onClick={() => setOpen(false)}
                      >
                        View auction →
                      </Link>
                    )}
                  </div>
                  <button
                    type="button"
                    aria-label="Dismiss notification"
                    className="shrink-0 cursor-pointer rounded p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors dark:hover:text-foreground dark:hover:bg-muted"
                    onClick={() => void dismissOne(n.id)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
