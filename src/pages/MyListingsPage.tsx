import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Pencil, Store } from 'lucide-react'
import { fetchMyListings, type MyListingRow } from '@/api/myListings'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { parseUtcInstantMs } from '@/lib/utils'

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api'

function formatMoney(n: number) {
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD' })
}

function isListingLive(item: MyListingRow): boolean {
  if (item.status !== 'active') return false
  const endMs = parseUtcInstantMs(item.end_time)
  return Number.isFinite(endMs) && endMs > Date.now()
}

function statusLabel(item: MyListingRow): string {
  if (isListingLive(item)) return 'Live'
  if (item.status === 'paid') return 'Paid'
  if (item.status === 'closed') return 'Closed'
  if (item.status === 'active') return 'Ended'
  return item.status
}

function ListingRows({ items, empty }: { items: MyListingRow[]; empty: string }) {
  if (items.length === 0) {
    return <p className="text-sm text-gray-500">{empty}</p>
  }
  return (
    <ul className="divide-y divide-stone-100 border border-stone-200 rounded-lg overflow-hidden bg-white">
      {items.map((item) => {
        const live = isListingLive(item)
        const canEdit = live && item.highest_bidder_id == null
        return (
          <li
            key={item.id}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-3 py-3 hover:bg-stone-50/80"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to={`/auctions/${item.id}?as=seller`}
                  className="font-medium text-gray-900 hover:text-orange-600 truncate"
                >
                  {item.title}
                </Link>
                <Badge
                  variant="secondary"
                  className={
                    live
                      ? 'bg-emerald-100 text-emerald-900 hover:bg-emerald-100 shrink-0'
                      : 'shrink-0'
                  }
                >
                  {statusLabel(item)}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Current {formatMoney(item.current_price)}
                {item.starting_price !== item.current_price ? (
                  <span className="text-gray-400"> · started {formatMoney(item.starting_price)}</span>
                ) : null}
                {live && item.end_time ? (
                  <span className="text-gray-400"> · ends {new Date(parseUtcInstantMs(item.end_time)).toLocaleString()}</span>
                ) : item.end_time ? (
                  <span className="text-gray-400"> · ended {new Date(parseUtcInstantMs(item.end_time)).toLocaleString()}</span>
                ) : null}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <Button asChild variant="outline" size="sm" className="border-orange-200 text-orange-800 hover:bg-orange-50">
                <Link to={`/auctions/${item.id}?as=seller`}>View</Link>
              </Button>
              {canEdit ? (
                <Button asChild variant="outline" size="sm">
                  <Link to={`/auctions/${item.id}/edit`}>
                    <Pencil className="h-3.5 w-3.5 mr-1" />
                    Edit
                  </Link>
                </Button>
              ) : null}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export function MyListingsPage() {
  const [phase, setPhase] = useState<'loading' | 'ready' | 'unauth' | 'error'>('loading')
  const [message, setMessage] = useState<string | null>(null)
  const [items, setItems] = useState<MyListingRow[]>([])

  useEffect(() => {
    let cancelled = false
    async function run() {
      const meRes = await fetch(`${API_BASE}/auth/me`, { credentials: 'include', cache: 'no-store' })
      if (cancelled) return
      if (!meRes.ok) {
        setPhase('unauth')
        return
      }
      const me = (await meRes.json()) as { id: number }
      const res = await fetchMyListings(me.id)
      if (cancelled) return
      if (!res.ok) {
        setPhase('error')
        setMessage(res.message)
        return
      }
      setItems(res.items)
      setPhase('ready')
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [])

  const { live, past } = useMemo(() => {
    const liveList: MyListingRow[] = []
    const pastList: MyListingRow[] = []
    for (const item of items) {
      if (isListingLive(item)) liveList.push(item)
      else pastList.push(item)
    }
    const byEndAsc = (a: MyListingRow, b: MyListingRow) =>
      parseUtcInstantMs(a.end_time) - parseUtcInstantMs(b.end_time)
    const byEndDesc = (a: MyListingRow, b: MyListingRow) =>
      parseUtcInstantMs(b.end_time) - parseUtcInstantMs(a.end_time)
    liveList.sort(byEndAsc)
    pastList.sort(byEndDesc)
    return { live: liveList, past: pastList }
  }, [items])

  if (phase === 'loading') {
    return (
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10 flex items-center gap-2 text-gray-600 text-sm">
        <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
        Loading your listings…
      </main>
    )
  }

  if (phase === 'unauth') {
    return (
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10 space-y-4">
        <p className="text-gray-900 text-sm">Sign in to see every auction you have listed.</p>
        <Button asChild className="bg-orange-500 hover:bg-orange-400 text-white">
          <Link to="/">Back to home</Link>
        </Button>
      </main>
    )
  }

  if (phase === 'error') {
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
        <span className="text-gray-600">My listings</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">My listings</h1>
        <p className="text-sm text-gray-600 mt-1">
          Every item you have put up for auction — live now and closed. Open a listing as seller to manage it; edit title
          and description only while the auction is live and has no bids yet.
        </p>
        {items.length >= 50 ? (
          <p className="text-xs text-amber-800 mt-2 rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 inline-block">
            Showing the 50 most recent listings from the server. Contact support if you need older history.
          </p>
        ) : null}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-emerald-100 p-2">
              <Store className="h-5 w-5 text-emerald-700" />
            </div>
            <div>
              <CardTitle className="text-base">Live now</CardTitle>
              <CardDescription>Auctions buyers can still bid on.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ListingRows items={live} empty="You have no live listings. Create one from Sell." />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-stone-100 p-2">
              <Store className="h-5 w-5 text-stone-600" />
            </div>
            <div>
              <CardTitle className="text-base">Past listings</CardTitle>
              <CardDescription>Ended, closed, or paid — for your records.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ListingRows items={past} empty="No past listings yet." />
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button asChild className="bg-orange-500 hover:bg-orange-400 text-white">
          <Link to="/sell">List a new item</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/my/auctions">My bids & purchases</Link>
        </Button>
      </div>
    </main>
  )
}
