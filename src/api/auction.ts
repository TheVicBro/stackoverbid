import type {
  AppNotification,
  AuctionDetail,
  PlaceBidResult,
  UnpaidOrder,
} from '@/types/auction'

/**
 * Replace mock implementations with fetch() to your backend once the Vite proxy is set up.
 * Example: fetch('/api/auctions/${id}', { credentials: 'include' })
 */

/** In-memory state for the interactive live demo auction */
let liveAuctionState = {
  currentBid: 100,
  minIncrement: 1,
  bidCount: 7,
  endsAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
}

const MOCK_CURRENCY = 'USD'

function baseDetail(
  id: string,
  overrides: Partial<AuctionDetail> & Pick<AuctionDetail, 'title' | 'status'>
): AuctionDetail {
  return {
    id,
    description:
      'This is placeholder copy. Replace with catalogue data from your API when integrated.',
    imageUrls: [],
    currentBid: 0,
    minIncrement: 1,
    bidCount: 0,
    endsAt: null,
    viewerIsSeller: false,
    viewerIsWinner: false,
    ...overrides,
  }
}

export function getAuction(
  auctionId: string,
  options: { viewerIsSeller?: boolean } = {}
): Promise<AuctionDetail> {
  const viewerIsSeller = options.viewerIsSeller ?? false

  return new Promise((resolve) => {
    setTimeout(() => {
      if (auctionId === 'sample-live') {
        resolve(
          baseDetail('sample-live', {
            title: 'Vintage Camera — Live bidding (mock)',
            status: 'LIVE',
            currentBid: liveAuctionState.currentBid,
            minIncrement: liveAuctionState.minIncrement,
            bidCount: liveAuctionState.bidCount,
            endsAt: liveAuctionState.endsAt,
            viewerIsSeller: false,
            viewerIsWinner: false,
          })
        )
        return
      }

      if (auctionId === 'sample-unsold') {
        resolve(
          baseDetail('sample-unsold', {
            title: 'Collectible Card — Closed, no bids (mock)',
            status: 'CLOSED',
            currentBid: 0,
            minIncrement: 1,
            bidCount: 0,
            endsAt: new Date(Date.now() - 86400000).toISOString(),
            outcome: 'UNSOLD',
            viewerIsSeller,
            viewerIsWinner: false,
          })
        )
        return
      }

      if (auctionId === 'sample-sold') {
        resolve(
          baseDetail('sample-sold', {
            title: 'Rare Watch — Sold, unpaid order (mock)',
            status: 'CLOSED',
            currentBid: 450,
            minIncrement: 1,
            bidCount: 14,
            endsAt: new Date(Date.now() - 3600000).toISOString(),
            outcome: 'SOLD',
            unpaidOrderId: 'ord-sample-1',
            viewerIsSeller,
            viewerIsWinner: !viewerIsSeller,
          })
        )
        return
      }

      resolve(
        baseDetail(auctionId, {
          title: 'Unknown auction',
          status: 'CLOSED',
          currentBid: 0,
          bidCount: 0,
          endsAt: new Date().toISOString(),
          outcome: 'UNSOLD',
          viewerIsSeller: false,
          viewerIsWinner: false,
        })
      )
    }, 200)
  })
}

export function placeBid(auctionId: string, amount: number): Promise<PlaceBidResult> {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (!Number.isFinite(amount) || amount <= 0) {
        resolve({ ok: false, error: 'BID_TOO_LOW', message: 'Enter a valid positive bid amount.' })
        return
      }

      if (auctionId !== 'sample-live') {
        resolve({ ok: false, error: 'AUCTION_CLOSED', message: 'This auction is closed.' })
        return
      }

      const minNext = liveAuctionState.currentBid + liveAuctionState.minIncrement
      if (amount < minNext) {
        resolve({
          ok: false,
          error: 'BID_TOO_LOW',
          message: `Your bid must be at least $${minNext.toFixed(2)}.`,
        })
        return
      }

      liveAuctionState = {
        ...liveAuctionState,
        currentBid: amount,
        bidCount: liveAuctionState.bidCount + 1,
      }

      resolve({ ok: true })
    }, 350)
  })
}

export function getUnpaidOrder(orderId: string): Promise<UnpaidOrder | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (orderId !== 'ord-sample-1') {
        resolve(null)
        return
      }
      resolve({
        id: 'ord-sample-1',
        auctionId: 'sample-sold',
        title: 'Rare Watch — Sold, unpaid order (mock)',
        amountDue: 450,
        currency: MOCK_CURRENCY,
        status: 'UNPAID',
        createdAt: new Date().toISOString(),
      })
    }, 200)
  })
}

/** Mock notifications matching UC3 / UC4 (outbid, winner, sold, auction closed) */
export function listNotifications(): Promise<AppNotification[]> {
  return Promise.resolve([
    {
      id: 'n1',
      kind: 'OUTBID',
      title: 'You were outbid',
      body: 'Another bidder placed a higher bid on Vintage Camera.',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      read: false,
    },
    {
      id: 'n2',
      kind: 'WINNER',
      title: 'You won',
      body: 'You won Rare Watch. Complete payment to finalize your purchase.',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      read: true,
    },
    {
      id: 'n3',
      kind: 'AUCTION_CLOSED',
      title: 'Auction closed',
      body: 'The auction for Collectible Card has ended.',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      read: true,
    },
  ])
}
