import type {
  CardDetailsInput,
  CheckoutDTO,
  PaymentErrorCode,
  TransactionReceiptDTO,
} from '@/types/payment'

/**
 * Replace with:
 * GET /api/payments/checkout?auctionId=&userId=
 * (or POST to Payment Facade as in your sequence diagram)
 */
export async function getCheckoutPage(
  auctionId: string,
  _userId?: string
): Promise<{ ok: true; checkout: CheckoutDTO } | { ok: false; code: PaymentErrorCode }> {
  await delay(280)

  if (auctionId !== 'sample-sold') {
    return { ok: false, code: 'CHECKOUT_UNAVAILABLE' }
  }

  return {
    ok: true,
    checkout: {
      auctionId,
      title: 'Rare Watch — Sold, unpaid order (mock)',
      itemPrice: 450,
      shippingCost: 12.5,
      currency: 'USD',
      shippingAddressSummary: '123 Demo St, San Francisco, CA',
    },
  }
}

/**
 * Replace with:
 * POST /api/payments/transactions
 * Body: { auctionId, cardToken or cardDetails per PCI policy, amount }
 */
export async function processTransaction(
  cardDetails: CardDetailsInput,
  amount: number,
  auctionId: string
): Promise<
  | { ok: true; receipt: TransactionReceiptDTO }
  | { ok: false; code: PaymentErrorCode; message: string }
> {
  await delay(600)

  if (!Number.isFinite(amount) || amount <= 0) {
    return {
      ok: false,
      code: 'CARD_DECLINED',
      message: 'Invalid payment amount.',
    }
  }

  const digits = cardDetails.cardNumber.replace(/\s/g, '')
  // Demo: simulate bank decline (insufficient funds / generic decline)
  if (digits.length >= 4 && digits.endsWith('0000')) {
    return {
      ok: false,
      code: 'CARD_DECLINED',
      message: 'Card declined',
    }
  }

  if (digits.length < 12) {
    return {
      ok: false,
      code: 'CARD_DECLINED',
      message: 'Invalid card number.',
    }
  }

  const receipt: TransactionReceiptDTO = {
    transactionId: `txn-${Date.now()}`,
    auctionId,
    amount,
    currency: 'USD',
    status: 'PAID',
    paidAt: new Date().toISOString(),
  }

  return { ok: true, receipt }
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}
