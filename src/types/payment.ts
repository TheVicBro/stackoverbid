/** Phase 1: returned by getCheckoutPage — item price + shipping (UC5). */
export interface CheckoutDTO {
  auctionId: string
  title: string
  itemPrice: number
  shippingCost: number
  currency: string
  /** Short label for where order ships (from backend / user profile). */
  shippingAddressSummary: string
}

/** Phase 2 success: receipt after bank authorization (UC5). */
export interface TransactionReceiptDTO {
  transactionId: string
  auctionId: string
  amount: number
  currency: string
  status: 'PAID'
  paidAt: string
}

/** Form payload sent to processTransaction — replace with PSP token in production. */
export interface CardDetailsInput {
  nameOnCard: string
  cardNumber: string
  expiry: string
  cvv: string
}

export type PaymentErrorCode = 'CARD_DECLINED' | 'NOT_WINNER' | 'CHECKOUT_UNAVAILABLE'
