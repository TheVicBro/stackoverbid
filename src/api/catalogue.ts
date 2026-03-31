const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api'

const noStore: RequestInit = { cache: 'no-store' }

export type CatalogueListItem = {
  id: number
  title: string
  current_price: number
  end_time: string
  status: string
  image_urls?: string[]
}

export type CatalogueSort = 'ending_soon' | 'newest' | 'most_active'

const SORTS: CatalogueSort[] = ['ending_soon', 'newest', 'most_active']

export function normalizeSort(s: string | null | undefined): CatalogueSort {
  if (s && SORTS.includes(s as CatalogueSort)) return s as CatalogueSort
  return 'ending_soon'
}

export async function fetchCatalogueItems(options: {
  sort?: CatalogueSort
  keyword?: string
}): Promise<
  { ok: true; items: CatalogueListItem[] } | { ok: false; unauthorized?: boolean }
> {
  const params = new URLSearchParams()
  params.set('sort', normalizeSort(options.sort))
  const kw = options.keyword?.trim()
  if (kw) params.set('keyword', kw)

  const res = await fetch(`${API_BASE}/catalogue/items?${params.toString()}`, {
    credentials: 'include',
    ...noStore,
  })
  if (res.status === 401) return { ok: false, unauthorized: true }
  if (!res.ok) return { ok: false }
  const raw = (await res.json()) as unknown
  const items = Array.isArray(raw) ? (raw as CatalogueListItem[]) : []
  return { ok: true, items }
}
