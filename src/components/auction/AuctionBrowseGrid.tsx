import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { CatalogueListItem } from '@/api/catalogue'
import { formatAppCurrency } from '@/lib/currency'
import { parseUtcInstantMs } from '@/lib/utils'

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

function AuctionCard({ item }: { item: CatalogueListItem }) {
  const thumb = item.image_urls?.find((u) => typeof u === 'string' && u.length > 0)
  return (
    <Link to={`/auctions/${item.id}`} className="group">
      <Card className="overflow-hidden p-0 gap-0 hover:shadow-md hover:border-orange-200 transition-all duration-200 h-full dark:hover:border-orange-700/50">
        <div className="aspect-square bg-gradient-to-br from-stone-100 to-stone-200 dark:from-muted/40 dark:to-muted/60 flex items-center justify-center overflow-hidden">
          {thumb ? (
            <img src={thumb} alt="" className="h-full w-full object-cover" />
          ) : (
            <svg className="w-10 h-10 text-stone-300 dark:text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          )}
        </div>
        <CardContent className="p-3">
          <h3 className="text-sm font-medium text-gray-900 dark:text-foreground truncate group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
            {item.title}
          </h3>
          <p className="mt-1 text-base font-bold text-gray-900 dark:text-foreground">{formatAppCurrency(item.current_price)}</p>
          <div className="mt-1.5">
            <Badge variant={isEndingSoon(item.end_time) ? 'destructive' : 'secondary'} className="text-xs">
              {timeLeft(item.end_time)}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export function AuctionBrowseGrid({
  items,
  loading,
  emptyMsg,
}: {
  items: CatalogueListItem[]
  loading: boolean
  emptyMsg: string
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="rounded-lg bg-stone-100 dark:bg-muted animate-pulse aspect-[3/4]" />
        ))}
      </div>
    )
  }
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-white dark:border-border dark:bg-card py-10 text-center">
        <p className="text-sm text-gray-400 dark:text-muted-foreground">{emptyMsg}</p>
      </div>
    )
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {items.map((item) => (
        <AuctionCard key={item.id} item={item} />
      ))}
    </div>
  )
}
