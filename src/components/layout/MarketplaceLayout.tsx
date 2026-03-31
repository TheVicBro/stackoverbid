import { Link, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Gavel, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { NotificationMenu } from '@/components/notifications/NotificationMenu'
import Authentication from '@/authentication'
import { MARKETPLACE_NAV_TAGS } from '@/constants/marketplaceCategories'

const NAV_CATEGORIES = ['All', ...MARKETPLACE_NAV_TAGS] as const

export function MarketplaceLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [searchDraft, setSearchDraft] = useState('')

  const qInUrl = (searchParams.get('q') ?? '').trim()

  useEffect(() => {
    if (location.pathname === '/search') {
      setSearchDraft(searchParams.get('q') ?? '')
    }
  }, [location.pathname, searchParams])

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    const t = searchDraft.trim()
    if (!t) {
      navigate('/')
      return
    }
    navigate(`/search?q=${encodeURIComponent(t)}`)
  }

  const [showAuth, setShowAuth] = useState<false | "login" | "signup">(false)
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [user, setUser] = useState<{id: number, username: string, first_name: string, last_name: string} | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)
  
  const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/api"

  useEffect(() => {
    fetch(`${API_BASE}/auth/me`, { credentials: "include", cache: "no-store" })
      .then(res => res.ok ? res.json() : null)
      .then(data => setUser(data))
      .catch((e) => console.error("Auth check failed:", e))
      .finally(() => setLoadingAuth(false))
  }, [API_BASE])

  async function handleLogout() {
    await fetch(`${API_BASE}/auth/logout`, { method: "POST", credentials: "include" })
    setUser(null)
    setProfileOpen(false)
    setShowAuth(false)
  }

  if (showAuth) {
    return (
      <Authentication
        initialMode={showAuth === "signup" ? "signup" : "login"}
        onAuthed={() => {
          fetch(`${API_BASE}/auth/me`, { credentials: "include", cache: "no-store" })
            .then(res => res.json())
            .then(data => {
              setUser(data)
              setShowAuth(false)
            })
            .catch(() => setShowAuth(false))
        }}
        onCancel={() => setShowAuth(false)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-stone-100 text-gray-900 flex flex-col">
      <nav className="sticky top-0 z-50 bg-gray-900 border-b-[3px] border-orange-500">
        <div className="max-w-7xl mx-auto px-4 h-14 grid grid-cols-[auto_1fr_auto] items-center gap-4 md:gap-6">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src="/logo.jpg" alt="StackOverbid" className="h-8 w-auto rounded" />
            <span className="hidden sm:inline text-lg font-bold tracking-tight text-white whitespace-nowrap">
              Stack<span className="text-orange-400">Overbid</span>
            </span>
          </Link>

          <div className="w-full max-w-2xl justify-self-center">
            <form className="flex" onSubmit={submitSearch}>
              <Input
                type="search"
                name="q"
                autoComplete="off"
                placeholder="Search listings by title or description..."
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
                className="h-9 rounded-r-none border-none bg-white placeholder:text-gray-400 text-gray-900 shadow-none focus-visible:ring-0"
              />
              <Button
                type="submit"
                size="sm"
                className="h-9 px-5 bg-orange-500 hover:bg-orange-400 rounded-l-none shrink-0 cursor-pointer"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <span className="sr-only">Search</span>
              </Button>
            </form>
          </div>

          <div className="flex items-center gap-2 shrink-0 justify-self-end">
            {loadingAuth ? (
              <span className="text-sm text-gray-400 font-medium px-4 animate-pulse">Connecting...</span>
            ) : user ? (
              <>
                <NotificationMenu />
                <Popover open={profileOpen} onOpenChange={setProfileOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-full bg-gray-800 hover:bg-gray-700 px-3 py-1.5 transition-colors cursor-pointer"
                    >
                      <div className="h-6 w-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {user.first_name[0]}{user.last_name[0]}
                      </div>
                      <span className="hidden sm:inline text-sm text-gray-200 font-medium">{user.first_name}</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-72 p-0 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gray-900 px-4 py-4 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {user.first_name[0]}{user.last_name[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-semibold truncate">{user.first_name} {user.last_name}</p>
                        <p className="text-gray-400 text-xs truncate">@{user.username}</p>
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="py-2 px-2 border-b border-gray-100 space-y-0.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-gray-700 hover:text-orange-600 hover:bg-orange-50 gap-2"
                        onClick={() => {
                          setProfileOpen(false)
                          navigate('/profile')
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                        Profile & address
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-gray-700 hover:text-orange-600 hover:bg-orange-50 gap-2"
                        onClick={() => {
                          setProfileOpen(false)
                          navigate('/my/auctions')
                        }}
                      >
                        <Gavel className="h-3.5 w-3.5" />
                        My bids & purchases
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-gray-700 hover:text-orange-600 hover:bg-orange-50 gap-2"
                        onClick={() => {
                          setProfileOpen(false)
                          navigate('/my/listings')
                        }}
                      >
                        <Store className="h-3.5 w-3.5" />
                        My listings
                      </Button>
                      <Button variant="ghost" size="sm" className="w-full justify-start text-gray-700 hover:text-orange-600 hover:bg-orange-50 gap-2" asChild onClick={() => setProfileOpen(false)}>
                        <Link to="/sell">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                          List a New Item
                        </Link>
                      </Button>
                    </div>
                    {/* Footer */}
                    <div className="border-t border-gray-100 px-2 py-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 gap-2"
                        onClick={handleLogout}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                        Log Out
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-300 hover:text-white hover:bg-gray-800 whitespace-nowrap"
                  onClick={() => setShowAuth("login")}
                >
                  Sign In
                </Button>
                <Button
                  size="sm"
                  className="bg-orange-500 text-white hover:bg-orange-400 whitespace-nowrap font-semibold"
                  onClick={() => setShowAuth("signup")}
                >
                  Register
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-1 overflow-x-auto py-2 text-sm font-medium no-scrollbar mr-4">
            {NAV_CATEGORIES.map((cat) => {
              const isAll = cat === 'All'
              const to = isAll ? '/' : `/search?q=${encodeURIComponent(cat)}`
              const active = isAll
                ? location.pathname === '/'
                : location.pathname === '/search' && qInUrl.toLowerCase() === cat.toLowerCase()
              return (
                <Link
                  key={cat}
                  to={to}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                    active ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {cat}
                </Link>
              )
            })}
          </div>
          {user ? (
            <Link 
              to="/sell"
              className="hidden sm:flex shrink-0 items-center gap-1.5 bg-orange-500 text-white hover:bg-orange-600 font-semibold text-sm px-4 py-1.5 rounded-full transition-colors shadow-sm"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
              Sell
            </Link>
          ) : (
            <button
              onClick={() => setShowAuth("login")}
              className="hidden sm:flex shrink-0 items-center gap-1.5 bg-orange-500 text-white hover:bg-orange-600 font-semibold text-sm px-4 py-1.5 rounded-full transition-colors shadow-sm cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
              Sell
            </button>
          )}
        </div>
      </div>

      <Outlet />

      <div className="bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white">Have something to sell?</h3>
            <p className="text-sm text-gray-400">List your item and reach thousands of bidders.</p>
          </div>
          {user ? (
            <Button className="bg-orange-500 text-white hover:bg-orange-400 font-semibold shrink-0" asChild>
              <Link to="/sell">Start Selling</Link>
            </Button>
          ) : (
            <button
              onClick={() => setShowAuth("login")}
              className="bg-orange-500 text-white hover:bg-orange-400 font-semibold shrink-0 px-4 py-2 rounded-md text-sm cursor-pointer transition-colors"
            >
              Start Selling
            </button>
          )}
        </div>
      </div>

      <footer className="bg-gray-950 text-gray-400">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <span className="text-lg font-bold text-white">
                Stack<span className="text-orange-400">Overbid</span>
              </span>
              <p className="mt-3 text-sm leading-relaxed">
                The forward auction marketplace built for buyers and sellers.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                Marketplace
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/" className="hover:text-orange-400 transition-colors">
                    Browse Auctions
                  </Link>
                </li>
                <li>
                  <a href="#" className="hover:text-orange-400 transition-colors">
                    Categories
                  </a>
                </li>
                <li>
                  <Link to="/sell" className="hover:text-orange-400 transition-colors">
                    Sell an Item
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                Account
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-orange-400 transition-colors">
                    Sign In
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-orange-400 transition-colors">
                    Register
                  </a>
                </li>
                <li>
                  {user ? (
                    <Link to="/my/auctions" className="hover:text-orange-400 transition-colors">
                      My bids & purchases
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowAuth('login')}
                      className="hover:text-orange-400 transition-colors cursor-pointer bg-transparent border-0 p-0 text-inherit font-inherit text-left w-full"
                    >
                      My bids & purchases
                    </button>
                  )}
                </li>
                <li>
                  {user ? (
                    <Link to="/my/listings" className="hover:text-orange-400 transition-colors">
                      My listings
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowAuth('login')}
                      className="hover:text-orange-400 transition-colors cursor-pointer bg-transparent border-0 p-0 text-inherit font-inherit text-left w-full"
                    >
                      My listings
                    </button>
                  )}
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                Support
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-orange-400 transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-orange-400 transition-colors">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-orange-400 transition-colors">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <Separator className="mt-10 bg-gray-800" />
          <div className="pt-6 text-center text-xs text-gray-600">
            &copy; {new Date().getFullYear()} StackOverbid. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
