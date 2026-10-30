import {
  deskChartRangeSpec,
  fetchHyperliquidCandles,
  resolveHyperliquidCoin,
  type DeskChartRange,
} from "@/lib/api/candles"

export const dynamic = "force-dynamic"

const RANGES = new Set<DeskChartRange>(["live", "1d", "1w", "1m", "1y"])

function parseRange(value: string | null): DeskChartRange {
  if (value && RANGES.has(value as DeskChartRange)) {
    return value as DeskChartRange
  }
  return "1d"
}

/** Desk market detail candles from Hyperliquid candleSnapshot. */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const instrument = url.searchParams.get("instrument") ?? undefined
  const hlCoin = url.searchParams.get("coin") ?? undefined
  const range = parseRange(url.searchParams.get("range"))
  const coin = resolveHyperliquidCoin({ instrument, hlCoin })

  if (!coin) {
    return Response.json(
      { candles: [], range, interval: null, coin: null },
      { status: 400 }
    )
  }

  const spec = deskChartRangeSpec(range)
  const endTime = Date.now()
  const startTime = endTime - spec.lookbackMs

  try {
    const candles = await fetchHyperliquidCandles({
      coin,
      timeframe: spec.interval,
      startTime,
      endTime,
    })

    return Response.json(
      {
        candles,
        range,
        interval: spec.interval,
        coin,
        startTime,
        endTime,
      },
      {
        headers: {
          "Cache-Control":
            range === "live"
              ? "public, s-maxage=10, stale-while-revalidate=20"
              : "public, s-maxage=30, stale-while-revalidate=60",
        },
      }
    )
  } catch {
    return Response.json(
      { candles: [], range, interval: spec.interval, coin },
      { status: 502 }
    )
  }
}
