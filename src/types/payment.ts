/** Checkout preview before submitting payment. */
export interface CheckoutDTO {
  auctionId: string
  title: string
  itemPrice: number
  /** Added to total when the buyer selects expedited shipping. */
  expeditedShippingFee: number
  currency: string
  /** Saved profile address or a prompt to add one before paying. */
  shippingAddressSummary: string
  /** False when no shipping address is saved on the profile. */
  hasShippingAddress: boolean
}

/** Confirmed order after successful payment. */
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

/** Card fields collected on the checkout form (validated server-side). */
export interface CardDetailsInput {
  nameOnCard: string
  cardNumber: string
  expiry: string
  cvv: string
}

export type PaymentErrorCode = 'CARD_DECLINED' | 'NOT_WINNER' | 'CHECKOUT_UNAVAILABLE' | 'VALIDATION'
