import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export function CreateAuctionPage() {
  const navigate = useNavigate()
  
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [startingPrice, setStartingPrice] = useState("")
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [endTime, setEndTime] = useState("12:00")
  const [shippingTime, setShippingTime] = useState("5")
  const [expeditedCost, setExpeditedCost] = useState("15")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/api"

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!title || !description || !startingPrice || !endDate || !endTime) {
         throw new Error("Please fill out all required fields.")
      }

      const res = await fetch(`${API_BASE}/auction/items`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          starting_price: parseFloat(startingPrice),
          end_time: endDate ? new Date(`${format(endDate, "yyyy-MM-dd")}T${endTime}:00`).toISOString() : new Date().toISOString(),
          shipping_time_days: parseInt(shippingTime, 10),
          expedited_shipping_cost: parseFloat(expeditedCost)
        })
      })

      const data = await res.json().catch(() => ({}))
      
      if (!res.ok) {
        if (res.status === 401) throw new Error("You must be logged in to create an auction! Please sign in through the top right.")
        const errorMsg = data.detail ? (Array.isArray(data.detail) ? data.detail[0].msg : data.detail) : "Failed to create auction."
        throw new Error(errorMsg)
      }

      navigate(`/auctions/${data.id}`)
      
    } catch (err: any) {
      setError(err.message || "An unknown error occurred.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">List an Item for Auction</h1>
        <p className="text-gray-500 mt-2">Fill out the details below to publish your item to the public marketplace.</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <Input 
                 placeholder="e.g. Vintage 1970s Rolex Submariner" 
                 value={title} onChange={e => setTitle(e.target.value)}
                 required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea 
                 className="flex w-full rounded-md border border-gray-200 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none border-transparent min-h-[120px]"
                 style={{ border: "1px solid #e5e7eb" }}
                 placeholder="Describe the condition, history, and authenticating details of your item..."
                 value={description} onChange={e => setDescription(e.target.value)}
                 required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Starting Price ($) *</label>
                <Input 
                   type="number" step="0.01" min="1"
                   placeholder="0.00"
                   value={startingPrice} onChange={e => setStartingPrice(e.target.value)}
                   required
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={`w-full justify-start text-left font-normal ${!endDate ? "text-gray-400" : "text-gray-900"}`}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : "Select date..."}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
                  <Input 
                     type="time" 
                     value={endTime} onChange={e => setEndTime(e.target.value)}
                     required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Standard Shipping (Days)</label>
                  <Input 
                     type="number" min="1" max="30"
                     value={shippingTime} onChange={e => setShippingTime(e.target.value)}
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expedited Shipping Cost ($)</label>
                  <Input 
                     type="number" step="0.01" min="0"
                     value={expeditedCost} onChange={e => setExpeditedCost(e.target.value)}
                  />
               </div>
            </div>

            {error && (
               <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
                  <strong>Error: </strong> {error}
               </div>
            )}

            <div className="pt-4 flex items-center justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
              <Button type="submit" disabled={loading} className="bg-orange-500 hover:bg-orange-400 text-white">
                {loading ? "Publishing..." : "Publish Auction"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
