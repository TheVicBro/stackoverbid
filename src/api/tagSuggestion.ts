const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api'

export type SuggestListingDraftResult =
  | {
      ok: true
      tags: string[]
      source: string
      title?: string
      description?: string
    }
  | { ok: false; message: string }

export async function suggestListingDraft(input: {
  title: string
  description: string
  imageUrls: string[]
}): Promise<SuggestListingDraftResult> {
  const res = await fetch(`${API_BASE}/auction/items/suggest-tags`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: input.title.trim(),
      description: input.description.trim(),
      image_urls: input.imageUrls,
    }),
  })
  if (res.status === 401) {
    return { ok: false, message: 'You must be signed in to use Gemini suggestions.' }
  }
  const data = (await res.json().catch(() => ({}))) as {
    tags?: unknown
    source?: unknown
    title?: unknown
    description?: unknown
    detail?: unknown
  }
  if (!res.ok) {
    const d = data.detail
    const msg = typeof d === 'string' ? d : 'Could not generate suggestions.'
    return { ok: false, message: msg }
  }
  const tags = Array.isArray(data.tags) ? data.tags.filter((t): t is string => typeof t === 'string') : []
  const source = typeof data.source === 'string' ? data.source : 'unknown'
  const title = typeof data.title === 'string' && data.title.trim() ? data.title.trim() : undefined
  const description =
    typeof data.description === 'string' && data.description.trim() ? data.description.trim() : undefined
  return { ok: true, tags, source, title, description }
}
