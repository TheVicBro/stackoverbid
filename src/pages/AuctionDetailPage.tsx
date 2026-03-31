import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { AlertCircle, CheckCircle2, Gavel, Pencil, Trophy } from 'lucide-react'
import { placeBid } from '@/api/auction'
import { useAuctionDetail } from '@/hooks/useAuctionDetail'
import { useLiveAuctionCountdown } from '@/hooks/useLiveAuctionCountdown'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { formatAppCurrency } from '@/lib/currency'
import { cn } from '@/lib/utils'
import type { AuctionDetail } from '@/types/auction'

function formatMoney(n: number) {
  return formatAppCurrency(n)
}

export function AuctionDetailPage() {
  const { auctionId } = useParams<{ auctionId: string }>()
  const [searchParams] = useSearchParams()
  const viewerIsSeller = searchParams.get('as') === 'seller'

  const { auction, loading, loadError, refresh } = useAuctionDetail(auctionId, viewerIsSeller)
  const countdown = useLiveAuctionCountdown(auction?.endsAt ?? null, auction?.status === 'LIVE')
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

  useEffect(() => {
    if (!countdown.isFinalizing || !auctionId) return
    const id = window.setInterval(() => {
      void refresh()
    }, 2000)
    return () => window.clearInterval(id)
  }, [countdown.isFinalizing, auctionId, refresh])

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
      setBidError(result.message ?? 'Could not place bid.')
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
        <p className="text-gray-900 dark:text-foreground text-sm">Missing auction id.</p>
        <Button asChild variant="outline">
          <Link to="/">Back home</Link>
        </Button>
      </main>
    )
  }

  if (loading && !auction) {
    return (
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10">
        <p className="text-gray-600 dark:text-muted-foreground text-sm">Loading auction…</p>
      </main>
    )
  }

  if (loadError || !auction) {
    return (
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10">
        <p className="text-red-700 dark:text-red-400 text-sm">{loadError ?? 'Auction not found.'}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/">Back home</Link>
        </Button>
      </main>
    )
  }

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Link to="/" className="text-orange-600 hover:text-orange-700 font-medium dark:text-orange-400 dark:hover:text-orange-300">
          ← Home
        </Link>
        <span className="text-gray-300 dark:text-muted-foreground">/</span>
        <span className="text-gray-600 dark:text-muted-foreground truncate">{auction.title}</span>
      </div>

      {auction.viewerIsSeller && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/90 px-3 py-2 text-xs text-amber-950 space-y-2 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
          <p>
            You are viewing this listing as the <strong>seller</strong>. Bidders see the standard auction page without
            this notice.
          </p>
          {auction.status === 'LIVE' && (
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              {auction.hasBids ? (
                <p className="text-amber-900/90 dark:text-amber-200">
                  Title and description are locked after the first bid. You can still monitor bids below.
                </p>
              ) : (
                <Button asChild variant="outline" size="sm" className="border-amber-300 text-amber-950 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-100 dark:hover:bg-amber-950/50">
                  <Link to={`/auctions/${auctionId}/edit`}>
                    <Pencil className="h-3.5 w-3.5 mr-1.5" />
                    Edit listing
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-xl">{auction.title}</CardTitle>
              <CardDescription className="mt-2 max-w-prose">{auction.description}</CardDescription>
              {auction.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {auction.tags.map((tag) => (
                    <Link
                      key={tag}
                      to={`/search?q=${encodeURIComponent(tag)}`}
                      className="text-xs font-medium rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-stone-700 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-900 transition-colors dark:border-border dark:bg-muted/50 dark:text-foreground dark:hover:border-orange-600 dark:hover:bg-orange-950/40 dark:hover:text-orange-200"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              {auction.status === 'LIVE' ? (
                <Badge className="border-transparent bg-emerald-600 text-white hover:bg-emerald-600 dark:bg-emerald-600 dark:text-white">
                  Live
                </Badge>
              ) : (
                <Badge variant="secondary">Closed</Badge>
              )}
              {auction.outcome === 'SOLD' && (
                <Badge className="border-transparent bg-orange-500 text-white hover:bg-orange-500 dark:text-white">
                  Sold
                </Badge>
              )}
              {auction.outcome === 'UNSOLD' && (
                <Badge
                  variant="outline"
                  className="border-amber-400 text-amber-900 dark:border-orange-500/70 dark:bg-orange-950/50 dark:text-orange-200"
                >
                  Unsold
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {gallery.length > 0 ? (
            <div className="space-y-2">
              <div className="relative aspect-video rounded-lg overflow-hidden bg-stone-100 border border-stone-200 dark:bg-muted/40 dark:border-border">
                <img
                  src={gallery[activeImageIndex]}
                  alt=""
                  className="h-full w-full object-contain bg-stone-50 dark:bg-muted/30"
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
            <div className="aspect-video rounded-lg bg-stone-200 border border-stone-100 flex items-center justify-center text-stone-400 text-sm dark:bg-muted dark:border-border dark:text-muted-foreground">
              No photos for this listing
            </div>
          )}

          {auction.status === 'LIVE' && (
            <div className="grid sm:grid-cols-3 gap-4 text-sm">
              <div className="rounded-lg bg-stone-50 border border-stone-100 p-3 dark:bg-muted/40 dark:border-border">
                <p className="text-gray-500 dark:text-muted-foreground text-xs font-medium uppercase">Current bid</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-foreground tabular-nums">{formatMoney(auction.currentBid)}</p>
              </div>
              <div className="rounded-lg bg-stone-50 border border-stone-100 p-3 dark:bg-muted/40 dark:border-border">
                <p className="text-gray-500 dark:text-muted-foreground text-xs font-medium uppercase">Min. next bid</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 tabular-nums">{formatMoney(minNextBid)}</p>
              </div>
              <div className="rounded-lg bg-stone-50 border border-stone-100 p-3 dark:bg-muted/40 dark:border-border">
                <p className="text-gray-500 dark:text-muted-foreground text-xs font-medium uppercase">Time left</p>
                <p
                  className={cn(
                    'text-xl font-semibold tabular-nums text-gray-900 dark:text-foreground',
                    countdown.isFinalizing && 'text-amber-800 dark:text-amber-200'
                  )}
                >
                  {countdown.primary}
                </p>
                {countdown.hint && (
                  <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1 leading-snug">{countdown.hint}</p>
                )}
              </div>
            </div>
          )}

          {auction.status === 'LIVE' && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-foreground flex items-center gap-2">
                  <Gavel className="h-4 w-4 text-orange-500" />
                  Place a bid
                </h3>
                <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">
                  Enter at least the minimum next bid. You will see a confirmation or an error if the auction has moved
                  on.
                </p>
                <form
                  onSubmit={handlePlaceBid}
                  className="mt-4 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:gap-x-6 sm:gap-y-3"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                    <label
                      htmlFor="bid"
                      className="text-xs font-medium leading-snug text-gray-700 dark:text-gray-300 sm:max-w-[min(100%,14rem)] sm:shrink-0"
                    >
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
                      className="w-full min-w-[8rem] sm:max-w-xs sm:flex-1"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={bidSubmitting}
                    className="bg-orange-500 hover:bg-orange-400 w-full text-white font-semibold shrink-0 sm:w-auto"
                  >
                    {bidSubmitting ? 'Placing…' : 'Place bid'}
                  </Button>
                </form>

                {bidError && (
                  <div
                    role="alert"
                    className="mt-4 flex gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{bidError}</span>
                  </div>
                )}
                {bidSuccess && (
                  <div
                    role="status"
                    className="mt-4 flex gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>Bid placed successfully. The page will refresh with the latest amounts.</span>
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
        <h3 className="text-sm font-semibold text-gray-900 dark:text-foreground">Your listing</h3>
        {isUnsold && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
            This item did not receive any bids before the auction ended. You can{' '}
            <Link to="/sell" className="font-medium text-amber-900 underline hover:text-orange-700 dark:text-amber-200 dark:hover:text-orange-300">
              create a new listing
            </Link>{' '}
            anytime.
          </div>
        )}
        {isSold && !auction.isPaid && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-100">
            Your item sold for <strong>{formatMoney(auction.currentBid)}</strong>. The buyer has an unpaid order until they
            complete checkout.
          </div>
        )}
        {isSold && auction.isPaid && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-100">
            Your item sold for <strong>{formatMoney(auction.currentBid)}</strong>. Payment has been completed.
          </div>
        )}
      </div>
    )
  }

  if (isUnsold) {
    return (
      <p className="text-sm text-gray-600 dark:text-muted-foreground">
        This auction ended with no winning bid. Watch for similar listings on the marketplace.
      </p>
    )
  }

  if (isSold && auction.viewerIsWinner) {
    if (auction.isPaid) {
      return (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-4 flex gap-3 dark:border-emerald-900/50 dark:bg-emerald-950/40">
          <CheckCircle2 className="h-8 w-8 text-emerald-600 shrink-0 dark:text-emerald-400" />
          <div>
            <p className="font-semibold text-gray-900 dark:text-foreground">You won — payment complete</p>
            <p className="text-sm text-gray-600 dark:text-muted-foreground mt-1">
              Final price <strong>{formatMoney(auction.currentBid)}</strong>. Thank you for your purchase.
            </p>
          </div>
        </div>
      )
    }
    return (
      <div
        className={cn(
          'rounded-lg border px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4',
          'border-orange-200 bg-orange-50 dark:border-orange-900/50 dark:bg-orange-950/40'
        )}
      >
        <div className="flex gap-3">
          <Trophy className="h-8 w-8 text-orange-500 shrink-0 dark:text-orange-400" />
          <div>
            <p className="font-semibold text-gray-900 dark:text-foreground">You won this auction</p>
            <p className="text-sm text-gray-600 dark:text-muted-foreground mt-1">
              Final price <strong>{formatMoney(auction.currentBid)}</strong>. Complete checkout to pay for your item.
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
      <p className="text-sm text-gray-600 dark:text-muted-foreground">
        This auction closed at <strong>{formatMoney(auction.currentBid)}</strong>. Another bidder won this item.
      </p>
    )
  }

  return null
}
