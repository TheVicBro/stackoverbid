import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Gavel, Loader2, Package, Trophy } from 'lucide-react'
import {
  fetchMyBuyerDashboard,
  type MyBidRow,
  type MyBuyerDashboard,
  type MyPurchaseRow,
} from '@/api/myAuctions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

function formatMoney(n: number) {
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD' })
}

function BidRowList({ rows, empty }: { rows: MyBidRow[]; empty: string }) {
  if (rows.length === 0) {
    return <p className="text-sm text-gray-500">{empty}</p>
  }
  return (
    <ul className="divide-y divide-stone-100 border border-stone-200 rounded-lg overflow-hidden bg-white">
      {rows.map((r) => (
        <li key={r.item_id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-3 py-2.5 hover:bg-stone-50/80">
          <div className="min-w-0">
            <Link
              to={`/auctions/${r.item_id}`}
              className="font-medium text-gray-900 hover:text-orange-600 truncate block"
            >
              {r.title}
            </Link>
            <p className="text-xs text-gray-500 mt-0.5">
              Your high bid {formatMoney(r.my_highest_bid)} · Listing {formatMoney(r.current_price)}
              {r.status === 'active' && r.end_time ? (
                <span className="text-gray-400"> · ends {new Date(r.end_time).toLocaleString()}</span>
              ) : null}
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="shrink-0 border-orange-200 text-orange-800 hover:bg-orange-50">
            <Link to={`/auctions/${r.item_id}`}>View auction</Link>
          </Button>
        </li>
      ))}
    </ul>
  )
}

function PurchaseList({ rows }: { rows: MyPurchaseRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-gray-500">No completed purchases yet.</p>
  }
  return (
    <ul className="divide-y divide-stone-100 border border-stone-200 rounded-lg overflow-hidden bg-white">
      {rows.map((p) => (
        <li key={p.order_id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-3 py-2.5">
          <div className="min-w-0">
            <Link to={`/auctions/${p.item_id}`} className="font-medium text-gray-900 hover:text-orange-600 truncate block">
              {p.item_title}
            </Link>
            <p className="text-xs text-gray-500 mt-0.5">
              {formatMoney(p.amount_paid)} · {new Date(p.paid_at).toLocaleString()} · Order #{p.order_id}
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link to={`/auctions/${p.item_id}`}>View item</Link>
          </Button>
        </li>
      ))}
    </ul>
  )
}

export function MyAuctionsPage() {
  const [phase, setPhase] = useState<'loading' | 'ready' | 'unauth' | 'error'>('loading')
  const [message, setMessage] = useState<string | null>(null)
  const [data, setData] = useState<MyBuyerDashboard | null>(null)

  useEffect(() => {
    let cancelled = false
    void fetchMyBuyerDashboard().then((res) => {
      if (cancelled) return
      if (!res.ok) {
        if (res.status === 401) {
          setPhase('unauth')
          return
        }
        setPhase('error')
        setMessage(res.message)
        return
      }
      setData(res.data)
      setPhase('ready')
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (phase === 'loading') {
    return (
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10 flex items-center gap-2 text-gray-600 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading your auctions…
      </main>
    )
  }

  if (phase === 'unauth') {
    return (
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10 space-y-4">
        <p className="text-gray-900 text-sm">Sign in to see auctions you have bid on and items you have purchased.</p>
        <Button asChild className="bg-orange-500 hover:bg-orange-400 text-white">
          <Link to="/">Back to home</Link>
        </Button>
      </main>
    )
  }

  if (phase === 'error' || !data) {
    return (
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10 space-y-4">
        <p className="text-gray-900 text-sm">{message ?? 'Something went wrong.'}</p>
        <Button asChild variant="outline">
          <Link to="/">Back home</Link>
        </Button>
      </main>
    )
  }

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10 space-y-8">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Link to="/" className="text-orange-600 hover:text-orange-700 font-medium">
          ← Home
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-600">My bids & purchases</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">My bids & purchases</h1>
        <p className="text-sm text-gray-600 mt-1">
          Live auctions you are in, wins that need payment (pay from the auction page), other auctions you bid on, and
          completed orders.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-emerald-100 p-2">
              <Gavel className="h-5 w-5 text-emerald-700" />
            </div>
            <div>
              <CardTitle className="text-base">Live — you are bidding</CardTitle>
              <CardDescription>Active listings where you have placed a bid.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <BidRowList rows={data.active_bids} empty="You have no active bids right now." />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-orange-100 p-2">
              <Trophy className="h-5 w-5 text-orange-700" />
            </div>
            <div>
              <CardTitle className="text-base">You won — complete payment</CardTitle>
              <CardDescription>Open the auction to review the item, then use Pay now when you are ready.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <BidRowList rows={data.won_awaiting_payment} empty="No wins waiting for payment." />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-stone-100 p-2">
              <Gavel className="h-5 w-5 text-stone-600" />
            </div>
            <div>
              <CardTitle className="text-base">Other auctions you bid on</CardTitle>
              <CardDescription>Ended listings where you did not win (or the item did not sell to you).</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <BidRowList rows={data.other_auctions_i_bid_on} empty="No other past bids to show." />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <Package className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <CardTitle className="text-base">Purchased</CardTitle>
              <CardDescription>Orders you have already paid for.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <PurchaseList rows={data.purchases} />
        </CardContent>
      </Card>

      <p className="text-sm text-gray-600">
        Selling?{' '}
        <Link to="/my/listings" className="font-medium text-orange-600 hover:text-orange-700">
          View all your listings
        </Link>
        .
      </p>
    </main>
  )
}
