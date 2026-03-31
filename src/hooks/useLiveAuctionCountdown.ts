import { useEffect, useState } from 'react'
import { parseUtcInstantMs } from '@/lib/utils'

function formatTimeLeft(secondsRemaining: number): string {
  const s = Math.max(0, Math.floor(secondsRemaining))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 48) return `${Math.floor(h / 24)}d ${h % 24}h`
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${sec}s`
  return `${sec}s`
}

export type LiveAuctionCountdown = {
  primary: string
  hint: string | null
  /** Server still reports LIVE but local time is past `endsAt` */
  isFinalizing: boolean
}

/**
 * Drives a 1s-updating countdown from a fixed `endsAt` instant (UTC).
 * When the deadline passes but the parent still treats the auction as live, surfaces a "finalizing" state until refresh closes it.
 */
export function useLiveAuctionCountdown(endsAt: string | null, isLive: boolean): LiveAuctionCountdown {
  const [, setTick] = useState(0)

  useEffect(() => {
    if (!isLive || !endsAt) return
    const end = parseUtcInstantMs(endsAt)
    if (!Number.isFinite(end)) return

    const id = window.setInterval(() => setTick((t) => t + 1), 1000)
    return () => window.clearInterval(id)
  }, [endsAt, isLive])

  if (!isLive || !endsAt) {
    return { primary: '—', hint: null, isFinalizing: false }
  }

  const end = parseUtcInstantMs(endsAt)
  if (!Number.isFinite(end)) {
    return { primary: '—', hint: null, isFinalizing: false }
  }

  const secondsRemaining = (end - Date.now()) / 1000

  if (secondsRemaining > 0) {
    return {
      primary: formatTimeLeft(secondsRemaining),
      hint: null,
      isFinalizing: false,
    }
  }

  return {
    primary: 'Finalizing…',
    hint: 'Waiting for the server to confirm this auction has closed.',
    isFinalizing: true,
  }
}
