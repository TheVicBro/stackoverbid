import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// API often omits Z on UTC timestamps; Date would parse those as local without it.
export function parseUtcInstantMs(iso: string | null | undefined): number {
  if (iso == null || iso === "") return NaN
  const t = iso.trim()
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(t)) {
    return Date.parse(t + "Z")
  }
  return Date.parse(t)
}

// Digits only, max length (PAN vs CVC).
export function digitsOnlyMax(value: string, maxLen: number): string {
  return value.replace(/\D/g, "").slice(0, maxLen)
}

// Expiry field: up to 4 digits, slash after MM.
export function formatCardExpiryInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

// Normalize pasted expiry to MM/YY for the API.
export function normalizeCardExpiryForApi(value: string): string {
  const s = value.trim().replace(/\s/g, "")
  if (s.includes("/") || s.includes("-")) return s
  const digits = s.replace(/\D/g, "").slice(0, 4)
  if (digits.length === 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return s
}
