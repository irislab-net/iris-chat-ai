import {
  subscribeHyperliquidCandles,
  type CandleBar,
} from "@/lib/api/candles"

export type MarketDataStatus = "connecting" | "live" | "reconnecting" | "idle"

export type CandleSubscription = {
  symbol: string
  timeframe: string
  limit?: number
  onCandles: (candles: CandleBar[]) => void
  onStatus?: (status: MarketDataStatus) => void
}

export interface MarketDataSource {
  readonly id: string
  subscribeCandles(input: CandleSubscription): () => void
}

class HyperliquidPublicMarketDataSource implements MarketDataSource {
  readonly id = "hyperliquid-public"

  subscribeCandles(input: CandleSubscription): () => void {
    return subscribeHyperliquidCandles(input)
  }
}

export const hyperliquidPublicMarketData: MarketDataSource =
  new HyperliquidPublicMarketDataSource()
