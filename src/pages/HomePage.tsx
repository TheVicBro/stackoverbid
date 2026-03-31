import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { parseUtcInstantMs } from '@/lib/utils'

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api'

interface AuctionItem {
  id: number
  title: string
  current_price: number
  end_time: string
  status: string
  image_urls?: string[]
}

function timeLeft(endsAt: string) {
  const end = parseUtcInstantMs(endsAt)
  if (!Number.isFinite(end)) return 'Ended'
  const now = Date.now()
  const s = Math.max(0, Math.floor((end - now) / 1000))
  if (s <= 0) return 'Ended'
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 48) return `${Math.floor(h / 24)}d ${h % 24}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m ${s % 60}s`
}

function isEndingSoon(endsAt: string) {
  return parseUtcInstantMs(endsAt) - Date.now() < 3 * 60 * 60 * 1000
}

function AuctionCard({ item }: { item: AuctionItem }) {
  const thumb = item.image_urls?.find((u) => typeof u === 'string' && u.length > 0)
  return (
    <Link to={`/auctions/${item.id}`} className="group">
      <Card className="overflow-hidden p-0 gap-0 hover:shadow-md hover:border-orange-200 transition-all duration-200 h-full">
        <div className="aspect-square bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center overflow-hidden">
          {thumb ? (
            <img src={thumb} alt="" className="h-full w-full object-cover" />
          ) : (
            <svg className="w-10 h-10 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
        </div>
        <CardContent className="p-3">
          <h3 className="text-sm font-medium text-gray-900 truncate group-hover:text-orange-600 transition-colors">
            {item.title}
          </h3>
          <p className="mt-1 text-base font-bold text-gray-900">${item.current_price.toFixed(2)}</p>
          <div className="mt-1.5">
            <Badge
              variant={isEndingSoon(item.end_time) ? 'destructive' : 'secondary'}
              className="text-xs"
            >
              {timeLeft(item.end_time)}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function AuctionGrid({ items, loading, emptyMsg }: { items: AuctionItem[], loading: boolean, emptyMsg: string }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="rounded-lg bg-stone-100 animate-pulse aspect-[3/4]" />
        ))}
      </div>
    )
  }
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-white py-10 text-center">
        <p className="text-sm text-gray-400">{emptyMsg}</p>
      </div>
    )
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {items.map(item => <AuctionCard key={item.id} item={item} />)}
    </div>
  )
}

export function HomePage() {
  const [endingSoon, setEndingSoon] = useState<AuctionItem[]>([])
  const [newest, setNewest] = useState<AuctionItem[]>([])
  const [mostActive, setMostActive] = useState<AuctionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [unauthenticated, setUnauthenticated] = useState(false)

  useEffect(() => {
    async function fetchSection(sort: string): Promise<AuctionItem[]> {
      const res = await fetch(`${API_BASE}/catalogue/items?sort=${sort}`, {
        credentials: 'include',
        cache: 'no-store',
      })
      if (res.status === 401) { setUnauthenticated(true); return [] }
      if (!res.ok) return []
      return res.json()
    }

    async function loadAll() {
      setLoading(true)
      const [es, nw, ma] = await Promise.all([
        fetchSection('ending_soon'),
        fetchSection('newest'),
        fetchSection('most_active'),
      ])
      setEndingSoon(es.slice(0, 5))
      setNewest(nw.slice(0, 5))
      setMostActive(ma.slice(0, 5))
      setLoading(false)
    }

    loadAll()
  }, [])

  return (
    <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 space-y-10">

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-gray-900 to-gray-800 p-8 md:p-10">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-orange-500/10 to-transparent" />
        <div className="relative max-w-lg">
          <p className="text-orange-400 text-sm font-semibold uppercase tracking-wide">Live Auctions</p>
          <h1 className="mt-2 text-2xl md:text-3xl font-bold text-white leading-snug">
            Bid on items you love — deals end soon
          </h1>
          <Button className="mt-5 bg-orange-500 text-white hover:bg-orange-400 font-semibold" asChild>
            <Link to="/sell">List an Item →</Link>
          </Button>
        </div>
      </div>

      {unauthenticated && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-6 text-center">
          <p className="text-orange-800 font-medium">Sign in to browse live auctions</p>
          <p className="text-orange-600 text-sm mt-1">Create a free account to start buying and selling.</p>
        </div>
      )}

      {/* Ending Soon */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">⏱ Ending Soon</h2>
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Hurry — time is running out</span>
        </div>
        <AuctionGrid items={endingSoon} loading={loading} emptyMsg="No auctions ending soon. Be the first to list one!" />
      </section>

      {/* Most Active */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">🔥 Most Active</h2>
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Highest bids right now</span>
        </div>
        <AuctionGrid items={mostActive} loading={loading} emptyMsg="No active bidding yet. Place the first bid!" />
      </section>

      {/* Recently Listed */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">🆕 Recently Listed</h2>
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Fresh to the marketplace</span>
        </div>
        <AuctionGrid items={newest} loading={loading} emptyMsg="Nothing listed yet. Sell your first item!" />
      </section>

      {/* Categories */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Browse Categories</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { name: 'Electronics', icon: '💻' },
            { name: 'Fashion', icon: '👗' },
            { name: 'Collectibles', icon: '🏆' },
            { name: 'Home & Garden', icon: '🏠' },
            { name: 'Sports', icon: '⚽' },
            { name: 'Art', icon: '🎨' },
          ].map(({ name, icon }) => (
            <a key={name} href="#">
              <Card className="flex-row items-center gap-3 p-4 py-4 hover:border-orange-300 hover:shadow-sm transition-all cursor-pointer">
                <span className="text-2xl">{icon}</span>
                <span className="text-sm font-medium text-gray-700">{name}</span>
              </Card>
            </a>
          ))}
        </div>
      </section>

    </main>
  )
}
