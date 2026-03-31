import type { AuctionDetail, PlaceBidResult, UnpaidOrder } from '@/types/auction'

/**
 * Sample auction fixtures (e.g. sample-live) for local demos. Real pages use the catalogue API.
 */

/** Sample live auction state for demo IDs only */
let liveAuctionState = {
  currentBid: 100,
  minIncrement: 1,
  bidCount: 7,
  endsAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
}

const MOCK_CURRENCY = 'CAD'

function baseDetail(
  id: string,
  overrides: Partial<AuctionDetail> & Pick<AuctionDetail, 'title' | 'status'>
): AuctionDetail {
  return {
    id,
    description: 'Sample listing description for offline demos.',
    imageUrls: [],
    tags: [],
    currentBid: 0,
    startingPrice: 0,
    minIncrement: 1,
    bidCount: 0,
    hasBids: false,
    endsAt: null,
    viewerIsSeller: false,
    viewerIsWinner: false,
    ...overrides,
  }
}

export function getAuction(
  auctionId: string,
  options: { viewerIsSeller?: boolean } = {}
): Promise<AuctionDetail> {
  const viewerIsSeller = options.viewerIsSeller ?? false

  return new Promise((resolve) => {
    setTimeout(() => {
      if (auctionId === 'sample-live') {
        resolve(
          baseDetail('sample-live', {
            title: 'Vintage Camera — live auction (sample)',
            status: 'LIVE',
            tags: ['Electronics', 'Collectibles'],
            currentBid: liveAuctionState.currentBid,
            startingPrice: 100,
            minIncrement: liveAuctionState.minIncrement,
            bidCount: liveAuctionState.bidCount,
            hasBids: true,
            endsAt: liveAuctionState.endsAt,
            viewerIsSeller: false,
            viewerIsWinner: false,
          })
        )
        return
      }

      if (auctionId === 'sample-unsold') {
        resolve(
          baseDetail('sample-unsold', {
            title: 'Collectible Card — closed, no bids (sample)',
            status: 'CLOSED',
            currentBid: 0,
            startingPrice: 10,
            minIncrement: 1,
            bidCount: 0,
            hasBids: false,
            endsAt: new Date(Date.now() - 86400000).toISOString(),
            outcome: 'UNSOLD',
            viewerIsSeller,
            viewerIsWinner: false,
          })
        )
        return
      }

      if (auctionId === 'sample-sold') {
        resolve(
          baseDetail('sample-sold', {
            title: 'Rare Watch — sold, awaiting payment (sample)',
            status: 'CLOSED',
            currentBid: 450,
            startingPrice: 100,
            minIncrement: 1,
            bidCount: 14,
            hasBids: true,
            endsAt: new Date(Date.now() - 3600000).toISOString(),
            outcome: 'SOLD',
            unpaidOrderId: 'ord-sample-1',
            viewerIsSeller,
            viewerIsWinner: !viewerIsSeller,
          })
        )
        return
      }

      resolve(
        baseDetail(auctionId, {
          title: 'Unknown auction',
          status: 'CLOSED',
          currentBid: 0,
          startingPrice: 0,
          bidCount: 0,
          hasBids: false,
          endsAt: new Date().toISOString(),
          outcome: 'UNSOLD',
          viewerIsSeller: false,
          viewerIsWinner: false,
        })
      )
    }, 200)
  })
}

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
