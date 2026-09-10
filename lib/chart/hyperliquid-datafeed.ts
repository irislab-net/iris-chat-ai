import {
  fetchHyperliquidCandles,
  hyperliquidCoin,
  subscribeHyperliquidCandles,
  type CandleBar,
} from "@/lib/api/candles"
import type { ChartExecutionMark } from "@/lib/chart/types"
import {
  IRIS_SUPPORTED_RESOLUTIONS,
  pricescaleForSymbol,
  tvResolutionToHyperliquidInterval,
  type TvResolution,
} from "@/lib/chart/resolution"

type SymbolInfo = {
  name: string
  ticker: string
  description: string
  type: string
  session: string
  timezone: string
  exchange: string
  listed_exchange: string
  format: string
  minmov: number
  pricescale: number
  has_intraday: boolean
  has_daily: boolean
  has_weekly_and_monthly: boolean
  supported_resolutions: string[]
  volume_precision: number
  data_status: string
}

type Bar = {
  time: number
  open: number
  high: number
  low: number
  close: number
}

type PeriodParams = {
  from: number
  to: number
  countBack: number
  firstDataRequest: boolean
}

type DatafeedConfiguration = {
  supported_resolutions: string[]
  supports_marks: boolean
  supports_timescale_marks: boolean
  supports_time: boolean
}

type HistoryMeta = {
  noData?: boolean
}

type Subscription = {
  symbol: string
  resolution: string
  onTick: (bar: Bar) => void
  unsubscribe: () => void
}

function toTvBar(bar: CandleBar): Bar {
  return {
    time: bar.t,
    open: bar.o,
    high: bar.h,
    low: bar.l,
    close: bar.c,
  }
}

function barDurationMs(resolution: string): number {
  const interval = tvResolutionToHyperliquidInterval(resolution)
  const m = /^(\d+)([mhdwM])$/.exec(interval)
  if (!m) return 15 * 60 * 1000
  const n = Number(m[1])
  switch (m[2]) {
    case "m":
      return n * 60 * 1000
    case "h":
      return n * 60 * 60 * 1000
    case "d":
      return n * 24 * 60 * 60 * 1000
    case "w":
      return n * 7 * 24 * 60 * 60 * 1000
    case "M":
      return n * 30 * 24 * 60 * 60 * 1000
    default:
      return 15 * 60 * 1000
  }
}

/** Hyperliquid → TradingView Advanced Charts datafeed (IBasicDataFeed). */
export class HyperliquidChartDatafeed {
  private marksProvider: () => ChartExecutionMark[]
  private readonly subscriptions = new Map<string, Subscription>()

  constructor(marksProvider: () => ChartExecutionMark[]) {
    this.marksProvider = marksProvider
  }

  setMarksProvider(provider: () => ChartExecutionMark[]): void {
    this.marksProvider = provider
  }

  onReady(callback: (config: DatafeedConfiguration) => void): void {
    setTimeout(() => {
      callback({
        supported_resolutions: IRIS_SUPPORTED_RESOLUTIONS,
        supports_marks: true,
        supports_timescale_marks: false,
        supports_time: true,
      })
    }, 0)
  }

  resolveSymbol(
    symbolName: string,
    onResolve: (info: SymbolInfo) => void,
    _onError: (reason: string) => void
  ): void {
    const symbol = symbolName.trim().toUpperCase()
    setTimeout(() => {
      onResolve({
        name: symbol,
        ticker: symbol,
        description: `${symbol} Perpetual`,
        type: "crypto",
        session: "24x7",
        timezone: "Etc/UTC",
        exchange: "Hyperliquid",
        listed_exchange: "Hyperliquid",
        format: "price",
        minmov: 1,
        pricescale: pricescaleForSymbol(symbol),
        has_intraday: true,
        has_daily: true,
        has_weekly_and_monthly: true,
        supported_resolutions: IRIS_SUPPORTED_RESOLUTIONS,
        volume_precision: 4,
        data_status: "streaming",
      })
    }, 0)
  }

  getBars(
    symbolInfo: SymbolInfo,
    resolution: string,
    periodParams: PeriodParams,
    onResult: (bars: Bar[], meta: HistoryMeta) => void,
    onError: (reason: string) => void
  ): void {
    const coin = hyperliquidCoin(symbolInfo.name)
    if (!coin) {
      setTimeout(() => onResult([], { noData: true }), 0)
      return
    }

    const interval = tvResolutionToHyperliquidInterval(resolution)
    const fromMs = periodParams.from * 1000
    const toMs = periodParams.to * 1000
    const countBack = Math.max(periodParams.countBack, 120)

    void fetchHyperliquidCandles({
      symbol: symbolInfo.name,
      timeframe: interval,
      limit: countBack,
      startTime: fromMs > 0 ? fromMs : undefined,
      endTime: toMs > 0 ? toMs : undefined,
    })
      .then((candles) => {
        const bars = candles.map(toTvBar)
        onResult(bars, { noData: bars.length === 0 })
      })
      .catch((error) => {
        onError(error instanceof Error ? error.message : "Failed to load bars")
      })
  }

  subscribeBars(
    symbolInfo: SymbolInfo,
    resolution: string,
    onTick: (bar: Bar) => void,
    listenerGuid: string,
    _onResetCacheNeeded: () => void
  ): void {
    this.unsubscribeBars(listenerGuid)

    const interval = tvResolutionToHyperliquidInterval(resolution)
    const unsubscribe = subscribeHyperliquidCandles({
      symbol: symbolInfo.name,
      timeframe: interval,
      limit: 360,
      onCandles: (candles) => {
        const last = candles[candles.length - 1]
        if (!last) return
        onTick(toTvBar(last))
      },
    })

    this.subscriptions.set(listenerGuid, {
      symbol: symbolInfo.name,
      resolution,
      onTick,
      unsubscribe,
    })
  }

  unsubscribeBars(listenerGuid: string): void {
    const sub = this.subscriptions.get(listenerGuid)
    if (!sub) return
    sub.unsubscribe()
    this.subscriptions.delete(listenerGuid)
  }

  getMarks(
    _symbolInfo: SymbolInfo,
    from: number,
    to: number,
    onDataCallback: (marks: ChartExecutionMark[]) => void,
    _resolution: TvResolution
  ): void {
    setTimeout(() => {
      onDataCallback(
        this.marksProvider().filter((mark) => mark.time >= from && mark.time <= to)
      )
    }, 0)
  }

  searchSymbols(
    _userInput: string,
    _exchange: string,
    _symbolType: string,
    onResult: (items: unknown[]) => void
  ): void {
    setTimeout(() => onResult([]), 0)
  }

  dispose(): void {
    for (const guid of [...this.subscriptions.keys()]) {
      this.unsubscribeBars(guid)
    }
  }
}

export function barDurationMsForResolution(resolution: string): number {
  return barDurationMs(resolution)
}
