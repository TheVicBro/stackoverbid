import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { AlertCircle, CheckCircle2, Gavel, Trophy } from 'lucide-react'
import { placeBid } from '@/api/auction'
import { useAuctionDetail } from '@/hooks/useAuctionDetail'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { AuctionDetail } from '@/types/auction'

function formatMoney(n: number) {
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD' })
}

function timeLeft(endsAt: string | null) {
  if (!endsAt) return '—'
  const end = new Date(endsAt).getTime()
  if (Number.isNaN(end)) return '—'
  const now = Date.now()
  const s = Math.max(0, Math.floor((end - now) / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 48) return `${Math.floor(h / 24)}d ${h % 24}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m ${s % 60}s`
}

export function AuctionDetailPage() {
  const { auctionId } = useParams<{ auctionId: string }>()
  const [searchParams] = useSearchParams()
  const viewerIsSeller = searchParams.get('as') === 'seller'

  const { auction, loading, loadError, refresh } = useAuctionDetail(auctionId, viewerIsSeller)
  const [bidInput, setBidInput] = useState('')
  const [bidSubmitting, setBidSubmitting] = useState(false)
  const [bidError, setBidError] = useState<string | null>(null)
  const [bidSuccess, setBidSuccess] = useState(false)
  const successClearRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (successClearRef.current) window.clearTimeout(successClearRef.current)
    }
  }, [])

  const minNextBid = useMemo(() => {
    if (!auction || auction.status !== 'LIVE') return 0
    return auction.currentBid + auction.minIncrement
  }, [auction])

  const gallery = auction?.imageUrls ?? []
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  useEffect(() => {
    setActiveImageIndex(0)
  }, [auction?.id, gallery.length])

  const showPrev = useCallback(() => {
    setActiveImageIndex((i) => (gallery.length ? (i - 1 + gallery.length) % gallery.length : 0))
  }, [gallery.length])
  const showNext = useCallback(() => {
    setActiveImageIndex((i) => (gallery.length ? (i + 1) % gallery.length : 0))
  }, [gallery.length])

  async function handlePlaceBid(e: React.FormEvent) {
    e.preventDefault()
    if (!auctionId || !auction || auction.status !== 'LIVE') return
    const raw = parseFloat(bidInput.replace(/,/g, ''))
    if (Number.isNaN(raw) || !Number.isFinite(raw) || raw <= 0) {
      setBidError('Enter a valid amount.')
      return
    }
    if (raw < minNextBid) {
      setBidError(`Your bid must be at least ${formatMoney(minNextBid)}.`)
      return
    }
    setBidSubmitting(true)
    setBidError(null)
    setBidSuccess(false)
    const result = await placeBid(auctionId, raw)
    setBidSubmitting(false)
    if (!result.ok) {
      if (result.error === 'AUCTION_CLOSED') {
        setBidError('This auction has closed. Refreshing…')
        void refresh()
        return
      }
      if (result.error === 'BID_TOO_LOW') {
        setBidError(result.message ?? 'Your bid is too low.')
        return
      }
      setBidError('Could not place bid.')
      return
    }
    setBidSuccess(true)
    setBidInput('')
    void refresh()
    if (successClearRef.current) window.clearTimeout(successClearRef.current)
    successClearRef.current = window.setTimeout(() => setBidSuccess(false), 4000)
  }

  if (!auctionId) {
    return (
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10 space-y-4">
        <p className="text-gray-900 text-sm">Missing auction id.</p>
        <Button asChild variant="outline">
          <Link to="/">Back home</Link>
        </Button>
      </main>
    )
  }

  if (loading && !auction) {
    return (
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10">
        <p className="text-gray-600 text-sm">Loading auction…</p>
      </main>
    )
  }

  if (loadError || !auction) {
    return (
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10">
        <p className="text-red-700 text-sm">{loadError ?? 'Auction not found.'}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/">Back home</Link>
        </Button>
      </main>
    )
  }

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Link to="/" className="text-orange-600 hover:text-orange-700 font-medium">
          ← Home
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-600 truncate">{auction.title}</span>
      </div>

      <div className="rounded-lg border border-dashed border-gray-300 bg-white/80 px-3 py-2 text-xs text-gray-600">
        <strong className="text-gray-800">Preview mode:</strong> append{' '}
        <code className="bg-stone-100 px-1 rounded">?as=seller</code> to this URL to see the seller view for closed
        auctions (UC4).
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-xl">{auction.title}</CardTitle>
              <CardDescription className="mt-2 max-w-prose">{auction.description}</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              {auction.status === 'LIVE' ? (
                <Badge className="bg-emerald-600 hover:bg-emerald-600">Live</Badge>
              ) : (
                <Badge variant="secondary">Closed</Badge>
              )}
              {auction.outcome === 'SOLD' && <Badge className="bg-orange-500 hover:bg-orange-500">Sold</Badge>}
              {auction.outcome === 'UNSOLD' && (
                <Badge variant="outline" className="border-amber-400 text-amber-900">
                  Unsold
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {gallery.length > 0 ? (
            <div className="space-y-2">
              <div className="relative aspect-video rounded-lg overflow-hidden bg-stone-100 border border-stone-200">
                <img
                  src={gallery[activeImageIndex]}
                  alt=""
                  className="h-full w-full object-contain bg-stone-50"
                />
                {gallery.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={showPrev}
                      className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-gray-900/60 text-white p-2 hover:bg-gray-900/80 text-sm font-medium"
                      aria-label="Previous image"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      onClick={showNext}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-gray-900/60 text-white p-2 hover:bg-gray-900/80 text-sm font-medium"
                      aria-label="Next image"
                    >
                      ›
                    </button>
                    <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-gray-900/55 text-white text-xs px-2 py-0.5 tabular-nums">
                      {activeImageIndex + 1} / {gallery.length}
                    </span>
                  </>
                )}
              </div>
              {gallery.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {gallery.map((url, i) => (
                    <button
                      key={`${url}-${i}`}
                      type="button"
                      onClick={() => setActiveImageIndex(i)}
                      className={cn(
                        'shrink-0 h-16 w-16 rounded-md overflow-hidden border-2 transition-colors',
                        i === activeImageIndex ? 'border-orange-500 ring-1 ring-orange-200' : 'border-transparent opacity-80 hover:opacity-100'
                      )}
                    >
                      <img src={url} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="aspect-video rounded-lg bg-stone-200 border border-stone-100 flex items-center justify-center text-stone-400 text-sm">
              No photos for this listing
            </div>
          )}

          {auction.status === 'LIVE' && (
            <div className="grid sm:grid-cols-3 gap-4 text-sm">
              <div className="rounded-lg bg-stone-50 border border-stone-100 p-3">
                <p className="text-gray-500 text-xs font-medium uppercase">Current bid</p>
                <p className="text-2xl font-bold text-gray-900 tabular-nums">{formatMoney(auction.currentBid)}</p>
              </div>
              <div className="rounded-lg bg-stone-50 border border-stone-100 p-3">
                <p className="text-gray-500 text-xs font-medium uppercase">Min. next bid</p>
                <p className="text-2xl font-bold text-orange-600 tabular-nums">{formatMoney(minNextBid)}</p>
              </div>
              <div className="rounded-lg bg-stone-50 border border-stone-100 p-3">
                <p className="text-gray-500 text-xs font-medium uppercase">Time left</p>
                <p className="text-xl font-semibold text-gray-900">{timeLeft(auction.endsAt)}</p>
                <p className="text-xs text-gray-400 mt-1">Polling every 5s — swap for WebSocket when backend is ready.</p>
              </div>
            </div>
          )}

          {auction.status === 'LIVE' && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Gavel className="h-4 w-4 text-orange-500" />
                  Place a bid
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Matches UC3: validate active auction, minimum increment, success and error surfaces.
                </p>
                <form onSubmit={handlePlaceBid} className="mt-4 flex flex-col sm:flex-row gap-3 sm:items-end">
                  <div className="flex-1 space-y-1.5">
                    <label htmlFor="bid" className="text-xs font-medium text-gray-700">
                      Your bid ({formatMoney(minNextBid)} or higher)
                    </label>
                    <Input
                      id="bid"
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min={minNextBid}
                      placeholder={String(minNextBid)}
                      value={bidInput}
                      onChange={(e) => {
                        setBidInput(e.target.value)
                        setBidError(null)
                      }}
                      className="max-w-xs"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={bidSubmitting}
                    className="bg-orange-500 hover:bg-orange-400 text-white font-semibold shrink-0"
                  >
                    {bidSubmitting ? 'Placing…' : 'Place bid'}
                  </Button>
                </form>

                {bidError && (
                  <div
                    role="alert"
                    className="mt-4 flex gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{bidError}</span>
                  </div>
                )}
                {bidSuccess && (
                  <div
                    role="status"
                    className="mt-4 flex gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>Bid placed successfully. The listing will refresh for everyone after your backend broadcasts updates.</span>
                  </div>
                )}
              </div>
            </>
          )}

          {auction.status === 'CLOSED' && (
            <>
              <Separator />
              <ClosedAuctionSection auction={auction} />
            </>
          )}
        </CardContent>
      </Card>
    </main>
  )
}

function ClosedAuctionSection({ auction }: { auction: AuctionDetail }) {
  const isSold = auction.outcome === 'SOLD'
  const isUnsold = auction.outcome === 'UNSOLD'

  if (auction.viewerIsSeller) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">Seller view (UC4)</h3>
        {isUnsold && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            This item did not receive any bids before the auction ended. You can relist it from your dashboard when that
            flow exists.
          </div>
        )}
        {isSold && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
            Your item sold for <strong>{formatMoney(auction.currentBid)}</strong>. The buyer has an unpaid order until they
            complete checkout.
          </div>
        )}
      </div>
    )
  }

  if (isUnsold) {
    return (
      <p className="text-sm text-gray-600">
        This auction ended with no winning bid. Watch for similar listings on the marketplace.
      </p>
    )
  }

  if (isSold && auction.viewerIsWinner) {
    return (
      <div
        className={cn(
          'rounded-lg border px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4',
          'border-orange-200 bg-orange-50'
        )}
      >
        <div className="flex gap-3">
          <Trophy className="h-8 w-8 text-orange-500 shrink-0" />
          <div>
            <p className="font-semibold text-gray-900">You won this auction</p>
            <p className="text-sm text-gray-600 mt-1">
              Final price <strong>{formatMoney(auction.currentBid)}</strong>. Complete payment to confirm your purchase
              (UC4 — unpaid order).
            </p>
          </div>
        </div>
        <Button asChild className="bg-orange-500 hover:bg-orange-400 text-white font-semibold shrink-0">
          <Link to={`/checkout/${auction.id}`}>Pay now</Link>
        </Button>
      </div>
    )
  }

  if (isSold) {
    return (
      <p className="text-sm text-gray-600">
        This auction closed at <strong>{formatMoney(auction.currentBid)}</strong>. Another bidder won this item.
      </p>
    )
  }

  return null
}
