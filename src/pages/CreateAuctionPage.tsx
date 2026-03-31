import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { format } from 'date-fns'
import { CalendarIcon, X, ImagePlus, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export function CreateAuctionPage() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [startingPrice, setStartingPrice] = useState("")
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [endTime, setEndTime] = useState("12:00")
  const [shippingTime, setShippingTime] = useState("5")
  const [expeditedCost, setExpeditedCost] = useState("15")

  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const CLOUD_NAME = (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined)?.trim() ?? ''
  const UPLOAD_PRESET = (import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined)?.trim() ?? ''
  const cloudinaryReady = Boolean(CLOUD_NAME && UPLOAD_PRESET)

  const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/api"

  const uploadToCloudinary = useCallback(
    async (files: File[]) => {
      if (!cloudinaryReady) {
        setError('Image upload is not configured. Add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to your environment.')
        return
      }
      const imageFiles = files.filter((f) => f.type.startsWith('image/'))
      if (imageFiles.length === 0) return
      setUploadingImages(true)
      setError(null)
      try {
        const uploaded = await Promise.all(
          imageFiles.map(async (file) => {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('upload_preset', UPLOAD_PRESET)
            const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
              method: 'POST',
              body: formData,
            })
            const data = (await res.json()) as { secure_url?: string; error?: { message?: string } }
            if (!res.ok || !data.secure_url) {
              throw new Error(data.error?.message ?? `Upload failed (${res.status})`)
            }
            return data.secure_url
          })
        )
        setImageUrls((prev) => [...prev, ...uploaded])
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to upload one or more images.')
      } finally {
        setUploadingImages(false)
      }
    },
    [CLOUD_NAME, UPLOAD_PRESET, cloudinaryReady]
  )

  function onDropZoneDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  function onDropZoneDragLeave(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  async function onDropZoneDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    await uploadToCloudinary(files)
  }

  function removeImageAt(index: number) {
    setImageUrls((prev) => prev.filter((_, i) => i !== index))
  }

  useEffect(() => {
    fetch(`${API_BASE}/auth/me`, { credentials: 'include' })
      .then(res => { setIsLoggedIn(res.ok); setAuthChecked(true) })
      .catch(() => setAuthChecked(true))
  }, [API_BASE])

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
          expedited_shipping_cost: parseFloat(expeditedCost),
          image_urls: imageUrls,
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

  if (!authChecked) {
    return (
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        <div className="flex items-center justify-center py-24">
          <p className="text-gray-400 animate-pulse">Checking authentication...</p>
        </div>
      </main>
    )
  }

  if (!isLoggedIn) {
    return (
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-10 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Sign in to sell an item</h2>
          <p className="text-gray-500 text-sm mb-6">You need a StackOverbid account to list items for auction.</p>
          <Link to="/" className="inline-block bg-orange-500 hover:bg-orange-400 text-white font-semibold px-6 py-2 rounded-lg transition-colors">
            Go Home & Sign In
          </Link>
        </div>
      </main>
    )
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Photos (optional)</label>
              <p className="text-xs text-gray-500 mb-2">
                Drag and drop images here, or click to browse. You can add several. Requires Cloudinary env vars in production.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const list = e.target.files
                  if (list?.length) void uploadToCloudinary(Array.from(list))
                  e.target.value = ''
                }}
              />
              <div
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    fileInputRef.current?.click()
                  }
                }}
                onDragOver={onDropZoneDragOver}
                onDragLeave={onDropZoneDragLeave}
                onDrop={onDropZoneDrop}
                onClick={() => !uploadingImages && fileInputRef.current?.click()}
                className={cn(
                  'rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors cursor-pointer',
                  uploadingImages && 'pointer-events-none opacity-70',
                  isDragOver ? 'border-orange-400 bg-orange-50/60' : 'border-gray-200 bg-stone-50/50 hover:border-orange-200 hover:bg-orange-50/30'
                )}
              >
                {uploadingImages ? (
                  <div className="flex flex-col items-center gap-2 text-gray-600">
                    <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                    <span className="text-sm">Uploading…</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-600">
                    <ImagePlus className="h-8 w-8 text-orange-500" />
                    <span className="text-sm font-medium text-gray-800">Drop images here or click to upload</span>
                    {!cloudinaryReady && (
                      <span className="text-xs text-amber-700 max-w-sm">
                        Cloudinary is not configured — listings can still be published without photos.
                      </span>
                    )}
                  </div>
                )}
              </div>
              {imageUrls.length > 0 && (
                <ul className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {imageUrls.map((url, i) => (
                    <li key={`${url}-${i}`} className="relative group aspect-square rounded-md overflow-hidden border border-gray-200 bg-stone-100">
                      <img src={url} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeImageAt(i)
                        }}
                        className="absolute top-1 right-1 rounded-full bg-gray-900/75 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-900"
                        aria-label="Remove photo"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
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
