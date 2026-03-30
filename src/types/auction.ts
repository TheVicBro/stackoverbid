export type AuctionStatus = 'LIVE' | 'CLOSED'

export type AuctionOutcome = 'UNSOLD' | 'SOLD'

export interface AuctionDetail {
  id: string
  title: string
  description: string
  status: AuctionStatus
  /** Current highest bid in major currency units (e.g. USD) */
  currentBid: number
  minIncrement: number
  bidCount: number
  /** ISO timestamp when the auction ends or ended */
  endsAt: string | null
  outcome?: AuctionOutcome
  /** Set when SOLD — used for winner / unpaid order flows */
  unpaidOrderId?: string
  /** Mock: true when the signed-in user is the seller (UC4 seller view) */
  viewerIsSeller: boolean
  /** Mock: true when the signed-in user won (UC4 winner → unpaid order) */
  viewerIsWinner: boolean
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
}
