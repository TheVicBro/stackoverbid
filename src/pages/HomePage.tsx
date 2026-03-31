import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { fetchCatalogueItems, type CatalogueListItem } from '@/api/catalogue'
import { AuctionBrowseGrid } from '@/components/auction/AuctionBrowseGrid'

export function HomePage() {
  const [endingSoon, setEndingSoon] = useState<CatalogueListItem[]>([])
  const [newest, setNewest] = useState<CatalogueListItem[]>([])
  const [mostActive, setMostActive] = useState<CatalogueListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [unauthenticated, setUnauthenticated] = useState(false)

  useEffect(() => {
    async function fetchSection(sort: 'ending_soon' | 'newest' | 'most_active'): Promise<CatalogueListItem[]> {
      const res = await fetchCatalogueItems({ sort })
      if (!res.ok) {
        if (res.unauthorized) setUnauthenticated(true)
        return []
      }
      return res.items
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
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-6 text-center dark:border-orange-900/50 dark:bg-orange-950/40">
          <p className="text-orange-800 font-medium dark:text-orange-200">Sign in to browse live auctions</p>
          <p className="text-orange-600 text-sm mt-1 dark:text-orange-300">Create a free account to start buying and selling.</p>
        </div>
      )}

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-foreground">⏱ Ending Soon</h2>
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wide dark:text-muted-foreground">Hurry — time is running out</span>
        </div>
        <AuctionBrowseGrid
          items={endingSoon}
          loading={loading}
          emptyMsg="No auctions ending soon. Be the first to list one!"
        />
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-foreground">🔥 Most Active</h2>
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wide dark:text-muted-foreground">Highest bids right now</span>
        </div>
        <AuctionBrowseGrid
          items={mostActive}
          loading={loading}
          emptyMsg="No active bidding yet. Place the first bid!"
        />
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-foreground">🆕 Recently Listed</h2>
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wide dark:text-muted-foreground">Fresh to the marketplace</span>
        </div>
        <AuctionBrowseGrid
          items={newest}
          loading={loading}
          emptyMsg="Nothing listed yet. Sell your first item!"
        />
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900 dark:text-foreground mb-4">Browse Categories</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { name: 'Electronics', icon: '💻' },
            { name: 'Fashion', icon: '👗' },
            { name: 'Collectibles', icon: '🏆' },
            { name: 'Home & Garden', icon: '🏠' },
            { name: 'Sports', icon: '⚽' },
            { name: 'Art', icon: '🎨' },
          ].map(({ name, icon }) => (
            <Link key={name} to={`/search?q=${encodeURIComponent(name)}`}>
              <Card className="flex-row items-center gap-3 p-4 py-4 hover:border-orange-300 hover:shadow-sm transition-all cursor-pointer dark:hover:border-orange-600/60">
                <span className="text-2xl">{icon}</span>
                <span className="text-sm font-medium text-gray-700 dark:text-foreground">{name}</span>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
