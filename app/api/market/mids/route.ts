import { fetchHyperliquidAssetCtxs, hyperliquidCoin } from "@/lib/api/candles"
import {
  deskInstrumentFromHlCoin,
  deskLabelFromHlCoin,
} from "@/lib/desk-markets-catalog"

export const dynamic = "force-dynamic"

const DESK_SYMBOLS = ["BTC", "ETH", "XAU"] as const

type MarketRow = {
  instrument: string
  hlCoin: string
  label: string
  quote: string
  price: number
  change24hPct: number
  volume24hUsd: number
  prevDayPx: number
  openInterestUsd: number
  fundingRate: number
}

/** Full live Hyperliquid tape for desk Markets (+ legacy mids for BTC/ETH/XAU). */
export async function GET() {
  try {
    const ctxs = await fetchHyperliquidAssetCtxs()
    const byCoin = new Map(ctxs.map((c) => [c.coin, c]))

    const markets: MarketRow[] = ctxs
      .filter((ctx) => !ctx.isDelisted)
      .map((ctx) => {
        const change24hPct =
          ctx.prevDayPx > 0
            ? ((ctx.midPx - ctx.prevDayPx) / ctx.prevDayPx) * 100
            : 0
        const mark = ctx.markPx > 0 ? ctx.markPx : ctx.midPx
        return {
          instrument: deskInstrumentFromHlCoin(ctx.coin),
          hlCoin: ctx.coin,
          label: deskLabelFromHlCoin(ctx.coin),
          quote: "USD",
          price: ctx.midPx,
          change24hPct,
          volume24hUsd: ctx.dayNtlVlm,
          prevDayPx: ctx.prevDayPx,
          openInterestUsd: ctx.openInterest * mark,
          fundingRate: ctx.funding,
        }
      })
      // Highest volume first — exchange-style default tape.
      .sort((a, b) => b.volume24hUsd - a.volume24hUsd)

    const prices: Record<string, number | null> = {}
    for (const symbol of DESK_SYMBOLS) {
      const coin = hyperliquidCoin(symbol)
      const ctx = coin ? byCoin.get(coin) : undefined
      prices[symbol] =
        ctx && Number.isFinite(ctx.midPx) && ctx.midPx > 0 ? ctx.midPx : null
    }

    return Response.json(
      { prices, markets, count: markets.length },
      {
        headers: {
          "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30",
        },
      }
    )
  } catch {
    return Response.json(
      { prices: { BTC: null, ETH: null, XAU: null }, markets: [], count: 0 },
      { status: 502 }
    )
  }
}
