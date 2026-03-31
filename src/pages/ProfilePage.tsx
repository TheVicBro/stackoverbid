import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, User } from 'lucide-react'
import { fetchProfile, updateProfile } from '@/api/profile'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export function ProfilePage() {
  const [phase, setPhase] = useState<'loading' | 'ready' | 'unauth' | 'error'>('loading')
  const [loadMessage, setLoadMessage] = useState<string | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [address, setAddress] = useState('')
  const [username, setUsername] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveOk, setSaveOk] = useState(false)

  useEffect(() => {
    let cancelled = false
    void fetchProfile().then((res) => {
      if (cancelled) return
      if (!res.ok) {
        if (res.status === 401) {
          setPhase('unauth')
          return
        }
        setPhase('error')
        setLoadMessage(res.message)
        return
      }
      setUsername(res.user.username)
      setFirstName(res.user.first_name)
      setLastName(res.user.last_name)
      setAddress(res.user.address)
      setPhase('ready')
    })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaveError(null)
    setSaveOk(false)
    setSaving(true)
    try {
      const patch: { first_name: string; last_name: string; address?: string } = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      }
      const trimmedAddr = address.trim()
      if (trimmedAddr.length > 0) {
        patch.address = trimmedAddr
      }
      const res = await updateProfile(patch)
      if (!res.ok) {
        setSaveError(res.message)
        return
      }
      setFirstName(res.user.first_name)
      setLastName(res.user.last_name)
      setAddress(res.user.address)
      setSaveOk(true)
    } catch {
      setSaveError('Something went wrong. Try again.')
    } finally {
      setSaving(false)
    }
  }

  if (phase === 'loading') {
    return (
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-10 flex items-center gap-2 text-gray-600 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading profile…
      </main>
    )
  }

  if (phase === 'unauth') {
    return (
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-10 space-y-4">
        <p className="text-gray-900 text-sm">Sign in to edit your profile and shipping address.</p>
        <Button asChild className="bg-orange-500 hover:bg-orange-400 text-white">
          <Link to="/">Back to home</Link>
        </Button>
      </main>
    )
  }

  if (phase === 'error') {
    return (
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-10 space-y-4">
        <p className="text-gray-900 text-sm">{loadMessage ?? 'Could not load profile.'}</p>
        <Button asChild variant="outline">
          <Link to="/">Back home</Link>
        </Button>
      </main>
    )
  }

  return (
    <main className="flex-1 max-w-lg mx-auto w-full px-4 py-10 space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Link to="/" className="text-orange-600 hover:text-orange-700 font-medium">
          ← Home
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-600">Profile</span>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-orange-100 p-2">
              <User className="h-6 w-6 text-orange-700" />
            </div>
            <div>
              <CardTitle className="text-lg">Your profile</CardTitle>
              <CardDescription className="mt-1">
                Update your name anytime. Shipping address is optional here; add one before checkout so we know where to
                ship your wins.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-gray-500">
              Username <span className="font-medium text-gray-700">@{username}</span> cannot be changed here.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="firstName" className="text-xs font-medium text-gray-700">
                  First name
                </label>
                <Input
                  id="firstName"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="lastName" className="text-xs font-medium text-gray-700">
                  Last name
                </label>
                <Input
                  id="lastName"
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="address" className="text-xs font-medium text-gray-700">
                Shipping address <span className="font-normal text-gray-500">(optional)</span>
              </label>
              <p className="text-[11px] text-gray-500">
                Leave this empty when saving to keep your current saved address unchanged. Fill it when you want to add
                or replace it.
              </p>
              <textarea
                id="address"
                autoComplete="street-address"
                rows={4}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street, city, state, ZIP / postal code — add when you’re ready to receive shipments"
              />
            </div>
            {saveError && (
              <p className="text-sm text-red-600" role="alert">
                {saveError}
              </p>
            )}
            {saveOk && (
              <p className="text-sm text-emerald-700" role="status">
                Profile saved.
              </p>
            )}
            <Button
              type="submit"
              disabled={saving}
              className="w-full bg-orange-500 hover:bg-orange-400 text-white font-semibold"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2 inline" />
                  Saving…
                </>
              ) : (
                'Save changes'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
