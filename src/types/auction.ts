export type AuctionStatus = 'LIVE' | 'CLOSED'

export type AuctionOutcome = 'UNSOLD' | 'SOLD'

export interface AuctionDetail {
  id: string
  title: string
  description: string
  /** Public image URLs from listing (e.g. Cloudinary) */
  imageUrls: string[]
  status: AuctionStatus
  /** Current highest bid in major currency units (e.g. USD) */
  currentBid: number
  /** Starting price from listing — used with currentBid to infer bids when API omits count. */
  startingPrice: number
  minIncrement: number
  bidCount: number
  /** True when at least one bid exists (from catalogue highest_bidder_id). */
  hasBids: boolean
  /** ISO timestamp when the auction ends or ended */
  endsAt: string | null
  outcome?: AuctionOutcome
  /** Set when SOLD — used for winner / unpaid order flows */
  unpaidOrderId?: string
  /** True when the signed-in user owns this listing (seller tools and messaging). */
  viewerIsSeller: boolean
  /** True when the signed-in user is the high bidder. */
  viewerIsWinner: boolean
  /** True after checkout has completed for this item. */
  isPaid?: boolean
}

export type PlaceBidErrorCode = 'AUCTION_CLOSED' | 'BID_TOO_LOW'

export interface PlaceBidResult {
  ok: boolean
  error?: PlaceBidErrorCode
  message?: string
}

export interface UnpaidOrder {
  id: string
  auctionId: string
  title: string
  amountDue: number
  currency: string
  status: 'UNPAID' | 'PAID'
  createdAt: string
}

export type NotificationKind = 'WINNER' | 'ITEM_SOLD' | 'OUTBID' | 'AUCTION_CLOSED'

export interface AppNotification {
  id: string
  kind: NotificationKind
  title: string
  body: string
  createdAt: string
  read: boolean
  /** Catalogue item id — open the auction detail page (checkout is linked from there when you won). */
  auctionItemId?: string
}
