/** Canadian marketplace — all list prices and checkout use CAD. */
export const APP_CURRENCY = 'CAD' as const

export function formatAppCurrency(amount: number): string {
  try {
    return new Intl.NumberFormat('en-CA', { style: 'currency', currency: APP_CURRENCY }).format(amount)
  } catch {
    return `${amount.toFixed(2)} CAD`
  }
}
