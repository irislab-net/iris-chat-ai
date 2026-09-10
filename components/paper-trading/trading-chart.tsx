"use client"

/**
 * Trading chart adapted from OpenCharts ChartPanel (MIT) — Lightweight Charts.
 * Draft bracket placement + OpenCharts-style SL/TP drag.
 */
import * as React from "react"
import {
  ColorType,
  CrosshairMode,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts"

import {
  addDraftOverlay,
  addPositionOverlay,
  buildExecutionMarkers,
  clearPriceLines,
  tradingChartColors,
  type SlTpMap,
  type SlTpMapEntry,
} from "@/components/paper-trading/chart-overlays"
import { useChartPlaceLevel } from "@/components/paper-trading/use-chart-place-level"
import {
  useSlTpDrag,
  type SlTpLineEntry,
} from "@/components/paper-trading/use-sl-tp-drag"
import type { CandleBar } from "@/lib/api/candles"
import { decimalNumber } from "@/lib/trading/types"
import type { TradingChartProps } from "@/lib/chart/types"
import { cn } from "@/lib/utils"

function pipDigitsFor(price: number): number {
  const abs = Math.abs(price)
  if (abs >= 1000) return 2
  if (abs >= 100) return 2
  if (abs >= 1) return 4
  return 6
}

function toLwcCandles(candles: CandleBar[]) {
  return candles.map((c) => ({
    time: Math.floor(c.t / 1000) as UTCTimestamp,
    open: c.o,
    high: c.h,
    low: c.l,
    close: c.c,
  }))
}

function PaperTradingChart({
  symbol,
  timeframe,
  candles,
  positions,
  openOrders: _openOrders = [],
  fills: _fills = [],
  history,
  draft,
  interactionMode,
  liquidationPrice,
  prediction: _prediction = null,
  predictionHorizon: _predictionHorizon = "24h",
  enabledPredictionHorizons: _enabledPredictionHorizons = [],
  onPredictionHorizonChange: _onPredictionHorizonChange,
  onInteractionModeChange,
  onDraftLevelsChange,
  onModifyPosition,
  onClearLevel,
  extraOverlayLines = [],
  className,
}: TradingChartProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const chartRef = React.useRef<IChartApi | null>(null)
  const seriesRef = React.useRef<ISeriesApi<"Candlestick"> | null>(null)
  const priceLinesRef = React.useRef<
    import("lightweight-charts").IPriceLine[]
  >([])
  const slTpLinesRef = React.useRef<Map<string, SlTpLineEntry>>(new Map())
  const [chartEpoch, setChartEpoch] = React.useState(0)
  const [isDark, setIsDark] = React.useState(true)
  const [placePreview, setPlacePreview] = React.useState<{
    field: "SL" | "TP"
    price: number
    y: number
    valid: boolean
    pnlUsd: number
  } | null>(null)

  React.useEffect(() => {
    const root = document.documentElement
    const sync = () => setIsDark(root.classList.contains("dark"))
    sync()
    const obs = new MutationObserver(sync)
    obs.observe(root, { attributes: true, attributeFilter: ["class"] })
    return () => obs.disconnect()
  }, [])

  const lastClose = candles[candles.length - 1]?.c ?? 0
  const pipDigits = pipDigitsFor(lastClose)
  const colors = tradingChartColors(isDark)
  const openPosition = positions[0] ?? null
  const showDraft = draft != null && openPosition == null

  // Create chart once / on theme change
  React.useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const chart = createChart(el, {
      width: el.clientWidth,
      height: el.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: colors.bg },
        textColor: colors.text,
        fontSize: 11,
      },
      grid: {
        vertLines: { color: colors.grid },
        horzLines: { color: colors.grid },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: {
        borderVisible: true,
        borderColor: colors.border,
        scaleMargins: { top: 0.08, bottom: 0.12 },
      },
      timeScale: {
        borderVisible: true,
        borderColor: colors.border,
        timeVisible: true,
        secondsVisible: timeframe === "1m",
        rightOffset: 8,
      },
      watermark: {
        visible: true,
        text: symbol.toUpperCase(),
        fontSize: 48,
        color: colors.watermark,
        horzAlign: "center",
        vertAlign: "center",
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        mouseWheel: true,
        pinch: true,
        axisPressedMouseMove: { time: true, price: true },
        axisDoubleClickReset: { time: true, price: true },
      },
    })

    const series = chart.addCandlestickSeries({
      upColor: colors.up,
      downColor: colors.down,
      borderUpColor: colors.up,
      borderDownColor: colors.down,
      wickUpColor: colors.up,
      wickDownColor: colors.down,
      lastValueVisible: true,
      priceLineVisible: true,
      priceFormat: {
        type: "price",
        precision: pipDigits,
        minMove: Math.pow(10, -pipDigits),
      },
    })

    chartRef.current = chart
    seriesRef.current = series
    setChartEpoch((n) => n + 1)

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        chart.applyOptions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        })
      }
    })
    ro.observe(el)

    return () => {
      ro.disconnect()
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
      priceLinesRef.current = []
      slTpLinesRef.current.clear()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recreate on theme/symbol only
  }, [isDark, symbol])

  // Candle data
  React.useEffect(() => {
    const series = seriesRef.current
    if (!series || candles.length < 2) return
    series.setData(toLwcCandles(candles))
    chartRef.current?.timeScale().scrollToRealTime()
  }, [candles, chartEpoch])

  // Position / draft overlays + markers
  React.useEffect(() => {
    const series = seriesRef.current
    if (!series) return

    clearPriceLines(series, priceLinesRef.current)
    priceLinesRef.current = []
    slTpLinesRef.current.clear()

    const symbolKey = symbol.toUpperCase()

    if (openPosition) {
      addPositionOverlay(
        series,
        openPosition,
        symbolKey,
        colors,
        priceLinesRef.current,
        slTpLinesRef.current as unknown as SlTpMap,
        decimalNumber(openPosition.unrealizedPnl),
        liquidationPrice
      )
    } else if (showDraft && draft) {
      addDraftOverlay(
        series,
        draft,
        colors,
        priceLinesRef.current,
        slTpLinesRef.current as unknown as SlTpMap
      )
    }

    for (const line of extraOverlayLines) {
      priceLinesRef.current.push(
        series.createPriceLine({
          price: line.price,
          color: line.color,
          lineWidth: 2,
          lineStyle: line.lineStyle === "dotted" ? 1 : 0,
          axisLabelVisible: true,
          title: line.title,
        })
      )
    }

    const dragMap = new Map<string, SlTpLineEntry>()
    for (const [key, entry] of slTpLinesRef.current as unknown as Map<
      string,
      SlTpMapEntry
    >) {
      dragMap.set(key, {
        positionId: entry.positionId,
        field: entry.field,
        line: entry.line,
        price: entry.price,
        entryPrice: entry.entryPrice,
        quantity: entry.quantity,
        side: entry.side,
      })
    }
    slTpLinesRef.current = dragMap

    try {
      series.setMarkers(
        buildExecutionMarkers(positions, history, symbolKey)
      )
    } catch {
      /* marker times may fall outside loaded range */
    }
  }, [
    positions,
    history,
    symbol,
    colors,
    chartEpoch,
    candles,
    draft,
    openPosition,
    showDraft,
    liquidationPrice,
    extraOverlayLines,
  ])

  const placing =
    interactionMode === "placing-sl" || interactionMode === "placing-tp"

  const placeContext = React.useMemo(() => {
    if (showDraft && draft) {
      return {
        side: draft.side,
        entryPrice: draft.entryPrice,
        quantity: draft.quantity,
      }
    }
    if (openPosition) {
      return {
        side: openPosition.side,
        entryPrice: decimalNumber(openPosition.entryPrice),
        quantity: decimalNumber(openPosition.quantity),
      }
    }
    return null
  }, [showDraft, draft, openPosition])

  useChartPlaceLevel({
    containerRef,
    chartRef,
    seriesRef,
    mode: interactionMode,
    draft: showDraft ? draft : null,
    placeContext,
    colors,
    chartEpoch,
    onCommit: (field, price) => {
      let ok = false
      if (showDraft) {
        ok = onDraftLevelsChange({ [field]: price })
      } else if (openPosition) {
        ok = onModifyPosition(openPosition.id, { [field]: price })
      }
      if (ok) onInteractionModeChange("idle")
      return ok
    },
    onCancel: () => onInteractionModeChange("idle"),
    onPreview: setPlacePreview,
  })

  const dragPrice = useSlTpDrag(
    containerRef,
    chartRef,
    seriesRef,
    slTpLinesRef,
    onModifyPosition,
    onDraftLevelsChange,
    chartEpoch,
    !placing
  )

  const hud = placing ? placePreview : dragPrice
  const hudDigits = pipDigits

  const levelChips = React.useMemo(() => {
    const chips: { field: "stopLoss" | "takeProfit"; price: number }[] = []
    const source = openPosition
      ? {
          stopLoss:
            openPosition.stopLoss == null
              ? null
              : decimalNumber(openPosition.stopLoss),
          takeProfit:
            openPosition.takeProfit == null
              ? null
              : decimalNumber(openPosition.takeProfit),
        }
      : draft
        ? { stopLoss: draft.stopLoss, takeProfit: draft.takeProfit }
        : null
    if (!source) return chips
    if (source.stopLoss != null) {
      chips.push({ field: "stopLoss", price: source.stopLoss })
    }
    if (source.takeProfit != null) {
      chips.push({ field: "takeProfit", price: source.takeProfit })
    }
    return chips
  }, [openPosition, draft])

  return (
    <div className={cn("relative h-full w-full bg-background", className)}>
      <div ref={containerRef} className="h-full w-full touch-none bg-background" />
      {hud ? (
        <div
          className={cn(
            "pointer-events-none absolute left-1/2 z-20 -translate-x-1/2 rounded border bg-background/95 px-2 py-1 font-mono text-[11px] shadow-sm",
            hud.valid === false
              ? "border-destructive/60 text-muted-foreground"
              : "border-border"
          )}
          style={{ top: Math.max(8, hud.y - 36) }}
        >
          {hud.field} {hud.price.toFixed(hudDigits)} ·{" "}
          {hud.valid === false ? (
            <span className="text-destructive">invalid</span>
          ) : (
            <span
              className={
                hud.pnlUsd >= 0 ? "text-emerald-500" : "text-red-500"
              }
            >
              {hud.pnlUsd >= 0 ? "+" : ""}
              {hud.pnlUsd.toFixed(2)}
            </span>
          )}
        </div>
      ) : null}
      {!placing && levelChips.length > 0 ? (
        <div className="absolute top-2 right-2 z-20 flex flex-col gap-1">
          {levelChips.map((chip) => (
            <button
              key={chip.field}
              type="button"
              className="flex items-center gap-1 rounded border border-border/80 bg-background/90 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground hover:text-foreground"
              aria-label={`Remove ${chip.field === "stopLoss" ? "stop loss" : "take profit"}`}
              onClick={() => onClearLevel(chip.field)}
            >
              {chip.field === "stopLoss" ? "SL" : "TP"}{" "}
              {chip.price.toFixed(pipDigits)} ×
            </button>
          ))}
        </div>
      ) : null}
      {placing ? (
        <p className="pointer-events-none absolute top-2 left-1/2 z-20 -translate-x-1/2 rounded border border-border bg-background/90 px-2 py-1 text-[10px] text-muted-foreground">
          Click chart to set {interactionMode === "placing-sl" ? "SL" : "TP"} ·
          Esc cancel
        </p>
      ) : null}
      <p className="pointer-events-none absolute right-2 bottom-1 text-[9px] text-muted-foreground/50">
        Charting by TradingView Lightweight Charts · OpenCharts (MIT)
      </p>
    </div>
  )
}

export { PaperTradingChart }
