import { hyperliquidInterval } from "@/lib/api/candles"

/** TradingView resolution strings supported by IRIS. */
export type TvResolution =
  | "1"
  | "3"
  | "5"
  | "15"
  | "30"
  | "60"
  | "120"
  | "240"
  | "480"
  | "720"
  | "1D"
  | "3D"
  | "1W"
  | "1M"

const HL_TO_TV: Record<string, TvResolution> = {
  "1m": "1",
  "3m": "3",
  "5m": "5",
  "15m": "15",
  "30m": "30",
  "1h": "60",
  "2h": "120",
  "4h": "240",
  "8h": "480",
  "12h": "720",
  "1d": "1D",
  "3d": "3D",
  "1w": "1W",
  "1M": "1M",
}

const TV_TO_HL: Record<TvResolution, string> = {
  "1": "1m",
  "3": "3m",
  "5": "5m",
  "15": "15m",
  "30": "30m",
  "60": "1h",
  "120": "2h",
  "240": "4h",
  "480": "8h",
  "720": "12h",
  "1D": "1d",
  "3D": "3d",
  "1W": "1w",
  "1M": "1M",
}

export const IRIS_SUPPORTED_RESOLUTIONS: TvResolution[] = [
  "1",
  "5",
  "15",
  "30",
  "60",
  "240",
  "1D",
]

/** Map desk timeframe (e.g. 15m) → TradingView resolution (e.g. 15). */
export function timeframeToTvResolution(timeframe: string): TvResolution {
  const hl = hyperliquidInterval(timeframe)
  return HL_TO_TV[hl] ?? "15"
}

/** Map TradingView resolution → Hyperliquid interval for datafeed fetches. */
export function tvResolutionToHyperliquidInterval(resolution: string): string {
  const key = resolution as TvResolution
  return TV_TO_HL[key] ?? hyperliquidInterval(resolution)
}

export function pricescaleForSymbol(symbol: string): number {
  const key = symbol.trim().toUpperCase()
  if (key === "BTC") return 100
  if (key === "ETH") return 100
  return 10000
}
