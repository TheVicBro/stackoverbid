const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api'

const noStore: RequestInit = { cache: 'no-store' }

export type MyBidRow = {
  item_id: number
  title: string
  status: string
  current_price: number
  my_highest_bid: number
  end_time: string | null
}

export type MyPurchaseRow = {
  order_id: number
  item_id: number
  item_title: string
  amount_paid: number
  paid_at: string
}

export type MyBuyerDashboard = {
  active_bids: MyBidRow[]
  won_awaiting_payment: MyBidRow[]
  other_auctions_i_bid_on: MyBidRow[]
  purchases: MyPurchaseRow[]
}

export async function fetchMyBuyerDashboard(): Promise<
  { ok: true; data: MyBuyerDashboard } | { ok: false; status: number; message: string }
> {
  const res = await fetch(`${API_BASE}/auction/my/dashboard`, { credentials: 'include', ...noStore })
  if (res.status === 401) {
    return { ok: false, status: 401, message: 'Sign in to see your bids and purchases.' }
  }
  const data = (await res.json().catch(() => null)) as MyBuyerDashboard | null
  if (!res.ok || !data || typeof data !== 'object') {
    return { ok: false, status: res.status, message: 'Could not load your auction activity.' }
  }
  return {
    ok: true,
    data: {
      active_bids: Array.isArray(data.active_bids) ? data.active_bids : [],
      won_awaiting_payment: Array.isArray(data.won_awaiting_payment) ? data.won_awaiting_payment : [],
      other_auctions_i_bid_on: Array.isArray(data.other_auctions_i_bid_on) ? data.other_auctions_i_bid_on : [],
      purchases: Array.isArray(data.purchases) ? data.purchases : [],
    },
  }
}
