import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { patchAuctionItem } from '@/api/auction'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { parseUtcInstantMs } from '@/lib/utils'

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api'

type Phase =
  | 'loading'
  | 'unauth'
  | 'forbidden'
  | 'not_editable'
  | 'not_found'
  | 'ready'
  | 'error'

function parseItemLive(item: Record<string, unknown>): { isLive: boolean; reason?: string } {
  const backendStatus = item.status as string
  const endMs = parseUtcInstantMs(item.end_time as string)
  const endTimePassed = Number.isFinite(endMs) && endMs <= Date.now()
  const isLive = backendStatus === 'active' && !endTimePassed
  if (!isLive) {
    if (backendStatus !== 'active') {
      return { isLive: false, reason: 'This listing is no longer active, so it cannot be edited.' }
    }
    return { isLive: false, reason: 'This auction has ended, so the listing cannot be edited.' }
  }
  return { isLive: true }
}

export function EditAuctionPage() {
  const { auctionId } = useParams<{ auctionId: string }>()
  const navigate = useNavigate()

  const [phase, setPhase] = useState<Phase>('loading')
  const [blockMessage, setBlockMessage] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!auctionId) {
      setPhase('error')
      setBlockMessage('Missing auction id.')
      return
    }

    setPhase('loading')
    setBlockMessage(null)

    const [itemRes, meRes] = await Promise.all([
      fetch(`${API_BASE}/catalogue/items/${auctionId}`, { credentials: 'include', cache: 'no-store' }),
      fetch(`${API_BASE}/auth/me`, { credentials: 'include', cache: 'no-store' }),
    ])

    if (!itemRes.ok) {
      setPhase(itemRes.status === 404 ? 'not_found' : 'error')
      setBlockMessage(itemRes.status === 404 ? 'This listing was not found.' : 'Could not load this listing.')
      return
    }

    if (!meRes.ok) {
      setPhase('unauth')
      return
    }

    const item = (await itemRes.json()) as Record<string, unknown>
    const me = (await meRes.json()) as { id: number }
    const sellerId = item.seller_id as number

    if (me.id !== sellerId) {
      setPhase('forbidden')
      return
    }

    const live = parseItemLive(item)
    if (!live.isLive) {
      setPhase('not_editable')
      setBlockMessage(live.reason ?? 'This listing cannot be edited.')
      return
    }

    const highestBidderId = item.highest_bidder_id as number | null | undefined
    if (highestBidderId != null) {
      setPhase('not_editable')
      setBlockMessage(
        'This listing already has at least one bid. Title and description are locked until the auction ends.'
      )
      return
    }

    setTitle(String(item.title ?? ''))
    setDescription(String(item.description ?? ''))
    setPhase('ready')
  }, [auctionId])

  useEffect(() => {
    void load()
  }, [load])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!auctionId || phase !== 'ready') return
    const t = title.trim()
    const d = description.trim()
    if (!t || !d) {
      setFormError('Title and description are required.')
      return
    }
    setFormError(null)
    setSubmitting(true)
    const result = await patchAuctionItem(auctionId, { title: t, description: d })
    setSubmitting(false)
    if (!result.ok) {
      setFormError(result.message ?? 'Could not save changes.')
      return
    }
    navigate(`/auctions/${auctionId}?as=seller`)
  }

  const backToAuction = `/auctions/${auctionId ?? ''}?as=seller`

  if (phase === 'loading') {
    return (
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10 flex items-center gap-2 text-gray-600 dark:text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
        Loading listing…
      </main>
    )
  }

  if (phase === 'unauth') {
    return (
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-10 text-center dark:border-orange-900/50 dark:bg-orange-950/40">
          <h2 className="text-xl font-bold text-gray-900 dark:text-foreground mb-2">Sign in to edit</h2>
          <p className="text-gray-500 dark:text-muted-foreground text-sm mb-6">You need to be signed in as the seller to change this listing.</p>
          <Link
            to="/"
            className="inline-block bg-orange-500 hover:bg-orange-400 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
          >
            Go home & sign in
          </Link>
        </div>
      </main>
    )
  }

  if (phase === 'forbidden') {
    return (
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10 space-y-4">
        <p className="text-gray-900 dark:text-foreground text-sm">Only the seller can edit this listing.</p>
        <Button asChild variant="outline">
          <Link to="/">Back home</Link>
        </Button>
      </main>
    )
  }

  if (phase === 'not_found' || phase === 'error') {
    return (
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10 space-y-4">
        <p className="text-red-700 dark:text-red-400 text-sm">{blockMessage ?? 'Something went wrong.'}</p>
        <Button asChild variant="outline">
          <Link to="/">Back home</Link>
        </Button>
      </main>
    )
  }

  if (phase === 'not_editable') {
    return (
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10 space-y-4">
        <p className="text-gray-800 dark:text-foreground text-sm">{blockMessage}</p>
        {auctionId ? (
          <Button asChild variant="outline">
            <Link to={backToAuction}>Back to listing</Link>
          </Button>
        ) : null}
      </main>
    )
  }

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-foreground">Edit listing</h1>
          <p className="text-gray-500 dark:text-muted-foreground mt-2 text-sm">Update the title and description. Other fields stay as published.</p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link to={backToAuction}>Cancel</Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="edit-title">
                Title *
              </label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value)
                  setFormError(null)
                }}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="edit-description">
                Description *
              </label>
              <textarea
                id="edit-description"
                className="flex w-full rounded-md border border-gray-200 dark:border-border bg-transparent dark:bg-background px-3 py-2 text-sm text-foreground placeholder:text-gray-400 dark:placeholder:text-muted-foreground focus:outline-none min-h-[120px]"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value)
                  setFormError(null)
                }}
                required
              />
            </div>
            {formError && (
              <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/60" role="alert">
                {formError}
              </div>
            )}
            <div className="pt-2 flex items-center justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => navigate(backToAuction)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-orange-500 hover:bg-orange-400 text-white">
                {submitting ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
