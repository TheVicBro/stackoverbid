import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { fetchCatalogueItems, normalizeSort, type CatalogueListItem, type CatalogueSort } from '@/api/catalogue'
import { AuctionBrowseGrid } from '@/components/auction/AuctionBrowseGrid'

const SORT_LABELS: Record<CatalogueSort, string> = {
  ending_soon: 'Ending soon',
  newest: 'Newest listed',
  most_active: 'Most active',
}

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const qRaw = searchParams.get('q') ?? ''
  const q = qRaw.trim()
  const sort = normalizeSort(searchParams.get('sort'))

  const [items, setItems] = useState<CatalogueListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [unauthorized, setUnauthorized] = useState(false)

  useEffect(() => {
    if (!q) {
      setItems([])
      setUnauthorized(false)
      return
    }
    let cancelled = false
    setLoading(true)
    void fetchCatalogueItems({ keyword: q, sort }).then((res) => {
      if (cancelled) return
      setLoading(false)
      if (!res.ok) {
        setItems([])
        if (res.unauthorized) setUnauthorized(true)
        return
      }
      setUnauthorized(false)
      setItems(res.items)
    })
    return () => {
      cancelled = true
    }
  }, [q, sort])

  const heading = useMemo(() => {
    if (!q) return 'Search'
    return `Results for “${q}”`
  }, [q])

  function setSort(next: CatalogueSort) {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('sort', next)
    if (q) nextParams.set('q', qRaw.trim())
    setSearchParams(nextParams, { replace: true })
  }

  return (
    <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Link to="/" className="text-orange-600 hover:text-orange-700 font-medium dark:text-orange-400 dark:hover:text-orange-300">
          ← Home
        </Link>
        <span className="text-gray-300 dark:text-muted-foreground">/</span>
        <span className="text-gray-600 dark:text-muted-foreground">Search</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-foreground">{heading}</h1>
          {!q ? (
            <p className="text-sm text-gray-600 dark:text-muted-foreground mt-1">
              Use the search bar above or pick a category. Matches listing titles and descriptions.
            </p>
          ) : (
            <p className="text-sm text-gray-600 dark:text-muted-foreground mt-1">
              Showing live listings whose title or description contains your search words.
            </p>
          )}
        </div>
        {q ? (
          <div className="flex items-center gap-2">
            <label htmlFor="search-sort" className="text-xs font-medium text-gray-600 dark:text-muted-foreground whitespace-nowrap">
              Sort by
            </label>
            <select
              id="search-sort"
              value={sort}
              onChange={(e) => setSort(normalizeSort(e.target.value))}
              className="h-9 rounded-md border border-input bg-white px-2 text-sm text-gray-900 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring dark:bg-card dark:text-foreground"
            >
              {(Object.keys(SORT_LABELS) as CatalogueSort[]).map((k) => (
                <option key={k} value={k}>
                  {SORT_LABELS[k]}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      {unauthorized && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-6 text-center dark:border-orange-900/50 dark:bg-orange-950/40">
          <p className="text-orange-800 font-medium dark:text-orange-200">Sign in to search and browse live auctions</p>
        </div>
      )}

      <AuctionBrowseGrid
        items={items}
        loading={loading && q.length > 0}
        emptyMsg={
          q
            ? 'No live auctions match that search. Try different words or browse the homepage.'
            : 'Enter a search or choose a category from the bar below the header.'
        }
      />
    </main>
  )
}
