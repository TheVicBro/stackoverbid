/** Category pills below the header (must match backend `app.constants.marketplace`). */
export const MARKETPLACE_NAV_TAGS = [
  'Electronics',
  'Fashion',
  'Collectibles',
  'Home & Garden',
  'Sports',
  'Art',
  'Vehicles',
  'Jewelry',
] as const

export type MarketplaceNavTag = (typeof MARKETPLACE_NAV_TAGS)[number]
