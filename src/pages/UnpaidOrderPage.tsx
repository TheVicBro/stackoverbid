import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CreditCard, Package } from 'lucide-react'
import { getUnpaidOrder } from '@/api/auction'
import type { UnpaidOrder } from '@/types/auction'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { APP_CURRENCY } from '@/lib/currency'

function formatMoney(n: number, currency: string) {
  const code = currency || APP_CURRENCY
  try {
    return new Intl.NumberFormat('en-CA', { style: 'currency', currency: code }).format(n)
  } catch {
    return `${n.toFixed(2)} ${code}`
  }
}

export function UnpaidOrderPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const [order, setOrder] = useState<UnpaidOrder | null | undefined>(undefined)

  useEffect(() => {
    if (!orderId) {
      setOrder(null)
      return
    }
    setOrder(undefined)
    void getUnpaidOrder(orderId).then(setOrder)
  }, [orderId])

  if (!orderId) {
    return (
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-10 space-y-4">
        <p className="text-gray-900 dark:text-foreground text-sm">Invalid order link.</p>
        <Button asChild variant="outline">
          <Link to="/">Back home</Link>
        </Button>
      </main>
    )
  }

  if (order === undefined) {
    return (
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-10">
        <p className="text-gray-600 dark:text-muted-foreground text-sm">Loading order…</p>
      </main>
    )
  }

  if (order === null) {
    return (
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-10 space-y-4">
        <p className="text-gray-900 dark:text-foreground font-medium">Order not found.</p>
        <Button asChild variant="outline">
          <Link to="/">Back home</Link>
        </Button>
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
        <span className="text-gray-600 dark:text-muted-foreground">Unpaid order</span>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-orange-100 p-2 dark:bg-orange-950/50">
              <Package className="h-6 w-6 text-orange-700 dark:text-orange-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Complete your purchase</CardTitle>
              <CardDescription className="mt-1">
                Review the amount due, then continue to checkout to pay with your card and confirm shipping.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-foreground">{order.title}</p>
            <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">Order #{order.id}</p>
          </div>
          <Separator />
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-muted-foreground">Amount due</span>
            <span className="text-lg font-bold text-gray-900 dark:text-foreground tabular-nums">
              {formatMoney(order.amountDue, order.currency)}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-muted-foreground">
            Placed {new Date(order.createdAt).toLocaleString()} · Status:{' '}
            <strong className="text-amber-800 dark:text-amber-300">{order.status}</strong>
          </p>
          <Button asChild className="w-full bg-orange-500 hover:bg-orange-400 text-white font-semibold gap-2">
            <Link to={`/checkout/${order.auctionId}`}>
              <CreditCard className="h-4 w-4" />
              Pay now
            </Link>
          </Button>
          <Button asChild variant="ghost" className="w-full text-gray-600 dark:text-muted-foreground">
            <Link to={`/auctions/${order.auctionId}`}>View auction</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
