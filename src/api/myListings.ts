const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api'

/** Row shape from GET /catalogue/items?seller_id= (full Item schema). */
export interface MyListingRow {
  id: number
  title: string
  description: string
  starting_price: number
  current_price: number
  end_time: string
  status: string
  seller_id: number
  highest_bidder_id: number | null
  image_urls?: string[]
}

type FetchMyListingsResult =
  | { ok: true; items: MyListingRow[] }
  | { ok: false; status: number; message: string }

export async function fetchMyListings(sellerId: number): Promise<FetchMyListingsResult> {
  const res = await fetch(`${API_BASE}/catalogue/items?seller_id=${sellerId}`, {
    credentials: 'include',
    cache: 'no-store',
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    let message = 'Could not load your listings.'
    try {
      const j = JSON.parse(text) as { detail?: unknown }
      if (typeof j.detail === 'string') message = j.detail
    } catch {
      /* ignore */
    }
    return { ok: false, status: res.status, message }
  }
  const raw = (await res.json()) as unknown
  if (!Array.isArray(raw)) {
    return { ok: false, status: 500, message: 'Unexpected response from server.' }
  }
  const items = raw.filter((r): r is MyListingRow => r != null && typeof r === 'object' && typeof (r as MyListingRow).id === 'number')
  return { ok: true, items }
}
