import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parse API datetimes that are UTC but often serialized without `Z`. Without an offset,
 * `Date` treats ISO strings as *local* time (ECMAScript), skewing countdowns by the TZ offset.
 */
export function parseUtcInstantMs(iso: string | null | undefined): number {
  if (iso == null || iso === "") return NaN
  const t = iso.trim()
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(t)) {
    return Date.parse(t + "Z")
  }
  return Date.parse(t)
}

/** Strip non-digits; cap length (e.g. 19 for PAN, 4 for CVC). */
export function digitsOnlyMax(value: string, maxLen: number): string {
  return value.replace(/\D/g, "").slice(0, maxLen)
}

/** As-you-type card expiry: digits only, max 4, inserts slash → MM/YY (matches backend PaymentRequest). */
export function formatCardExpiryInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

/** Ensure API always gets MM/YY or MM-YY if user pasted plain digits. */
export function normalizeCardExpiryForApi(value: string): string {
  const s = value.trim().replace(/\s/g, "")
  if (s.includes("/") || s.includes("-")) return s
  const digits = s.replace(/\D/g, "").slice(0, 4)
  if (digits.length === 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return s
}
