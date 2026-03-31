import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { format } from 'date-fns'
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  ImagePlus,
  Loader2,
  Sparkles,
  X,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { suggestListingDraft } from '@/api/tagSuggestion'
import { MARKETPLACE_NAV_TAGS } from '@/constants/marketplaceCategories'
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
  const dragPhotoIndexRef = useRef<number | null>(null)

  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [tagSuggesting, setTagSuggesting] = useState(false)
  const [tagHint, setTagHint] = useState<string | null>(null)

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
            return data.secure_url as string
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

  function movePhoto(from: number, to: number) {
    if (from === to || from < 0 || to < 0) return
    setImageUrls((prev) => {
      if (from >= prev.length || to >= prev.length) return prev
      const next = [...prev]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next
    })
  }

  function toggleTag(tag: string) {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) return prev.filter((t) => t !== tag)
      if (prev.length >= 5) return prev
      return [...prev, tag]
    })
  }

  async function runSuggestFromGemini() {
    setTagSuggesting(true)
    setError(null)
    setTagHint(null)
    const res = await suggestListingDraft({ title, description, imageUrls })
    setTagSuggesting(false)
    if (!res.ok) {
      setError(res.message)
      return
    }
    if (res.title) setTitle(res.title)
    if (res.description) setDescription(res.description)
    setSelectedTags((prev) => {
      const merged = [...new Set([...prev, ...res.tags])]
      return merged.slice(0, 5)
    })
    setTagHint(
      res.source === 'gemini'
        ? 'Applied Gemini suggestions for title, description, and/or categories — edit anything before you publish.'
        : 'Applied keyword-based categories from your text only — configure Gemini on the server to draft from photos too.'
    )
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
          tags: selectedTags,
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
          <p className="text-gray-400 dark:text-muted-foreground animate-pulse">Checking authentication...</p>
        </div>
      </main>
    )
  }

  if (!isLoggedIn) {
    return (
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-10 text-center dark:border-orange-900/50 dark:bg-orange-950/40">
          <h2 className="text-xl font-bold text-gray-900 dark:text-foreground mb-2">Sign in to sell an item</h2>
          <p className="text-gray-500 dark:text-muted-foreground text-sm mb-6">You need a StackOverbid account to list items for auction.</p>
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-foreground">List an Item for Auction</h1>
        <p className="text-gray-500 dark:text-muted-foreground mt-2">
          Fill out the form below. Use <strong>Suggest with Gemini</strong> after you add text and/or photos — it runs
          only when you click the button, then fills title, description, and categories for you to review.
        </p>
      </div>

      <Card className="gap-0 py-0 shadow-sm">
        <CardContent className="py-6">
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
              <Input 
                 placeholder="e.g. Vintage 1970s Rolex Submariner" 
                 value={title} onChange={e => setTitle(e.target.value)}
                 required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description *</label>
              <textarea 
                 className="flex w-full rounded-md border border-gray-200 dark:border-border bg-transparent dark:bg-background px-3 py-2 text-sm text-foreground placeholder:text-gray-400 dark:placeholder:text-muted-foreground focus:outline-none border-transparent min-h-[120px]"
                 style={{ border: "1px solid #e5e7eb" }}
                 placeholder="Describe the condition, history, and authenticating details of your item..."
                 value={description} onChange={e => setDescription(e.target.value)}
                 required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Photos (optional)</label>
              <p className="text-xs text-gray-500 dark:text-muted-foreground mb-2">
                Drag files here or click to upload. The <strong>first</strong> image is the cover on listings — drag
                thumbnails to reorder, or use the arrows on each photo.
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
                  isDragOver
                    ? 'border-orange-400 bg-orange-50/60 dark:border-orange-500 dark:bg-orange-950/40'
                    : 'border-gray-200 bg-stone-50/50 hover:border-orange-200 hover:bg-orange-50/30 dark:border-border dark:bg-muted/30 dark:hover:border-orange-700/50 dark:hover:bg-orange-950/20'
                )}
              >
                {uploadingImages ? (
                  <div className="flex flex-col items-center gap-2 text-gray-600 dark:text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                    <span className="text-sm">Uploading…</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-600 dark:text-muted-foreground">
                    <ImagePlus className="h-8 w-8 text-orange-500" />
                    <span className="text-sm font-medium text-gray-800 dark:text-foreground">Drop images here or click to upload</span>
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
                    <li
                      key={url}
                      draggable
                      onDragStart={(e) => {
                        dragPhotoIndexRef.current = i
                        e.dataTransfer.effectAllowed = 'move'
                        e.dataTransfer.setData('text/plain', String(i))
                      }}
                      onDragEnd={() => {
                        dragPhotoIndexRef.current = null
                      }}
                      onDragOver={(e) => {
                        e.preventDefault()
                        e.dataTransfer.dropEffect = 'move'
                      }}
                      onDrop={(e) => {
                        e.preventDefault()
                        const from = dragPhotoIndexRef.current
                        dragPhotoIndexRef.current = null
                        if (from === null || from === i) return
                        movePhoto(from, i)
                      }}
                      className="relative group flex flex-col rounded-md overflow-hidden border border-gray-200 bg-stone-100 shadow-sm dark:border-border dark:bg-muted/40"
                    >
                      <div className="relative aspect-square w-full shrink-0">
                        <img src={url} alt="" className="h-full w-full object-cover pointer-events-none" />
                        <div
                          className="absolute left-1 top-1 flex items-center gap-0.5 rounded bg-gray-900/70 text-white px-1 py-0.5 cursor-grab active:cursor-grabbing"
                          title="Drag to reorder"
                          aria-hidden
                        >
                          <GripVertical className="h-4 w-4" />
                        </div>
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
                        {i === 0 && (
                          <span className="absolute bottom-1 left-1 rounded bg-orange-600/95 text-white text-[10px] font-semibold px-1.5 py-0.5">
                            Cover
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-center gap-1 border-t border-stone-200 bg-white py-1 dark:border-border dark:bg-card">
                        <button
                          type="button"
                          disabled={i === 0}
                          onClick={() => movePhoto(i, i - 1)}
                          className="rounded p-1 text-gray-600 hover:bg-stone-100 disabled:opacity-30 disabled:pointer-events-none dark:text-muted-foreground dark:hover:bg-muted"
                          aria-label="Move photo earlier"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          disabled={i === imageUrls.length - 1}
                          onClick={() => movePhoto(i, i + 1)}
                          className="rounded p-1 text-gray-600 hover:bg-stone-100 disabled:opacity-30 disabled:pointer-events-none dark:text-muted-foreground dark:hover:bg-muted"
                          aria-label="Move photo later"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-lg border border-orange-200/90 bg-gradient-to-br from-orange-50/90 to-stone-50/80 p-4 space-y-3 dark:border-orange-900/50 dark:from-orange-950/40 dark:to-muted/50">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-foreground">Gemini listing assistant</h2>
                  <p className="text-xs text-gray-600 dark:text-muted-foreground max-w-xl leading-relaxed">
                    Suggests <strong>title</strong>, <strong>description</strong>, and <strong>categories</strong> from
                    your draft and up to four photos (in the order shown above). Nothing is sent until you click — then
                    review and edit before publishing.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 border-orange-300 bg-white text-orange-950 hover:bg-orange-50 dark:border-orange-700 dark:bg-card dark:text-orange-100 dark:hover:bg-muted"
                  disabled={tagSuggesting}
                  onClick={() => void runSuggestFromGemini()}
                >
                  {tagSuggesting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-1.5" />
                  )}
                  Suggest with Gemini
                </Button>
              </div>
              {tagHint && (
                <p className="text-xs text-emerald-900 bg-emerald-50/80 border border-emerald-200/60 rounded-md px-2.5 py-2 dark:text-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800/60">
                  {tagHint}
                </p>
              )}
            </div>

            <div className="rounded-lg border border-stone-200 bg-stone-50/50 p-4 space-y-3 dark:border-border dark:bg-muted/30">
              <label className="text-sm font-medium text-gray-800 dark:text-foreground">Categories (optional)</label>
              <p className="text-xs text-gray-600 dark:text-muted-foreground">
                Same labels as the category bar under the header. Pick up to five, or merge with Gemini suggestions from
                the assistant above.
              </p>
              <div className="flex flex-wrap gap-2">
                {MARKETPLACE_NAV_TAGS.map((tag) => {
                  const on = selectedTags.includes(tag)
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={cn(
                        'text-xs font-medium rounded-full px-3 py-1.5 border transition-colors',
                        on
                          ? 'border-orange-500 bg-orange-100 text-orange-950 dark:bg-orange-950/50 dark:text-orange-100 dark:border-orange-600'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-orange-200 hover:bg-orange-50/50 dark:border-border dark:bg-card dark:text-foreground dark:hover:bg-muted dark:hover:border-orange-700/50'
                      )}
                    >
                      {tag}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Starting price (CAD) *</label>
                <Input 
                   type="number" step="0.01" min="1"
                   placeholder="0.00"
                   value={startingPrice} onChange={e => setStartingPrice(e.target.value)}
                   required
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date *</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={`w-full justify-start text-left font-normal ${!endDate ? 'text-gray-400 dark:text-muted-foreground' : 'text-gray-900 dark:text-foreground'}`}>
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Time *</label>
                  <Input 
                     type="time" 
                     value={endTime} onChange={e => setEndTime(e.target.value)}
                     required
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-muted-foreground sm:col-span-2">
                End date and time use <strong>your computer&apos;s local timezone</strong>. They are sent to the server as
                UTC (ISO 8601), and countdowns use that same instant everywhere.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
               <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Standard Shipping (Days)</label>
                  <Input 
                     type="number" min="1" max="30"
                     value={shippingTime} onChange={e => setShippingTime(e.target.value)}
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expedited shipping (CAD)</label>
                  <Input 
                     type="number" step="0.01" min="0"
                     value={expeditedCost} onChange={e => setExpeditedCost(e.target.value)}
                  />
               </div>
            </div>

            {error && (
               <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/60">
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
