import { useCallback, useEffect, useMemo, useState } from 'react'
import { getAuction } from '@/api/auction'
import type { AuctionDetail } from '@/types/auction'

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
      const data = await getAuction(auctionId, { viewerIsSeller })
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
