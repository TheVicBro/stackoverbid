const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api'

const noStore: RequestInit = { cache: 'no-store' }

export type ProfileUser = {
  id: number
  username: string
  first_name: string
  last_name: string
  address: string
}

function fastApiDetailMessage(data: unknown): string {
  if (!data || typeof data !== 'object') return ''
  const d = (data as { detail?: unknown }).detail
  if (typeof d === 'string') return d
  if (Array.isArray(d) && d[0] && typeof d[0] === 'object' && 'msg' in d[0]) {
    return String((d[0] as { msg: string }).msg)
  }
  return ''
}

export async function fetchProfile(): Promise<
  { ok: true; user: ProfileUser } | { ok: false; status: number; message: string }
> {
  const res = await fetch(`${API_BASE}/auth/me`, { credentials: 'include', ...noStore })
  if (res.status === 401) {
    return { ok: false, status: 401, message: 'Sign in to view your profile.' }
  }
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>
  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      message: fastApiDetailMessage(data) || 'Could not load profile.',
    }
  }
  const user: ProfileUser = {
    id: Number(data.id),
    username: String(data.username ?? ''),
    first_name: String(data.first_name ?? ''),
    last_name: String(data.last_name ?? ''),
    address: String(data.address ?? ''),
  }
  return { ok: true, user }
}

export async function updateProfile(patch: {
  first_name?: string
  last_name?: string
  address?: string
}): Promise<{ ok: true; user: ProfileUser } | { ok: false; message: string }> {
  const init: RequestInit = {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
    ...noStore,
  }

  let res = await fetch(`${API_BASE}/auth/me`, init)
  // If PUT is not allowed, retry with POST /auth/profile.
  if (res.status === 405 || res.status === 404) {
    res = await fetch(`${API_BASE}/auth/profile`, {
      ...init,
      method: 'POST',
    })
  }

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>
  if (!res.ok) {
    return {
      ok: false,
      message: fastApiDetailMessage(data) || 'Could not save profile.',
    }
  }
  const user: ProfileUser = {
    id: Number(data.id),
    username: String(data.username ?? ''),
    first_name: String(data.first_name ?? ''),
    last_name: String(data.last_name ?? ''),
    address: String(data.address ?? ''),
  }
  return { ok: true, user }
}
