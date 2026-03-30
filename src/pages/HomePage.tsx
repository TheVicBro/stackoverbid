import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const demoAuctions = [
  { id: 'sample-live', label: 'UC3 — Live bidding', desc: 'Place bids, see success / errors' },
  { id: 'sample-unsold', label: 'UC4 — Closed, no bids', desc: 'Unsold state (seller / public)' },
  { id: 'sample-sold', label: 'UC4 — Sold + unpaid order', desc: 'Winner checkout + seller sold' },
] as const

export function HomePage() {
  return (
    <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 space-y-8">
      <section className="rounded-xl border border-orange-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Demo routes (bidding, auction end, payment)</h2>
        <p className="text-sm text-gray-600 mt-1">
          Mock data lives in{' '}
          <code className="text-xs bg-stone-100 px-1 rounded">src/api/auction.ts</code> and{' '}
          <code className="text-xs bg-stone-100 px-1 rounded">src/api/payment.ts</code>.
        </p>
        <ul className="mt-3 flex flex-col sm:flex-row flex-wrap gap-2">
          {demoAuctions.map((d) => (
            <li key={d.id}>
              <Link
                to={`/auctions/${d.id}`}
                className="flex flex-col rounded-lg border border-gray-200 bg-stone-50 px-3 py-2 text-left hover:border-orange-300 hover:bg-orange-50/50 transition-colors"
              >
                <span className="text-sm font-semibold text-gray-900">{d.label}</span>
                <span className="text-xs text-gray-500">{d.desc}</span>
              </Link>
            </li>
          ))}
          <li>
            <Link
              to="/orders/ord-sample-1/unpaid"
              className="flex flex-col rounded-lg border border-gray-200 bg-stone-50 px-3 py-2 text-left hover:border-orange-300 hover:bg-orange-50/50 transition-colors"
            >
              <span className="text-sm font-semibold text-gray-900">UC4 — Unpaid order page</span>
              <span className="text-xs text-gray-500">Order summary → Pay now goes to UC5</span>
            </Link>
          </li>
          <li>
            <Link
              to="/checkout/sample-sold"
              className="flex flex-col rounded-lg border border-gray-200 bg-stone-50 px-3 py-2 text-left hover:border-orange-300 hover:bg-orange-50/50 transition-colors"
            >
              <span className="text-sm font-semibold text-gray-900">UC5 — Process payment</span>
              <span className="text-xs text-gray-500">CheckoutDTO + pay + success / declined</span>
            </Link>
          </li>
        </ul>
      </section>

      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-gray-900 to-gray-800 p-8 md:p-10">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-orange-500/10 to-transparent" />
        <div className="relative max-w-lg">
          <p className="text-orange-400 text-sm font-semibold uppercase tracking-wide">Live Auctions</p>
          <h2 className="mt-2 text-2xl md:text-3xl font-bold text-white leading-snug">
            Bid on items you love — deals end soon
          </h2>
          <Button className="mt-5 bg-orange-500 text-white hover:bg-orange-400 font-semibold" asChild>
            <Link to="/auctions/sample-live">Try live bidding (demo)</Link>
          </Button>
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Ending Soon</h2>
          <span className="text-sm text-gray-500">Catalogue from teammates</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => {
            const card = (
              <Card className="overflow-hidden p-0 gap-0 hover:shadow-md hover:border-orange-200 transition-all duration-200">
                <div className="aspect-square bg-stone-100" />
                <CardContent className="p-3">
                  <h3 className="text-sm font-medium text-gray-900 truncate group-hover:text-orange-600 transition-colors">
                    {i === 1 ? 'Demo: open bid flow' : 'Auction Item'}
                  </h3>
                  <p className="mt-1 text-base font-bold text-gray-900">{i === 1 ? '$100.00' : '$0.00'}</p>
                  <div className="mt-1.5 flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs text-gray-400">
                      {i === 1 ? '7 bids' : '0 bids'}
                    </Badge>
                    <Badge variant="destructive" className="text-xs">
                      2h 14m
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )
            return i === 1 ? (
              <Link key={i} to="/auctions/sample-live" className="group">
                {card}
              </Link>
            ) : (
              <a key={i} href="#" className="group">
                {card}
              </a>
            )
          })}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Trending Auctions</h2>
          <a href="#" className="text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors">
            See all &rarr;
          </a>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <a key={i} href="#" className="group">
              <Card className="overflow-hidden p-0 gap-0 hover:shadow-md hover:border-orange-200 transition-all duration-200">
                <div className="aspect-square bg-stone-100" />
                <CardContent className="p-3">
                  <h3 className="text-sm font-medium text-gray-900 truncate group-hover:text-orange-600 transition-colors">
                    Auction Item
                  </h3>
                  <p className="mt-1 text-base font-bold text-gray-900">$0.00</p>
                  <div className="mt-1.5 flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs text-gray-400">
                      0 bids
                    </Badge>
                    <Badge variant="outline" className="text-xs text-orange-500 border-orange-200">
                      1d 6h
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      </section>

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
              <Card className="flex-row items-center gap-3 p-4 py-4 hover:border-orange-300 hover:shadow-sm transition-all">
                <span className="text-2xl">{icon}</span>
                <span className="text-sm font-medium text-gray-700">{name}</span>
              </Card>
            </a>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Recently Listed</h2>
          <a href="#" className="text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors">
            See all &rarr;
          </a>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <a key={i} href="#" className="group">
              <Card className="overflow-hidden p-0 gap-0 hover:shadow-md hover:border-orange-200 transition-all duration-200">
                <div className="aspect-square bg-stone-100" />
                <CardContent className="p-3">
                  <h3 className="text-sm font-medium text-gray-900 truncate group-hover:text-orange-600 transition-colors">
                    Auction Item
                  </h3>
                  <p className="mt-1 text-base font-bold text-gray-900">$0.00</p>
                  <div className="mt-1.5 flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs text-gray-400">
                      0 bids
                    </Badge>
                    <Badge variant="secondary" className="text-xs text-gray-400">
                      3d 12h
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      </section>
    </main>
  )
}
