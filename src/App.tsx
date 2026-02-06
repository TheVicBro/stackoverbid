import './App.css'

function App() {
  return (
    <div className="min-h-screen bg-stone-100 text-gray-900 flex flex-col">
      {/* Top Nav */}
      <nav className="sticky top-0 z-50 bg-gray-900 border-b-[3px] border-orange-500">
        <div className="max-w-7xl mx-auto px-4 h-14 grid grid-cols-[auto_1fr_auto] items-center gap-4 md:gap-6">
          {/* Logo — left */}
          <a href="/" className="flex items-center gap-2 shrink-0">
            <img src="/logo.jpg" alt="StackOverbid" className="h-8 w-auto rounded" />
            <span className="hidden sm:inline text-lg font-bold tracking-tight text-white whitespace-nowrap">
              Stack<span className="text-orange-400">Overbid</span>
            </span>
          </a>

          {/* Search Bar — centered */}
          <div className="w-full max-w-2xl justify-self-center">
            <div className="flex">
              <input
                type="text"
                placeholder="Search for anything..."
                className="w-full h-9 px-4 text-sm bg-white rounded-l-md border-none outline-none placeholder-gray-400 text-gray-900"
              />
              <button className="h-9 px-5 bg-orange-500 hover:bg-orange-400 transition-colors rounded-r-md shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Right Actions — right-aligned */}
          <div className="flex items-center gap-1 shrink-0 justify-self-end">
            <button className="text-sm font-medium text-gray-300 hover:text-white px-3 py-1.5 rounded-md hover:bg-gray-800 transition-all whitespace-nowrap">
              Sign In
            </button>
            <button className="text-sm font-semibold bg-orange-500 text-white px-4 py-1.5 rounded-md hover:bg-orange-400 transition-colors whitespace-nowrap">
              Register
            </button>
          </div>
        </div>
      </nav>

      {/* Category Bar */}
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

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 space-y-8">
        {/* Promo Banner */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-gray-900 to-gray-800 p-8 md:p-10">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-orange-500/10 to-transparent" />
          <div className="relative max-w-lg">
            <p className="text-orange-400 text-sm font-semibold uppercase tracking-wide">Live Auctions</p>
            <h2 className="mt-2 text-2xl md:text-3xl font-bold text-white leading-snug">
              Bid on items you love — deals end soon
            </h2>
            <button className="mt-5 px-6 py-2.5 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-400 transition-colors">
              Browse Auctions
            </button>
          </div>
        </div>

        {/* Ending Soon */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Ending Soon</h2>
            <a href="#" className="text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors">
              See all &rarr;
            </a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <a
                key={i}
                href="#"
                className="group bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md hover:border-orange-200 transition-all duration-200"
              >
                <div className="aspect-square bg-stone-100" />
                <div className="p-3">
                  <h3 className="text-sm font-medium text-gray-900 truncate group-hover:text-orange-600 transition-colors">
                    Auction Item
                  </h3>
                  <p className="mt-1 text-base font-bold text-gray-900">$0.00</p>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-xs text-gray-400">0 bids</span>
                    <span className="text-xs font-medium text-red-500">2h 14m</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Trending Auctions */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Trending Auctions</h2>
            <a href="#" className="text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors">
              See all &rarr;
            </a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <a
                key={i}
                href="#"
                className="group bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md hover:border-orange-200 transition-all duration-200"
              >
                <div className="aspect-square bg-stone-100" />
                <div className="p-3">
                  <h3 className="text-sm font-medium text-gray-900 truncate group-hover:text-orange-600 transition-colors">
                    Auction Item
                  </h3>
                  <p className="mt-1 text-base font-bold text-gray-900">$0.00</p>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-xs text-gray-400">0 bids</span>
                    <span className="text-xs font-medium text-orange-500">1d 6h</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Browse Categories Grid */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Browse Categories</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { name: 'Electronics', icon: '💻' },
              { name: 'Fashion', icon: '👗' },
              { name: 'Collectibles', icon: '🏆' },
              { name: 'Home & Garden', icon: '🏠' },
              { name: 'Sports', icon: '⚽' },
              { name: 'Art', icon: '🎨' },
            ].map(({ name, icon }) => (
              <a
                key={name}
                href="#"
                className="flex items-center gap-3 bg-white p-4 rounded-lg border border-gray-200 hover:border-orange-300 hover:shadow-sm transition-all"
              >
                <span className="text-2xl">{icon}</span>
                <span className="text-sm font-medium text-gray-700">{name}</span>
              </a>
            ))}
          </div>
        </section>

        {/* Recently Listed */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Recently Listed</h2>
            <a href="#" className="text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors">
              See all &rarr;
            </a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <a
                key={i}
                href="#"
                className="group bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md hover:border-orange-200 transition-all duration-200"
              >
                <div className="aspect-square bg-stone-100" />
                <div className="p-3">
                  <h3 className="text-sm font-medium text-gray-900 truncate group-hover:text-orange-600 transition-colors">
                    Auction Item
                  </h3>
                  <p className="mt-1 text-base font-bold text-gray-900">$0.00</p>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-xs text-gray-400">0 bids</span>
                    <span className="text-xs font-medium text-gray-400">3d 12h</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>
      </main>

      {/* Sell CTA Strip */}
      <div className="bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white">Have something to sell?</h3>
            <p className="text-sm text-gray-400">List your item and reach thousands of bidders.</p>
          </div>
          <button className="px-6 py-2.5 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-400 transition-colors shrink-0">
            Start Selling
          </button>
        </div>
      </div>

      {/* Footer */}
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
                <li><a href="#" className="hover:text-orange-400 transition-colors">Browse Auctions</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Categories</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Sell an Item</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                Account
              </h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-orange-400 transition-colors">Sign In</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Register</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">My Bids</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                Support
              </h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-orange-400 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-gray-800 text-center text-xs text-gray-600">
            &copy; {new Date().getFullYear()} StackOverbid. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
