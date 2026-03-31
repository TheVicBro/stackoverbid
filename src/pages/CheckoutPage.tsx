import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AlertCircle, CheckCircle2, CreditCard, Loader2, ShieldCheck } from 'lucide-react'
import { getCheckoutPage, processTransaction } from '@/api/payment'
import type { CardDetailsInput, CheckoutDTO, TransactionReceiptDTO } from '@/types/payment'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'

function formatMoney(n: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(n)
  } catch {
    return `$${n.toFixed(2)}`
  }
}

export function CheckoutPage() {
  const { auctionId } = useParams<{ auctionId: string }>()
  const [phase, setPhase] = useState<'loading' | 'form' | 'success' | 'unavailable'>('loading')
  const [checkout, setCheckout] = useState<CheckoutDTO | null>(null)
  const [loadMessage, setLoadMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [receipt, setReceipt] = useState<TransactionReceiptDTO | null>(null)

  const [form, setForm] = useState<CardDetailsInput>({
    nameOnCard: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
  })

  const total = useMemo(() => {
    if (!checkout) return 0
    return checkout.itemPrice + checkout.shippingCost
  }, [checkout])

  useEffect(() => {
    if (!auctionId) return
    let cancelled = false
    setPhase('loading')
    setCheckout(null)
    setReceipt(null)
    setPaymentError(null)
    void getCheckoutPage(auctionId).then((res) => {
      if (cancelled) return
      if (!res.ok) {
        setPhase('unavailable')
        setLoadMessage(
          res.code === 'NOT_WINNER'
            ? 'Only the winning bidder can open checkout for this auction.'
            : 'Checkout is not available for this auction.'
        )
        return
      }
      setCheckout(res.checkout)
      setPhase('form')
    })
    return () => {
      cancelled = true
    }
  }, [auctionId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!auctionId || !checkout) return
    setPaymentError(null)
    setSubmitting(true)

    try {
      const result = await processTransaction(form, total, auctionId)
      if (!result.ok) {
        setPaymentError(result.message)
        return
      }
      setReceipt(result.receipt)
      setPhase('success')
    } catch {
      setPaymentError('Payment could not be processed. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!auctionId) {
    return (
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-10 space-y-4">
        <p className="text-gray-900 text-sm">Invalid checkout link.</p>
        <Button asChild variant="outline">
          <Link to="/">Back home</Link>
        </Button>
      </main>
    )
  }

  if (phase === 'loading') {
    return (
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-10 flex items-center gap-2 text-gray-600 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading checkout…
      </main>
    )
  }

  if (phase === 'unavailable') {
    return (
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-10 space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Link to="/" className="text-orange-600 hover:text-orange-700 font-medium">
            ← Home
          </Link>
        </div>
        <div
          role="alert"
          className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950"
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{loadMessage ?? 'Unable to load checkout.'}</span>
        </div>
        <Button asChild variant="outline">
          <Link to="/">Back home</Link>
        </Button>
      </main>
    )
  }

  if (phase === 'success' && receipt && checkout) {
    return (
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-10 space-y-6">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Link to="/" className="text-orange-600 hover:text-orange-700 font-medium">
            ← Home
          </Link>
        </div>

        <Card className="border-emerald-200 bg-emerald-50/40">
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-emerald-100 p-2">
                <CheckCircle2 className="h-6 w-6 text-emerald-700" />
              </div>
              <div>
                <CardTitle className="text-lg text-emerald-950">Payment successful</CardTitle>
                <CardDescription className="text-emerald-900/80">
                  UC5 — your bank authorized the charge; receipt below matches TransactionReceiptDTO.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Transaction</span>
              <span className="font-mono text-gray-900">{receipt.transactionId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Item</span>
              <span className="text-gray-900 text-right max-w-[14rem]">{checkout.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Amount charged</span>
              <span className="font-semibold tabular-nums text-gray-900">
                {formatMoney(receipt.amount, receipt.currency)}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Paid {new Date(receipt.paidAt).toLocaleString()} · Status {receipt.status}
            </p>
            <Button asChild className="w-full bg-orange-500 hover:bg-orange-400 text-white font-semibold mt-2">
              <Link to={`/auctions/${receipt.auctionId}`}>View auction</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  if (!checkout) {
    return (
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-10 flex items-center gap-2 text-gray-600 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading checkout…
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
        <span className="text-gray-600">Checkout</span>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-orange-100 p-2">
              <CreditCard className="h-6 w-6 text-orange-700" />
            </div>
            <div>
              <CardTitle className="text-lg">Pay for your win</CardTitle>
              <CardDescription className="mt-1">
                UC5 — Phase 1 loads item price + shipping; Phase 2 submits card details to your Payment Facade.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm font-medium text-gray-900">{checkout.title}</p>
            <p className="text-xs text-gray-500 mt-1">Auction #{checkout.auctionId}</p>
          </div>

          <div className="rounded-lg border border-stone-200 bg-stone-50/80 p-3 text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Item price</span>
              <span className="tabular-nums font-medium">{formatMoney(checkout.itemPrice, checkout.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Shipping</span>
              <span className="tabular-nums font-medium">{formatMoney(checkout.shippingCost, checkout.currency)}</span>
            </div>
            <Separator className="bg-stone-200" />
            <div className="flex justify-between text-base">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="font-bold tabular-nums text-gray-900">{formatMoney(total, checkout.currency)}</span>
            </div>
            <p className="text-xs text-gray-500 pt-1">
              Ship to: {checkout.shippingAddressSummary}
            </p>
          </div>

          <div className="flex gap-2 rounded-md border border-blue-100 bg-blue-50/80 px-3 py-2 text-xs text-blue-950">
            <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Mock form only. In production, use your payment provider’s tokenization or hosted fields — never send raw card
              data through your own server unless you are PCI compliant.
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="nameOnCard" className="text-xs font-medium text-gray-700">
                Name on card
              </label>
              <Input
                id="nameOnCard"
                autoComplete="cc-name"
                value={form.nameOnCard}
                onChange={(e) => setForm((f) => ({ ...f, nameOnCard: e.target.value }))}
                required
                placeholder="Jane Doe"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="cardNumber" className="text-xs font-medium text-gray-700">
                Card number
              </label>
              <Input
                id="cardNumber"
                inputMode="numeric"
                autoComplete="cc-number"
                value={form.cardNumber}
                onChange={(e) => setForm((f) => ({ ...f, cardNumber: e.target.value }))}
                required
                placeholder="4242 4242 4242 4242"
              />
              <p className="text-[11px] text-gray-500">
                Demo: use any 12+ digit number. Ending in <strong>0000</strong> simulates a declined card.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="expiry" className="text-xs font-medium text-gray-700">
                  Expires
                </label>
                <Input
                  id="expiry"
                  autoComplete="cc-exp"
                  value={form.expiry}
                  onChange={(e) => setForm((f) => ({ ...f, expiry: e.target.value }))}
                  required
                  placeholder="MM/YY"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="cvv" className="text-xs font-medium text-gray-700">
                  CVC
                </label>
                <Input
                  id="cvv"
                  type="password"
                  autoComplete="cc-csc"
                  value={form.cvv}
                  onChange={(e) => setForm((f) => ({ ...f, cvv: e.target.value }))}
                  required
                  placeholder="•••"
                  maxLength={4}
                />
              </div>
            </div>

            {paymentError && (
              <div
                role="alert"
                className="flex gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{paymentError}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-orange-500 hover:bg-orange-400 text-white font-semibold gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  Pay {formatMoney(total, checkout.currency)}
                </>
              )}
            </Button>
          </form>

          <Button asChild variant="ghost" className="w-full text-gray-600">
            <Link to={`/auctions/${checkout.auctionId}`}>Cancel</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
