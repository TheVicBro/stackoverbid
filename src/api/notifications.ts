import type { AppNotification, NotificationKind } from '@/types/auction'

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api'

type ApiNotification = {
  id: number
  item_id: number
  message: string
  is_highest_bidder: boolean
  read: boolean
  created_at: string
  links?: { rel: string; href: string; method?: string }[]
}

function mapKind(n: ApiNotification): NotificationKind {
  if (n.is_highest_bidder) return 'WINNER'
  if (/ended|closed|highest bid/i.test(n.message)) return 'AUCTION_CLOSED'
  return 'OUTBID'
}

function mapRow(n: ApiNotification): AppNotification {
  const kind = mapKind(n)
  return {
    id: String(n.id),
    kind,
    title:
      kind === 'WINNER'
        ? 'You won an auction'
        : kind === 'OUTBID'
          ? 'Auction result'
          : 'Auction closed',
    body: n.message,
    createdAt: typeof n.created_at === 'string' ? n.created_at : new Date().toISOString(),
    read: n.read,
    auctionItemId: String(n.item_id),
  }
}

export async function fetchNotifications(): Promise<AppNotification[]> {
  const res = await fetch(`${API_BASE}/notifications/`, { credentials: 'include', cache: 'no-store' })
  if (res.status === 401) return []
  if (!res.ok) return []
  const rows = (await res.json()) as ApiNotification[]
  if (!Array.isArray(rows)) return []
  return rows.map(mapRow)
}

const noStore: RequestInit = { cache: 'no-store' }

export async function deleteNotification(notificationId: string): Promise<boolean> {
  const num = Number(notificationId)
  if (!Number.isFinite(num)) return false

  // POST first: many hosts/proxies handle POST reliably; DELETE often 404s if not deployed or stripped.
  let res = await fetch(`${API_BASE}/notifications/dismiss`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notification_id: num }),
    ...noStore,
  })
  if (res.status === 204) return true
  if (res.status === 404) {
    res = await fetch(`${API_BASE}/notifications/${encodeURIComponent(notificationId)}`, {
      method: 'DELETE',
      credentials: 'include',
      ...noStore,
    })
  }
  return res.status === 204
}

export async function deleteAllNotifications(): Promise<boolean> {
  let res = await fetch(`${API_BASE}/notifications/dismiss-all`, {
    method: 'POST',
    credentials: 'include',
    ...noStore,
  })
  if (res.status === 204) return true
  if (res.status === 404) {
    res = await fetch(`${API_BASE}/notifications/all`, {
      method: 'DELETE',
      credentials: 'include',
      ...noStore,
    })
  }
  return res.status === 204
}
