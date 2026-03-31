/** Phase 1: item + shipping preview before pay (UC5). */
export interface CheckoutDTO {
  auctionId: string
  title: string
  itemPrice: number
  /** Added to total when buyer selects expedited shipping (matches backend strategy). */
  expeditedShippingFee: number
  currency: string
  /** From profile or placeholder — backend uses profile address if pay request omits override. */
  shippingAddressSummary: string
}

/** Receipt from POST /payment/items/{id}/pay or GET /payment/orders/{id}/receipt (UC5–UC6). */
export interface PaymentReceiptDTO {
  orderId: number
  itemId: number
  itemTitle: string
  amountPaid: number
  shippingAddress: string
  shippingTimeDays: number
  expeditedShipping: boolean
  paidAt: string
  message: string
}

/** Form payload — mock only; backend validates format like a payment facade. */
export interface CardDetailsInput {
  nameOnCard: string
  cardNumber: string
  expiry: string
  cvv: string
}

export type PaymentErrorCode = 'CARD_DECLINED' | 'NOT_WINNER' | 'CHECKOUT_UNAVAILABLE' | 'VALIDATION'
