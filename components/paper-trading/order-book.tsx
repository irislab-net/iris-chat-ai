"use client"

import * as React from "react"

import {
  subscribeHyperliquidOrderBook,
  type BookLevel,
  type OrderBookSnapshot,
} from "@/lib/api/order-book"
import { formatTradingPrice } from "@/lib/trading/format"
import { cn } from "@/lib/utils"

function formatSize(size: number) {
  if (size >= 1000) {
    return size.toLocaleString(undefined, { maximumFractionDigits: 1 })
  }
  if (size >= 1) {
    return size.toLocaleString(undefined, { maximumFractionDigits: 3 })
  }
  return size.toLocaleString(undefined, { maximumFractionDigits: 4 })
}

function BookRow({
  level,
  maxSize,
  side,
}: {
  level: BookLevel
  maxSize: number
  side: "bid" | "ask"
}) {
  const width = maxSize > 0 ? Math.min(100, (level.size / maxSize) * 100) : 0
  return (
    <div className="relative grid h-5 grid-cols-[1fr_1fr] items-center px-3 font-mono text-[11px] tabular-nums">
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-0 right-0",
          side === "bid" ? "bg-emerald-500/10" : "bg-red-500/10"
        )}
        style={{ width: `${width}%` }}
      />
      <span
        className={cn(
          "relative",
          side === "bid" ? "text-emerald-500" : "text-red-500"
        )}
      >
        {formatTradingPrice(level.price)}
      </span>
      <span className="relative text-right text-foreground/80">
        {formatSize(level.size)}
      </span>
    </div>
  )
}

function OrderBook({
  symbol,
  className,
  depth = 6,
}: {
  symbol: string
  className?: string
  depth?: number
}) {
  return (
    <OrderBookInner key={symbol} symbol={symbol} className={className} depth={depth} />
  )
}

function OrderBookInner({
  symbol,
  className,
  depth = 6,
}: {
  symbol: string
  className?: string
  depth?: number
}) {
  const [book, setBook] = React.useState<OrderBookSnapshot | null>(null)

  React.useEffect(() => {
    return subscribeHyperliquidOrderBook({
      symbol,
      onBook: setBook,
    })
  }, [symbol])

  const asks = React.useMemo(
    () => (book?.asks ?? []).slice(0, depth).reverse(),
    [book, depth]
  )
  const bids = React.useMemo(
    () => (book?.bids ?? []).slice(0, depth),
    [book, depth]
  )
  const maxSize = React.useMemo(() => {
    let max = 0
    for (const level of asks) max = Math.max(max, level.size)
    for (const level of bids) max = Math.max(max, level.size)
    return max
  }, [asks, bids])

  const bestAsk = book?.asks[0]?.price ?? null
  const bestBid = book?.bids[0]?.price ?? null
  const spread =
    bestAsk != null && bestBid != null ? bestAsk - bestBid : null
  const mid =
    bestAsk != null && bestBid != null ? (bestAsk + bestBid) / 2 : null

  return (
    <div
      aria-label="Order book"
      className={cn("flex shrink-0 flex-col border-b border-border/60", className)}
    >
      <div className="grid shrink-0 grid-cols-[1fr_1fr] border-b border-border/50 px-3 py-1.5 text-[10px] tracking-wide text-muted-foreground uppercase">
        <span>Price</span>
        <span className="text-right">Size</span>
      </div>
      <div className="flex flex-col">
        <div>
          {asks.length === 0 ? (
            <p className="px-2 py-3 text-[11px] text-muted-foreground">
              Loading book…
            </p>
          ) : (
            asks.map((level) => (
              <BookRow
                key={`ask-${level.price}`}
                level={level}
                maxSize={maxSize}
                side="ask"
              />
            ))
          )}
        </div>
        <div className="flex shrink-0 items-baseline justify-between border-y border-border/50 px-3 py-1.5">
          <span className="font-mono text-xs font-semibold tabular-nums">
            {mid != null ? formatTradingPrice(mid) : "—"}
          </span>
          <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
            {spread != null ? formatTradingPrice(spread) : "—"}
          </span>
        </div>
        <div>
          {bids.map((level) => (
            <BookRow
              key={`bid-${level.price}`}
              level={level}
              maxSize={maxSize}
              side="bid"
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export { OrderBook }
