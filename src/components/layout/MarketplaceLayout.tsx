import { Link, Outlet } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { NotificationMenu } from '@/components/notifications/NotificationMenu'
import Authentication from '@/authentication'

export function MarketplaceLayout() {
  const [showAuth, setShowAuth] = useState<false | "login" | "signup">(false)
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [user, setUser] = useState<{username: string, first_name: string} | null>(null)
  
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
    setShowAuth(false)
  }

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center text-gray-500">
        <p>Loading StackOverbid...</p>
      </div>
    )
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
            {user && <NotificationMenu />}
            {user ? (
              <>
                <span className="hidden sm:inline text-sm text-gray-300 font-medium mr-2">Hello, {user.first_name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-300 hover:text-white hover:bg-gray-800 whitespace-nowrap"
                  onClick={handleLogout}
                >
                  Log Out
                </Button>
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
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-1 overflow-x-auto py-2 text-sm font-medium no-scrollbar">
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
        </div>
      </div>

      <Outlet />

      <div className="bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white">Have something to sell?</h3>
            <p className="text-sm text-gray-400">List your item and reach thousands of bidders.</p>
          </div>
          <Button className="bg-orange-500 text-white hover:bg-orange-400 font-semibold shrink-0">
            Start Selling
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
                  <a href="#" className="hover:text-orange-400 transition-colors">
                    Sell an Item
                  </a>
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
