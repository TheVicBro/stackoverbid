import type { PlaceBidResult, UnpaidOrder } from '@/types/auction'

const MOCK_CURRENCY = 'CAD'

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api'

function fastApiDetailMessage(data: unknown): string {
  if (!data || typeof data !== 'object') return ''
  const d = (data as { detail?: unknown }).detail
  if (typeof d === 'string') return d
  if (Array.isArray(d) && d[0] && typeof d[0] === 'object' && 'msg' in d[0]) {
    return String((d[0] as { msg: string }).msg)
  }
  return ''
}

export async function placeBid(auctionId: string, amount: number): Promise<PlaceBidResult> {
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: 'BID_TOO_LOW', message: 'Enter a valid positive bid amount.' }
  }

  const itemId = parseInt(auctionId, 10)
  if (!Number.isFinite(itemId) || String(itemId) !== auctionId.trim()) {
    return { ok: false, error: 'AUCTION_CLOSED', message: 'Invalid auction.' }
  }

  const res = await fetch(`${API_BASE}/auction/items/${itemId}/bid`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount }),
  })

  if (res.ok) {
    return { ok: true }
  }

  const data = await res.json().catch(() => ({}))
  const detail = fastApiDetailMessage(data) || 'Could not place bid.'

  if (res.status === 401) {
    return { ok: false, message: 'You must be signed in to place a bid.' }
  }

  if (res.status === 404) {
    return { ok: false, message: detail }
  }

  if (res.status === 403) {
    return { ok: false, message: detail }
  }

  if (res.status === 422) {
    return { ok: false, error: 'BID_TOO_LOW', message: detail }
  }

  if (res.status === 400) {
    const lower = detail.toLowerCase()
    if (lower.includes('auction is closed') || lower.includes('auction has expired')) {
      return { ok: false, error: 'AUCTION_CLOSED', message: detail }
    }
    if (lower.includes('bid must be greater') || lower.includes('current price')) {
      return { ok: false, error: 'BID_TOO_LOW', message: detail }
    }
    return { ok: false, message: detail }
  }

  return { ok: false, message: detail }
}

export interface PatchAuctionItemResult {
  ok: boolean
  message?: string
}

export async function patchAuctionItem(
  auctionId: string,
  body: { title: string; description: string }
): Promise<PatchAuctionItemResult> {
  const itemId = parseInt(auctionId, 10)
  if (!Number.isFinite(itemId) || String(itemId) !== auctionId.trim()) {
    return { ok: false, message: 'Invalid auction.' }
  }

  const title = body.title.trim()
  const description = body.description.trim()
  if (!title || !description) {
    return { ok: false, message: 'Title and description are required.' }
  }

  const res = await fetch(`${API_BASE}/auction/items/${itemId}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description }),
  })

  if (res.ok) {
    return { ok: true }
  }

  const data = await res.json().catch(() => ({}))
  const detail = fastApiDetailMessage(data) || 'Could not update listing.'

  if (res.status === 401) {
    return { ok: false, message: 'You must be signed in to edit a listing.' }
  }
  if (res.status === 403 || res.status === 404 || res.status === 400 || res.status === 422) {
    return { ok: false, message: detail }
  }
  return { ok: false, message: detail }
}

export function getUnpaidOrder(orderId: string): Promise<UnpaidOrder | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (orderId !== 'ord-sample-1') {
        resolve(null)
        return
      }
      resolve({
        id: 'ord-sample-1',
        auctionId: 'sample-sold',
        title: 'Rare Watch — sold, awaiting payment (sample)',
        amountDue: 450,
        currency: MOCK_CURRENCY,
        status: 'UNPAID',
        createdAt: new Date().toISOString(),
      })
    }, 200)
  })
}
