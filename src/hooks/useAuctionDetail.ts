import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AuctionDetail } from '@/types/auction'

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api'

async function fetchAuction(auctionId: string): Promise<AuctionDetail> {
  const res = await fetch(`${API_BASE}/catalogue/items/${auctionId}`, {
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Could not load this auction.')
  const item = await res.json()
  return {
    id: String(item.id),
    title: item.title,
    description: item.description,
    currentBid: item.current_price,
    minIncrement: 1,
    bidCount: 0,
    endsAt: item.end_time,
    status: item.status === 'active' ? 'LIVE' : 'CLOSED',
    viewerIsSeller: false,
    viewerIsWinner: false,
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
      setAuction(data)
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

  const isLive = useMemo(() => auction?.status === 'LIVE', [auction?.status])

  useEffect(() => {
    if (!auctionId || !isLive) return
    const id = window.setInterval(() => {
      void refresh()
    }, 5000)
    return () => window.clearInterval(id)
  }, [auctionId, isLive, refresh])

  return { auction, loading, loadError, refresh }
}
