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

function itemIdFromPayLink(links: ApiNotification['links']): string | undefined {
  const pay = links?.find((l) => l.rel === 'pay')
  if (!pay?.href) return undefined
  const m = pay.href.match(/\/items\/(\d+)\/pay/)
  return m?.[1]
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
    checkoutItemId: kind === 'WINNER' ? itemIdFromPayLink(n.links) ?? String(n.item_id) : undefined,
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
