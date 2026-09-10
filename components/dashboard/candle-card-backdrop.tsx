"use client"

import * as React from "react"

import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { useTradingSession } from "@/hooks/use-trading-session"
import {
  hyperliquidInterval,
  hyperliquidIntervalMs,
  type CandleBar,
} from "@/lib/api/candles"
import { idlePrefetch } from "@/lib/idle-prefetch"
import { requestOpenPaperTrading } from "@/lib/paper-trading/open-request"
import type { InsightSummary, Prediction } from "@/lib/api/types"
import { hyperliquidPublicMarketData } from "@/lib/trading/market-data"
import { cn } from "@/lib/utils"

type LiveCandlesState = {
  candles: CandleBar[]
  live: boolean
  symbol: string
  timeframe: string
  openTradeWorkspace: () => void
  hasDemoPosition: boolean
}

const LiveCandlesContext = React.createContext<LiveCandlesState | null>(null)

function useLiveCandlesState() {
  const ctx = React.useContext(LiveCandlesContext)
  if (!ctx) {
    throw new Error("Candle visuals must be used inside CandleMarketChrome")
  }
  return ctx
}

function CandleBackdropSvg({
  candles,
  className,
  fade = "right",
  highlightLiveEdge = true,
}: {
  candles: CandleBar[]
  className?: string
  fade?: "right" | "none"
  highlightLiveEdge?: boolean
}) {
  const uid = React.useId().replace(/:/g, "")
  if (candles.length < 2) return null

  const w = 640
  const h = 220
  const padY = 12
  const lows = candles.map((c) => c.l)
  const highs = candles.map((c) => c.h)
  const min = Math.min(...lows)
  const max = Math.max(...highs)
  const span = max - min || 1
  const slot = w / candles.length
  const bodyW = Math.max(2.5, slot * 0.55)
  const fadeId = `candle-fade-x-${uid}`
  const maskId = `candle-fade-mask-${uid}`

  const y = (price: number) =>
    padY + ((max - price) / span) * (h - padY * 2)

  const bars = candles.map((c, i) => {
    const x = i * slot + slot / 2
    const up = c.c >= c.o
    const top = y(Math.max(c.o, c.c))
    const bottom = y(Math.min(c.o, c.c))
    const bodyH = Math.max(1.5, bottom - top)
    const isLive = highlightLiveEdge && i === candles.length - 1
    const color = up ? "#10b981" : "#ef4444"
    const opacity = isLive ? 0.85 : fade === "none" ? 0.7 : 0.55
    return (
      <g key={c.t} opacity={opacity}>
        <line
          x1={x}
          x2={x}
          y1={y(c.h)}
          y2={y(c.l)}
          stroke={color}
          strokeWidth={isLive ? 1.6 : 1.25}
          strokeLinecap="round"
        />
        <rect
          x={x - bodyW / 2}
          y={top}
          width={bodyW}
          height={bodyH}
          rx={0.8}
          fill={color}
        />
      </g>
    )
  })

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className={cn("h-full w-full", className)}
      aria-hidden
    >
      {fade === "right" ? (
        <>
          <defs>
            <linearGradient id={fadeId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="white" stopOpacity="0" />
              <stop offset="22%" stopColor="white" stopOpacity="0.12" />
              <stop offset="48%" stopColor="white" stopOpacity="0.55" />
              <stop offset="100%" stopColor="white" stopOpacity="1" />
            </linearGradient>
            <mask id={maskId}>
              <rect width={w} height={h} fill={`url(#${fadeId})`} />
            </mask>
          </defs>
          <g mask={`url(#${maskId})`}>{bars}</g>
        </>
      ) : (
        <g>{bars}</g>
      )}
    </svg>
  )
}

function TradeChromeButton({
  hasPosition,
  onClick,
}: {
  hasPosition: boolean
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="xs"
      className="pointer-events-auto"
      aria-label={hasPosition ? "Open paper trading workspace" : "Trade"}
      onClick={onClick}
    >
      {hasPosition ? "1 Position" : "Trade"}
    </Button>
  )
}

function CandleMetaBadges({
  live,
  timeframe,
  pad = "strip",
  onTrade,
  hasPosition,
}: {
  live: boolean
  timeframe: string
  pad?: "content" | "strip"
  onTrade?: () => void
  hasPosition?: boolean
}) {
  const edge =
    pad === "content"
      ? "top-4 right-4 md:top-5 md:right-5"
      : "top-1.5 right-1.5"
  const bottomEdge =
    pad === "content"
      ? "right-4 bottom-4 md:right-5 md:bottom-5"
      : "right-1.5 bottom-1.5"

  return (
    <div className="pointer-events-none absolute inset-0">
      <div className={cn("absolute z-10 flex items-center gap-1.5", edge)}>
        <span className="font-mono text-[9px] leading-none tracking-wide text-muted-foreground/70 uppercase">
          {hyperliquidInterval(timeframe)}
        </span>
        {onTrade ? (
          <TradeChromeButton
            hasPosition={Boolean(hasPosition)}
            onClick={onTrade}
          />
        ) : null}
      </div>
      {live ? (
        <span
          className={cn(
            "pointer-events-none absolute inline-flex items-center gap-1 rounded-full bg-background/55 px-1.5 py-0.5 text-[9px] font-medium tracking-wide text-muted-foreground uppercase backdrop-blur-sm",
            bottomEdge
          )}
        >
          <span
            className="size-1.5 animate-pulse rounded-full bg-emerald-500"
            aria-hidden
          />
          Live
        </span>
      ) : null}
    </div>
  )
}

function CandleMarketChrome({
  symbol,
  timeframe,
  summary: _summary = null,
  prediction: _prediction = null,
  children,
}: {
  symbol: string
  timeframe: string
  summary?: InsightSummary | null
  prediction?: Prediction | null
  children: React.ReactNode
}) {
  const [candles, setCandles] = React.useState<CandleBar[]>([])
  const [live, setLive] = React.useState(false)
  const { isAuthenticated } = useAuth()
  const trading = useTradingSession({ mode: "demo", isAuthenticated })
  const reconcileMarket = trading.reconcileMarket

  React.useEffect(() => {
    return idlePrefetch(() =>
      import("@/components/paper-trading/paper-trading-workspace")
    )
  }, [])

  React.useEffect(() => {
    return hyperliquidPublicMarketData.subscribeCandles({
      symbol,
      timeframe,
      limit: 56,
      onCandles: setCandles,
      onStatus: (status) => setLive(status === "live"),
    })
  }, [symbol, timeframe])

  React.useEffect(() => {
    if (candles.length === 0) return
    reconcileMarket({
      symbol,
      bars: candles,
      intervalMs: hyperliquidIntervalMs(timeframe),
    })
  }, [candles, reconcileMarket, symbol, timeframe])

  const openTradeWorkspace = () => {
    requestOpenPaperTrading()
  }

  const value: LiveCandlesState = {
    candles,
    live,
    symbol,
    timeframe,
    openTradeWorkspace,
    hasDemoPosition: Boolean(
      trading.snapshot?.positions.some(
        (position) => position.symbol === symbol.trim().toUpperCase()
      )
    ),
  }

  return (
    <LiveCandlesContext.Provider value={value}>
      {children}
    </LiveCandlesContext.Provider>
  )
}

function CandleDesktopBackdrop({ className }: { className?: string }) {
  const {
    candles,
    live,
    timeframe,
    openTradeWorkspace,
    hasDemoPosition,
  } = useLiveCandlesState()
  if (candles.length < 2) return null

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 z-20 hidden overflow-hidden rounded-[inherit] md:block",
        className
      )}
    >
      <div className="absolute inset-y-0 right-0 w-[70%]">
        <CandleBackdropSvg candles={candles} fade="right" />
      </div>
      <CandleMetaBadges
        live={live}
        timeframe={timeframe}
        onTrade={openTradeWorkspace}
        hasPosition={hasDemoPosition}
        pad="content"
      />
    </div>
  )
}

function CandleMobileStrip({ className }: { className?: string }) {
  const {
    candles,
    live,
    timeframe,
    openTradeWorkspace,
    hasDemoPosition,
  } = useLiveCandlesState()
  if (candles.length < 2) return null

  return (
    <div
      className={cn(
        "relative z-10 mt-1 h-24 shrink-0 overflow-hidden rounded-lg border border-border/70 bg-background/40 md:hidden",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0">
        <CandleBackdropSvg candles={candles} fade="none" />
      </div>
      <CandleMetaBadges
        live={live}
        timeframe={timeframe}
        onTrade={openTradeWorkspace}
        hasPosition={hasDemoPosition}
      />
    </div>
  )
}

export { CandleDesktopBackdrop, CandleMarketChrome, CandleMobileStrip }
