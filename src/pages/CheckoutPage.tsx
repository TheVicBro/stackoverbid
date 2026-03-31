import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AlertCircle, CheckCircle2, CreditCard, Loader2, ShieldCheck } from 'lucide-react'
import { getCheckoutPage, processTransaction } from '@/api/payment'
import type { CardDetailsInput, CheckoutDTO, PaymentReceiptDTO } from '@/types/payment'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { APP_CURRENCY } from '@/lib/currency'
import { digitsOnlyMax, formatCardExpiryInput } from '@/lib/utils'

function formatMoney(n: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-CA', { style: 'currency', currency }).format(n)
  } catch {
    return `${n.toFixed(2)} ${currency}`
  }
}

export function CheckoutPage() {
  const { auctionId } = useParams<{ auctionId: string }>()
  const [phase, setPhase] = useState<'loading' | 'form' | 'success' | 'unavailable'>('loading')
  const [checkout, setCheckout] = useState<CheckoutDTO | null>(null)
  const [loadMessage, setLoadMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [receipt, setReceipt] = useState<PaymentReceiptDTO | null>(null)
  const [expeditedShipping, setExpeditedShipping] = useState(false)

  const [form, setForm] = useState<CardDetailsInput>({
    nameOnCard: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
  })

  const total = useMemo(() => {
    if (!checkout) return 0
    const shipping = expeditedShipping ? checkout.expeditedShippingFee : 0
    return checkout.itemPrice + shipping
  }, [checkout, expeditedShipping])

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
          res.message ??
            (res.code === 'NOT_WINNER'
              ? 'Only the winning bidder can open checkout for this auction.'
              : 'Checkout is not available for this auction.')
        )
        return
      }
      setExpeditedShipping(false)
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
      const result = await processTransaction(form, auctionId, expeditedShipping)
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
        <p className="text-gray-900 dark:text-foreground text-sm">Invalid checkout link.</p>
        <Button asChild variant="outline">
          <Link to="/">Back home</Link>
        </Button>
      </main>
    )
  }

  if (phase === 'loading') {
    return (
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-10 flex items-center gap-2 text-gray-600 dark:text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading checkout…
      </main>
    )
  }

  if (phase === 'unavailable') {
    return (
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-10 space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Link to="/" className="text-orange-600 hover:text-orange-700 font-medium dark:text-orange-400 dark:hover:text-orange-300">
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

  if (phase === 'success' && receipt) {
    return (
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-10 space-y-6">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Link to="/" className="text-orange-600 hover:text-orange-700 font-medium dark:text-orange-400 dark:hover:text-orange-300">
            ← Home
          </Link>
        </div>

        <Card className="border-emerald-200 bg-emerald-50/40 dark:border-emerald-500/35 dark:bg-emerald-950/50 dark:shadow-none">
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-emerald-100 p-2 dark:bg-emerald-900/90 dark:ring-1 dark:ring-emerald-400/25">
                <CheckCircle2 className="h-6 w-6 text-emerald-700 dark:text-emerald-300" />
              </div>
              <div>
                <CardTitle className="text-lg text-emerald-950 dark:text-emerald-50">
                  Payment successful
                </CardTitle>
                <CardDescription className="text-emerald-900/80 dark:text-emerald-200/95">
                  Your order is confirmed. Keep this summary for your records.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-gray-600 dark:text-emerald-200/80 shrink-0">Order</span>
              <span className="font-mono text-gray-900 dark:text-emerald-50 text-right">#{receipt.orderId}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-gray-600 dark:text-emerald-200/80 shrink-0">Item</span>
              <span className="text-gray-900 dark:text-emerald-50 text-right max-w-[14rem]">{receipt.itemTitle}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-emerald-200/80">Amount paid</span>
              <span className="font-semibold tabular-nums text-gray-900 dark:text-emerald-50">
                {formatMoney(receipt.amountPaid, checkout?.currency ?? APP_CURRENCY)}
              </span>
            </div>
            <div className="flex justify-between gap-2 items-start">
              <span className="text-gray-600 dark:text-emerald-200/80 shrink-0">Ship to</span>
              <span className="text-gray-900 dark:text-emerald-50 text-right text-xs max-w-[16rem]">
                {receipt.shippingAddress}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-emerald-200/80">Shipping</span>
              <span className="text-gray-900 dark:text-emerald-50">
                {receipt.expeditedShipping ? 'Expedited' : 'Standard'} · est. {receipt.shippingTimeDays}{' '}
                day{receipt.shippingTimeDays === 1 ? '' : 's'}
              </span>
            </div>
            {receipt.message ? (
              <p className="text-xs text-emerald-900/90 dark:text-emerald-100 border-t border-emerald-200/60 dark:border-emerald-600/45 pt-2 whitespace-pre-wrap">
                {receipt.message}
              </p>
            ) : null}
            <p className="text-xs text-gray-500 dark:text-emerald-200/70">
              Paid {new Date(receipt.paidAt).toLocaleString()}
            </p>
            <Button asChild className="w-full bg-orange-500 hover:bg-orange-400 text-white font-semibold mt-2">
              <Link to={`/auctions/${auctionId}`}>View auction</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  if (!checkout) {
    return (
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-10 flex items-center gap-2 text-gray-600 dark:text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading checkout…
      </main>
    )
  }

  return (
    <main className="flex-1 max-w-lg mx-auto w-full px-4 py-10 space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Link to="/" className="text-orange-600 hover:text-orange-700 font-medium dark:text-orange-400 dark:hover:text-orange-300">
          ← Home
        </Link>
        <span className="text-gray-300 dark:text-muted-foreground">/</span>
        <span className="text-gray-600 dark:text-muted-foreground">Checkout</span>
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
                Pay with a card below. This checkout uses a demo payment flow — no real money is charged.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-foreground">{checkout.title}</p>
            <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">Auction #{checkout.auctionId}</p>
          </div>

          {checkout.expeditedShippingFee > 0 && (
            <label className="flex items-start gap-3 rounded-lg border border-stone-200 bg-white px-3 py-2.5 cursor-pointer dark:border-border dark:bg-card">
              <input
                type="checkbox"
                checked={expeditedShipping}
                onChange={(e) => setExpeditedShipping(e.target.checked)}
                className="mt-1 rounded border-gray-300"
              />
              <span className="text-sm">
                <span className="font-medium text-gray-900 dark:text-foreground">Expedited shipping</span>
                <span className="text-gray-600 dark:text-muted-foreground block text-xs mt-0.5">
                  Add {formatMoney(checkout.expeditedShippingFee, checkout.currency)} to your total
                </span>
              </span>
            </label>
          )}

          <div className="rounded-lg border border-stone-200 bg-stone-50/80 p-3 text-sm space-y-2 dark:border-border dark:bg-muted/40">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-muted-foreground">Winning bid (item)</span>
              <span className="tabular-nums font-medium">{formatMoney(checkout.itemPrice, checkout.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-muted-foreground">Shipping option</span>
              <span className="tabular-nums font-medium">
                {expeditedShipping
                  ? formatMoney(checkout.expeditedShippingFee, checkout.currency)
                  : formatMoney(0, checkout.currency)}
              </span>
            </div>
            <Separator className="bg-stone-200 dark:bg-border" />
            <div className="flex justify-between text-base">
              <span className="font-semibold text-gray-900 dark:text-foreground">Total</span>
              <span className="font-bold tabular-nums text-gray-900 dark:text-foreground">{formatMoney(total, checkout.currency)}</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-muted-foreground pt-1">
              Ship to: {checkout.shippingAddressSummary}
            </p>
            {!checkout.hasShippingAddress && (
              <p className="text-xs text-amber-900 dark:text-amber-100 pt-2 border-t border-amber-200/80 dark:border-amber-600/50 mt-2">
                Add a shipping address in your{' '}
                <Link
                  to="/profile"
                  className="font-semibold text-orange-700 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300 underline"
                >
                  profile
                </Link>{' '}
                before paying.
              </p>
            )}
          </div>

          <div className="flex gap-2 rounded-md border border-blue-100 bg-blue-50/80 px-3 py-2 text-xs text-blue-950">
            <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Your session is protected. Card details are sent securely; only use test card data in this demo environment.
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="nameOnCard" className="text-xs font-medium text-gray-700 dark:text-gray-300">
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
              <label htmlFor="cardNumber" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Card number
              </label>
              <Input
                id="cardNumber"
                inputMode="numeric"
                autoComplete="cc-number"
                value={form.cardNumber}
                onChange={(e) =>
                  setForm((f) => ({ ...f, cardNumber: digitsOnlyMax(e.target.value, 19) }))
                }
                required
                placeholder="4242424242424242"
                maxLength={19}
              />
              <p className="text-[11px] text-gray-500 dark:text-muted-foreground">
                13–19 digits, expiry as MM/YY, and a 3–4 digit security code (e.g. 4111 1111 1111 1111 for testing).
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="expiry" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Expires
                </label>
                <Input
                  id="expiry"
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  value={form.expiry}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, expiry: formatCardExpiryInput(e.target.value) }))
                  }
                  required
                  placeholder="MM/YY"
                  maxLength={5}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="cvv" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  CVC
                </label>
                <Input
                  id="cvv"
                  type="password"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  value={form.cvv}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, cvv: digitsOnlyMax(e.target.value, 4) }))
                  }
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

          <Button asChild variant="ghost" className="w-full text-gray-600 dark:text-muted-foreground">
            <Link to={`/auctions/${checkout.auctionId}`}>Cancel</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
