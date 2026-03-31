import { Link, Outlet } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { NotificationMenu } from '@/components/notifications/NotificationMenu'
import Authentication from '@/authentication'

export function MarketplaceLayout() {
  const [showAuth, setShowAuth] = useState<false | "login" | "signup">(false)
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [user, setUser] = useState<{id: number, username: string, first_name: string, last_name: string} | null>(null)
  const [myListings, setMyListings] = useState<{id: number, title: string, current_price: number}[]>([])
  const [profileOpen, setProfileOpen] = useState(false)
  
  const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/api"

  useEffect(() => {
    fetch(`${API_BASE}/auth/me`, { credentials: "include" })
      .then(res => res.ok ? res.json() : null)
      .then(data => setUser(data))
      .catch((e) => console.error("Auth check failed:", e))
      .finally(() => setLoadingAuth(false))
  }, [API_BASE])

  async function handleLogout() {
    await fetch(`${API_BASE}/auth/logout`, { method: "POST", credentials: "include" })
    setUser(null)
    setMyListings([])
    setProfileOpen(false)
    setShowAuth(false)
  }

  async function openProfile() {
    setProfileOpen(true)
    if (!user) return
    try {
      const res = await fetch(`${API_BASE}/catalogue/items?seller_id=${user.id}`, { credentials: "include" })
      if (res.ok) setMyListings(await res.json())
    } catch { /* ignore */ }
  }

  if (showAuth) {
    return (
      <Authentication
        initialMode={showAuth === "signup" ? "signup" : "login"}
        onAuthed={() => {
          fetch(`${API_BASE}/auth/me`, { credentials: "include" })
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
            <div className="flex">
              <Input
                type="text"
                placeholder="Search for anything..."
                className="h-9 rounded-r-none border-none bg-white placeholder:text-gray-400 text-gray-900 shadow-none focus-visible:ring-0"
              />
              <Button
                size="sm"
                className="h-9 px-5 bg-orange-500 hover:bg-orange-400 rounded-l-none shrink-0"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </Button>
            </div>
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
                      onClick={openProfile}
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
                    <div className="py-2 px-2 border-b border-gray-100">
                      <Button variant="ghost" size="sm" className="w-full justify-start text-gray-700 hover:text-orange-600 hover:bg-orange-50 gap-2" asChild onClick={() => setProfileOpen(false)}>
                        <Link to="/sell">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                          List a New Item
                        </Link>
                      </Button>
                    </div>
                    {/* My Listings */}
                    <div className="px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">My Active Listings</p>
                      {myListings.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">No active listings yet.</p>
                      ) : (
                        <ul className="space-y-1">
                          {myListings.slice(0, 5).map(item => (
                            <li key={item.id}>
                              <Link
                                to={`/auctions/${item.id}`}
                                onClick={() => setProfileOpen(false)}
                                className="flex items-center justify-between gap-2 rounded px-2 py-1.5 hover:bg-orange-50 transition-colors group"
                              >
                                <span className="text-sm text-gray-700 truncate group-hover:text-orange-600">{item.title}</span>
                                <span className="text-xs font-semibold text-gray-500 shrink-0">${item.current_price.toFixed(2)}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
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
            {['All', 'Electronics', 'Fashion', 'Collectibles', 'Home & Garden', 'Sports', 'Art', 'Vehicles', 'Jewelry'].map(
              (cat, i) => (
                <a
                  key={cat}
                  href="#"
                  className={`shrink-0 px-3.5 py-1.5 rounded-full transition-all ${
                    i === 0
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {cat}
                </a>
              )
            )}
          </div>
          <Link 
            to="/sell"
            className="hidden sm:flex shrink-0 items-center gap-1.5 bg-orange-500 text-white hover:bg-orange-600 font-semibold text-sm px-4 py-1.5 rounded-full transition-colors shadow-sm"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            Sell
          </Link>
        </div>
      </div>

      <Outlet />

      <div className="bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white">Have something to sell?</h3>
            <p className="text-sm text-gray-400">List your item and reach thousands of bidders.</p>
          </div>
          <Button className="bg-orange-500 text-white hover:bg-orange-400 font-semibold shrink-0" asChild>
            <Link to="/sell">Start Selling</Link>
          </Button>
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
                  <a href="#" className="hover:text-orange-400 transition-colors">
                    My Bids
                  </a>
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
