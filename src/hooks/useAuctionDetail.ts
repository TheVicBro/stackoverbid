import { useCallback, useEffect, useState } from 'react'
import type { AuctionDetail, AuctionOutcome } from '@/types/auction'
import { parseUtcInstantMs } from '@/lib/utils'

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api'

async function fetchAuction(auctionId: string): Promise<AuctionDetail> {
  const [itemRes, meRes] = await Promise.all([
    fetch(`${API_BASE}/catalogue/items/${auctionId}`, { credentials: 'include', cache: 'no-store' }),
    fetch(`${API_BASE}/auth/me`, { credentials: 'include', cache: 'no-store' }),
  ])

  if (!itemRes.ok) throw new Error('Could not load this auction.')
  const item = await itemRes.json()
  const me = meRes.ok ? ((await meRes.json()) as { id: number }) : null

  const rawUrls = item.image_urls
  const imageUrls = Array.isArray(rawUrls) ? rawUrls.filter((u: unknown) => typeof u === 'string') : []

  const rawTags = item.tags
  let tags: string[] = []
  if (Array.isArray(rawTags)) {
    tags = rawTags.filter((t): t is string => typeof t === 'string')
  } else if (typeof rawTags === 'string') {
    try {
      const parsed = JSON.parse(rawTags) as unknown
      if (Array.isArray(parsed)) tags = parsed.filter((t): t is string => typeof t === 'string')
    } catch {
      tags = []
    }
  }

  const backendStatus = item.status as string
  const endMs = parseUtcInstantMs(item.end_time as string)
  const endTimePassed = Number.isFinite(endMs) && endMs <= Date.now()

  const isLive = backendStatus === 'active' && !endTimePassed

  const highestBidderId = item.highest_bidder_id as number | null | undefined
  const sellerId = item.seller_id as number
  const startingPrice = typeof item.starting_price === 'number' ? item.starting_price : Number(item.starting_price)
  const hasBids = highestBidderId != null

  let outcome: AuctionOutcome | undefined
  if (!isLive) {
    if (backendStatus === 'paid') {
      outcome = highestBidderId != null ? 'SOLD' : undefined
    } else if (backendStatus === 'closed') {
      outcome = highestBidderId != null ? 'SOLD' : 'UNSOLD'
    } else if (backendStatus === 'active' && endTimePassed) {
      outcome = highestBidderId != null ? 'SOLD' : 'UNSOLD'
    }
  }

  const viewerIsSeller = me != null && me.id === sellerId
  const viewerIsWinner = me != null && highestBidderId != null && me.id === highestBidderId

  return {
    id: String(item.id),
    title: item.title,
    description: item.description,
    imageUrls,
    tags,
    currentBid: item.current_price,
    startingPrice: Number.isFinite(startingPrice) ? startingPrice : item.current_price,
    minIncrement: 1,
    bidCount: 0,
    hasBids,
    endsAt: item.end_time,
    status: isLive ? 'LIVE' : 'CLOSED',
    outcome,
    viewerIsSeller,
    viewerIsWinner,
    isPaid: backendStatus === 'paid',
  }
}

export function useAuctionDetail(auctionId: string | undefined, viewerIsSeller: boolean) {
  const [auction, setAuction] = useState<AuctionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!auctionId) {
      setAuction(null)
      setLoadError(null)
      setLoading(false)
      return
    }
    try {
      const data = await fetchAuction(auctionId)
      if (viewerIsSeller) {
        setAuction({ ...data, viewerIsSeller: true })
      } else {
        setAuction(data)
      }
      setLoadError(null)
    } catch {
      setLoadError('Could not load this auction.')
    } finally {
      setLoading(false)
    }
  }, [auctionId, viewerIsSeller])

  useEffect(() => {
    setLoading(true)
    setAuction(null)
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (!auctionId) return
    const id = window.setInterval(() => {
      void refresh()
    }, 5000)
    return () => window.clearInterval(id)
  }, [auctionId, refresh])

  return { auction, loading, loadError, refresh }
}
