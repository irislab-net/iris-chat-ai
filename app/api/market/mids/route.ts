import { fetchHyperliquidMids, hyperliquidCoin } from "@/lib/api/candles"

export const dynamic = "force-dynamic"

const DESK_SYMBOLS = ["BTC", "ETH", "XAU"] as const

/** Live mid prices for landing signals cards (desk symbols → USD). */
export async function GET() {
  try {
    const mids = await fetchHyperliquidMids()
    const prices: Record<string, number | null> = {}

    for (const symbol of DESK_SYMBOLS) {
      const coin = hyperliquidCoin(symbol)
      const price = coin ? mids[coin] : undefined
      prices[symbol] = typeof price === "number" && price > 0 ? price : null
    }

    return Response.json(
      { prices },
      {
        headers: {
          "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30",
        },
      }
    )
  } catch {
    return Response.json(
      { prices: { BTC: null, ETH: null, XAU: null } },
      { status: 502 }
    )
  }
}
