import type {
  CardDetailsInput,
  CheckoutDTO,
  PaymentErrorCode,
  PaymentReceiptDTO,
} from '@/types/payment'
import { normalizeCardExpiryForApi, parseUtcInstantMs } from '@/lib/utils'

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api'

const noStore: RequestInit = { cache: 'no-store' }

function fastApiDetailMessage(data: unknown): string {
  if (!data || typeof data !== 'object') return ''
  const d = (data as { detail?: unknown }).detail
  if (typeof d === 'string') return d
  if (Array.isArray(d) && d[0] && typeof d[0] === 'object' && 'msg' in d[0]) {
    return String((d[0] as { msg: string }).msg)
  }
  return ''
}

function parseItemId(auctionId: string): number | null {
  const itemId = parseInt(auctionId, 10)
  if (!Number.isFinite(itemId) || String(itemId) !== auctionId.trim()) return null
  return itemId
}

function mapReceipt(raw: Record<string, unknown>): PaymentReceiptDTO {
  const paidAt = raw.paid_at
  return {
    orderId: Number(raw.order_id),
    itemId: Number(raw.item_id),
    itemTitle: String(raw.item_title ?? ''),
    amountPaid: Number(raw.amount_paid),
    shippingAddress: String(raw.shipping_address ?? ''),
    shippingTimeDays: Number(raw.shipping_time_days),
    expeditedShipping: Boolean(raw.expedited_shipping),
    paidAt: typeof paidAt === 'string' ? paidAt : new Date().toISOString(),
    message: String(raw.message ?? ''),
  }
}

export async function getCheckoutPage(
  auctionId: string
): Promise<
  { ok: true; checkout: CheckoutDTO } | { ok: false; code: PaymentErrorCode; message?: string }
> {
  const itemId = parseItemId(auctionId)
  if (itemId == null) {
    return { ok: false, code: 'CHECKOUT_UNAVAILABLE', message: 'Invalid auction.' }
  }

  const [itemRes, meRes] = await Promise.all([
    fetch(`${API_BASE}/catalogue/items/${itemId}`, { credentials: 'include', ...noStore }),
    fetch(`${API_BASE}/auth/me`, { credentials: 'include', ...noStore }),
  ])

  if (meRes.status === 401) {
    return { ok: false, code: 'CHECKOUT_UNAVAILABLE', message: 'Sign in to complete checkout.' }
  }
  if (!meRes.ok) {
    return { ok: false, code: 'CHECKOUT_UNAVAILABLE', message: 'Could not verify your account.' }
  }

  const me = (await meRes.json()) as { id: number; address?: string }
  if (!itemRes.ok) {
    const err = await itemRes.json().catch(() => ({}))
    return {
      ok: false,
      code: 'CHECKOUT_UNAVAILABLE',
      message: fastApiDetailMessage(err) || 'Item not found.',
    }
  }

  const item = (await itemRes.json()) as {
    id: number
    title: string
    current_price: number
    status: string
    highest_bidder_id: number | null
    expedited_shipping_cost: number
    end_time?: string
  }

  if (item.status === 'paid') {
    return { ok: false, code: 'CHECKOUT_UNAVAILABLE', message: 'This item has already been paid for.' }
  }

  if (item.status !== 'active' && item.status !== 'closed') {
    return {
      ok: false,
      code: 'CHECKOUT_UNAVAILABLE',
      message: 'Checkout is not available for this listing.',
    }
  }

  const endMs = parseUtcInstantMs(item.end_time ?? '')
  const auctionTimeEnded = Number.isFinite(endMs) && endMs <= Date.now()

  if (item.status === 'active' && !auctionTimeEnded) {
    return {
      ok: false,
      code: 'CHECKOUT_UNAVAILABLE',
      message: 'Checkout opens after the auction end time.',
    }
  }

  if (item.status === 'active' && auctionTimeEnded) {
    const retry = await fetch(`${API_BASE}/catalogue/items/${itemId}?_=${Date.now()}`, {
      credentials: 'include',
      ...noStore,
    })
    if (retry.ok) {
      Object.assign(item, (await retry.json()) as typeof item)
    }
  }

  const canCheckout =
    item.status === 'closed' || (item.status === 'active' && auctionTimeEnded)

  if (!canCheckout) {
    return {
      ok: false,
      code: 'CHECKOUT_UNAVAILABLE',
      message: 'Checkout is only available after the auction has closed.',
    }
  }

  if (item.highest_bidder_id == null || item.highest_bidder_id !== me.id) {
    return { ok: false, code: 'NOT_WINNER', message: 'Only the winning bidder can pay for this item.' }
  }

  const addr = me.address?.trim() ?? ''

  return {
    ok: true,
    checkout: {
      auctionId: String(item.id),
      title: item.title,
      itemPrice: item.current_price,
      expeditedShippingFee: Math.max(0, Number(item.expedited_shipping_cost) || 0),
      currency: 'USD',
      shippingAddressSummary:
        addr || 'Add an address in your profile before paying (required for shipping).',
    },
  }
}

/**
 * UC5: POST /payment/items/{item_id}/pay (mock card fields validated server-side).
 * UC6: then GET /payment/orders/{order_id}/receipt to confirm persisted receipt.
 */
export async function processTransaction(
  cardDetails: CardDetailsInput,
  auctionId: string,
  expeditedShipping: boolean
): Promise<
  { ok: true; receipt: PaymentReceiptDTO } | { ok: false; code?: PaymentErrorCode; message: string }
> {
  const itemId = parseItemId(auctionId)
  if (itemId == null) {
    return { ok: false, message: 'Invalid auction.' }
  }

  const digits = cardDetails.cardNumber.replace(/\s/g, '').replace(/-/g, '')
  const body = {
    credit_card_number: digits,
    name_on_card: cardDetails.nameOnCard.trim(),
    expiration_date: normalizeCardExpiryForApi(cardDetails.expiry),
    security_code: cardDetails.cvv.trim(),
    expedited_shipping: expeditedShipping,
  }

  const res = await fetch(`${API_BASE}/payment/items/${itemId}/pay`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>

  if (!res.ok) {
    const detail = fastApiDetailMessage(data) || 'Payment could not be completed.'
    if (res.status === 403) {
      return { ok: false, code: 'NOT_WINNER', message: detail }
    }
    if (res.status === 422) {
      return { ok: false, code: 'VALIDATION', message: detail }
    }
    if (res.status === 400) {
      const lower = detail.toLowerCase()
      if (lower.includes('card') || lower.includes('expiration') || lower.includes('security')) {
        return { ok: false, code: 'CARD_DECLINED', message: detail }
      }
      return { ok: false, code: 'CHECKOUT_UNAVAILABLE', message: detail }
    }
    return { ok: false, message: detail }
  }

  let receipt = mapReceipt(data)
  const verify = await fetch(`${API_BASE}/payment/orders/${receipt.orderId}/receipt`, {
    credentials: 'include',
    ...noStore,
  })
  if (verify.ok) {
    const again = (await verify.json().catch(() => null)) as Record<string, unknown> | null
    if (again) receipt = mapReceipt(again)
  }

  return { ok: true, receipt }
}
