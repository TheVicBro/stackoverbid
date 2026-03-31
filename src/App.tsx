import './App.css'
import { Route, Routes } from 'react-router-dom'
import { MarketplaceLayout } from '@/components/layout/MarketplaceLayout'
import { AuctionDetailPage } from '@/pages/AuctionDetailPage'
import { CheckoutPage } from '@/pages/CheckoutPage'
import { HomePage } from '@/pages/HomePage'
import { UnpaidOrderPage } from '@/pages/UnpaidOrderPage'
import { CreateAuctionPage } from '@/pages/CreateAuctionPage'

function App() {
  return (
    <Routes>
      <Route element={<MarketplaceLayout />}>
        <Route index element={<HomePage />} />
        <Route path="sell" element={<CreateAuctionPage />} />
        <Route path="auctions/:auctionId" element={<AuctionDetailPage />} />
        <Route path="checkout/:auctionId" element={<CheckoutPage />} />
        <Route path="orders/:orderId/unpaid" element={<UnpaidOrderPage />} />
      </Route>
    </Routes>
  )
}

export default App
