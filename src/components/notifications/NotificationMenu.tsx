import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { listNotifications } from '@/api/auction'
import type { AppNotification } from '@/types/auction'
import { cn } from '@/lib/utils'

const kindStyles: Record<AppNotification['kind'], string> = {
  WINNER: 'text-emerald-700 bg-emerald-50',
  ITEM_SOLD: 'text-blue-700 bg-blue-50',
  OUTBID: 'text-amber-800 bg-amber-50',
  AUCTION_CLOSED: 'text-gray-700 bg-gray-100',
}

export function NotificationMenu() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<AppNotification[]>([])
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    void listNotifications().then(setItems)
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
        <div className="absolute right-0 mt-2 w-[min(100vw-2rem,22rem)] rounded-lg border border-gray-200 bg-white shadow-lg z-50">
          <div className="border-b border-gray-100 px-3 py-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Notifications</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Mock data — wire to your API (winner, outbid, sold, closed).
            </p>
          </div>
          <ul className="max-h-80 overflow-y-auto py-1">
            {items.map((n) => (
              <li
                key={n.id}
                className={cn(
                  'px-3 py-2.5 text-sm border-b border-gray-50 last:border-0',
                  !n.read && 'bg-stone-50'
                )}
              >
                <span
                  className={cn(
                    'inline-block text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded mb-1',
                    kindStyles[n.kind]
                  )}
                >
                  {n.kind.replace('_', ' ')}
                </span>
                <p className="font-medium text-gray-900">{n.title}</p>
                <p className="text-gray-600 text-xs mt-0.5 leading-snug">{n.body}</p>
              </li>
            ))}
          </ul>
          <div className="border-t border-gray-100 px-3 py-2">
            <Link
              to="/auctions/sample-sold"
              className="text-xs font-semibold text-orange-600 hover:text-orange-700"
              onClick={() => setOpen(false)}
            >
              View related auction (demo) →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
