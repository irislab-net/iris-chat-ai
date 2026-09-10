"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"

import { LevelChangeConfirm } from "@/components/chart/level-change-confirm"
import { PredictionHorizonPicker } from "@/components/chart/prediction-horizon-picker"
import {
  commitPendingLevelChange,
  useOverlayLineDrag,
} from "@/components/chart/use-overlay-line-drag"
import {
  buildChartOverlayModel,
  overlayLineDragTargets,
} from "@/lib/chart/overlay-model"
import { HyperliquidChartDatafeed } from "@/lib/chart/hyperliquid-datafeed"
import { getTradingViewLibraryPath } from "@/lib/chart/detect-library"
import {
  TRADINGVIEW_DISABLED_FEATURES,
  TRADINGVIEW_ENABLED_FEATURES,
  tradingViewDarkOverrides,
} from "@/lib/chart/theme"
import { timeframeToTvResolution } from "@/lib/chart/resolution"
import type { PendingLevelChange } from "@/lib/chart/trading-interactions"
import type { TradingChartProps } from "@/lib/chart/types"
import {
  commitDraftStopLoss,
  commitDraftTakeProfit,
  isValidDraftStopLoss,
  isValidDraftTakeProfit,
  isValidStopLoss,
  isValidTakeProfit,
} from "@/lib/trading/draft"
import { decimalNumber } from "@/lib/trading/types"
import { tradingViewLocale } from "@/lib/i18n/locale"
import type { TradingViewWidget } from "@/types/tradingview"
import { cn } from "@/lib/utils"

function loadTradingViewScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"))
  if (window.TradingView) return Promise.resolve()

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-iris-tv="1"]'
    )
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true })
      existing.addEventListener("error", () => reject(new Error("TV load failed")), {
        once: true,
      })
      return
    }

    const script = document.createElement("script")
    script.src = "/charting_library/charting_library.standalone.js"
    script.dataset.irisTv = "1"
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("TradingView library failed to load"))
    document.head.appendChild(script)
  })
}

function lineStyleCode(style: "solid" | "dashed" | "dotted"): number {
  if (style === "dotted") return 1
  if (style === "dashed") return 2
  return 0
}

function priceRangeFromLines(
  lines: readonly { price: number }[],
  candles: TradingChartProps["candles"]
): { min: number; max: number } | null {
  const prices = lines.map((line) => line.price)
  const lastClose = candles[candles.length - 1]?.c
  if (lastClose != null) prices.push(lastClose)
  if (prices.length === 0) return null
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const pad = (max - min) * 0.08 || max * 0.01 || 1
  return { min: min - pad, max: max + pad }
}

function TradingViewChartWidget({
  symbol,
  timeframe,
  candles,
  positions,
  openOrders,
  fills,
  history,
  draft,
  interactionMode,
  liquidationPrice,
  prediction,
  predictionHorizon = "24h",
  enabledPredictionHorizons = [],
  onPredictionHorizonChange,
  onInteractionModeChange,
  onDraftLevelsChange,
  onModifyPosition,
  onClearLevel,
  extraOverlayLines = [],
  className,
}: TradingChartProps) {
  const locale = useLocale()
  const t = useTranslations("workspace")
  const containerRef = React.useRef<HTMLDivElement>(null)
  const widgetRef = React.useRef<TradingViewWidget | null>(null)
  const shapeIdsRef = React.useRef<string[]>([])
  const datafeedRef = React.useRef<HyperliquidChartDatafeed | null>(null)
  const marksRef = React.useRef<ReturnType<typeof buildChartOverlayModel>["marks"]>([])
  const [ready, setReady] = React.useState(false)
  const [isDark, setIsDark] = React.useState(true)
  const [pendingLevel, setPendingLevel] = React.useState<PendingLevelChange | null>(null)
  const [placePreview, setPlacePreview] = React.useState<{
    field: "SL" | "TP"
    price: number
    valid: boolean
    pnlUsd: number
  } | null>(null)

  const openPosition = positions[0] ?? null
  const showDraft = draft != null && openPosition == null
  const placing =
    interactionMode === "placing-sl" || interactionMode === "placing-tp"
  const interactive = !placing

  const overlayModel = React.useMemo(() => {
    const base = buildChartOverlayModel({
      symbol,
      positions,
      openOrders,
      fills,
      history,
      draft,
      showDraft,
      openPosition,
      liquidationPrice,
      interactive,
      prediction,
    })
    if (!extraOverlayLines.length) return base
    return {
      ...base,
      lines: [...base.lines, ...extraOverlayLines],
    }
  }, [
    symbol,
    positions,
    openOrders,
    fills,
    history,
    draft,
    showDraft,
    openPosition,
    liquidationPrice,
    interactive,
    prediction,
    extraOverlayLines,
  ])

  const dragTargets = React.useMemo(
    () => overlayLineDragTargets(overlayModel.lines),
    [overlayModel.lines]
  )
  const priceRange = React.useMemo(
    () => priceRangeFromLines(overlayModel.lines, candles),
    [overlayModel.lines, candles]
  )

  // The datafeed reads marks lazily through this ref, so it only has to be
  // current by the time TradingView asks for them.
  React.useEffect(() => {
    marksRef.current = overlayModel.marks
    datafeedRef.current?.setMarksProvider(() => marksRef.current)
  }, [overlayModel.marks])

  React.useEffect(() => {
    const root = document.documentElement
    const sync = () => setIsDark(root.classList.contains("dark"))
    sync()
    const obs = new MutationObserver(sync)
    obs.observe(root, { attributes: true, attributeFilter: ["class"] })
    return () => obs.disconnect()
  }, [])

  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let disposed = false
    const datafeed = new HyperliquidChartDatafeed(() => marksRef.current)
    datafeedRef.current = datafeed

    void loadTradingViewScript()
      .then(() => {
        if (disposed || !window.TradingView) return

        const widget = new window.TradingView.widget({
          symbol: symbol.trim().toUpperCase(),
          interval: timeframeToTvResolution(timeframe),
          container,
          library_path: getTradingViewLibraryPath(),
          locale: tradingViewLocale(locale),
          disabled_features: [...TRADINGVIEW_DISABLED_FEATURES],
          enabled_features: [...TRADINGVIEW_ENABLED_FEATURES],
          fullscreen: false,
          autosize: true,
          theme: isDark ? "dark" : "light",
          timezone: "Etc/UTC",
          datafeed,
          overrides: tradingViewDarkOverrides(isDark),
          loading_screen: {
            backgroundColor: isDark ? "#0a0a0a" : "#ffffff",
            foregroundColor: isDark ? "#a1a1aa" : "#52525b",
          },
          client_id: "iris",
          user_id: "iris_public",
          load_last_chart: true,
          auto_save_delay: 5,
        })

        widgetRef.current = widget
        widget.onChartReady(() => {
          if (!disposed) setReady(true)
        })
      })
      .catch(() => {
        /* host falls back when script missing */
      })

    return () => {
      disposed = true
      datafeed.dispose()
      datafeedRef.current = null
      widgetRef.current?.remove()
      widgetRef.current = null
      shapeIdsRef.current = []
      setReady(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recreate on theme/locale
  }, [isDark, locale])

  React.useEffect(() => {
    const widget = widgetRef.current
    if (!widget || !ready) return
    const chart = widget.activeChart()
    chart.setSymbol(symbol.trim().toUpperCase())
    chart.setResolution(timeframeToTvResolution(timeframe))
  }, [symbol, timeframe, ready])

  React.useEffect(() => {
    widgetRef.current?.changeTheme(isDark ? "dark" : "light")
  }, [isDark, ready])

  React.useEffect(() => {
    const widget = widgetRef.current
    if (!widget || !ready) return
    const chart = widget.activeChart()

    for (const id of shapeIdsRef.current) {
      try {
        chart.removeEntity(id)
      } catch {
        /* ignore stale ids */
      }
    }
    shapeIdsRef.current = []

    const range = chart.getVisibleRange()
    const anchorTime = range?.from ?? Math.floor(Date.now() / 1000)

    for (const line of overlayModel.lines) {
      const id = chart.createShape(
        { time: anchorTime, price: line.price },
        {
          shape: "horizontal_line",
          lock: !line.draggable,
          disableSelection: !line.draggable,
          disableSave: true,
          disableUndo: true,
          text: line.title,
          overrides: {
            linecolor: line.color,
            linewidth: line.kind === "open-order" ? 1 : 2,
            linestyle: lineStyleCode(line.lineStyle),
            showLabel: true,
            textcolor: line.color,
          },
        }
      )
      if (id) shapeIdsRef.current.push(id)
    }
  }, [overlayModel, ready])

  const dragHud = useOverlayLineDrag({
    containerRef,
    targets: dragTargets,
    priceRange,
    draft,
    enabled: interactive && dragTargets.length > 0,
    onDraftLevelsChange,
    onModifyPosition,
    onPendingChange: setPendingLevel,
  })

  const placeContext = React.useMemo(() => {
    if (showDraft && draft) {
      return { side: draft.side, entryPrice: draft.entryPrice, quantity: draft.quantity, isDraft: true }
    }
    if (openPosition) {
      return {
        side: openPosition.side,
        entryPrice: decimalNumber(openPosition.entryPrice),
        quantity: decimalNumber(openPosition.quantity),
        isDraft: false,
        positionId: openPosition.id,
      }
    }
    return null
  }, [showDraft, draft, openPosition])

  React.useEffect(() => {
    const widget = widgetRef.current
    if (!widget || !ready || !placing || !placeContext) {
      setPlacePreview(null)
      return
    }

    const field = interactionMode === "placing-sl" ? "stopLoss" : "takeProfit"
    const label = interactionMode === "placing-sl" ? "SL" : "TP"

    const onCrosshair = (params: { price: number }) => {
      const price = params.price
      if (!(price > 0)) return
      const valid = placeContext.isDraft && draft
        ? field === "stopLoss"
          ? isValidDraftStopLoss(draft, price)
          : isValidDraftTakeProfit(draft, price)
        : field === "stopLoss"
          ? isValidStopLoss(placeContext.side, placeContext.entryPrice, price)
          : isValidTakeProfit(placeContext.side, placeContext.entryPrice, price)

      const dir = placeContext.side === "LONG" ? 1 : -1
      const pnlUsd = (price - placeContext.entryPrice) * placeContext.quantity * dir
      setPlacePreview({ field: label, price, valid, pnlUsd })
    }

    const crosshair = widget.activeChart().crossHairMoved()
    const sub = crosshair.subscribe(onCrosshair)

    const onMouseUp = (params: { price?: number }) => {
      const price = params.price ?? placePreview?.price
      if (price == null || !(price > 0)) return

      let ok = false
      if (placeContext.isDraft && draft) {
        const next =
          field === "stopLoss"
            ? commitDraftStopLoss(draft, price)
            : commitDraftTakeProfit(draft, price)
        ok = next != null && onDraftLevelsChange({ [field]: next[field] })
      } else if (placeContext.positionId) {
        ok = onModifyPosition(placeContext.positionId, { [field]: price })
      }
      if (ok) onInteractionModeChange("idle")
    }

    widget.subscribe("mouse_up", onMouseUp)
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onInteractionModeChange("idle")
    }
    window.addEventListener("keydown", onKey)

    return () => {
      sub.unsubscribe()
      widget.unsubscribe("mouse_up", onMouseUp)
      window.removeEventListener("keydown", onKey)
      setPlacePreview(null)
    }
  }, [
    ready,
    placing,
    placeContext,
    interactionMode,
    onDraftLevelsChange,
    onModifyPosition,
    onInteractionModeChange,
    placePreview?.price,
    draft,
  ])

  const levelChips = React.useMemo(() => {
    const chips: { field: "stopLoss" | "takeProfit"; price: number }[] = []
    const source = openPosition
      ? {
          stopLoss: openPosition.stopLoss == null ? null : decimalNumber(openPosition.stopLoss),
          takeProfit: openPosition.takeProfit == null ? null : decimalNumber(openPosition.takeProfit),
        }
      : draft
        ? { stopLoss: draft.stopLoss, takeProfit: draft.takeProfit }
        : null
    if (!source) return chips
    if (source.stopLoss != null) chips.push({ field: "stopLoss", price: source.stopLoss })
    if (source.takeProfit != null) chips.push({ field: "takeProfit", price: source.takeProfit })
    return chips
  }, [openPosition, draft])

  const hud = placing ? placePreview : dragHud

  return (
    <div className={cn("relative h-full w-full", className)}>
      <div ref={containerRef} className="h-full w-full" />
      {enabledPredictionHorizons.length > 0 && onPredictionHorizonChange ? (
        <PredictionHorizonPicker
          value={predictionHorizon}
          enabled={enabledPredictionHorizons}
          onChange={onPredictionHorizonChange}
        />
      ) : null}
      {hud ? (
        <div
          className={cn(
            "pointer-events-none absolute left-1/2 z-20 -translate-x-1/2 rounded border bg-background/95 px-2 py-1 font-mono text-[11px] shadow-sm",
            "top-10",
            hud.valid === false
              ? "border-destructive/60 text-muted-foreground"
              : "border-border"
          )}
          style={dragHud ? { top: Math.max(40, dragHud.y - 36) } : undefined}
        >
          {"field" in hud ? `${hud.field} ${hud.price.toFixed(2)} · ` : null}
          {hud.valid === false ? (
            <span className="text-destructive">invalid</span>
          ) : (
            <span className={hud.pnlUsd >= 0 ? "text-emerald-500" : "text-red-500"}>
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
              {chip.field === "stopLoss" ? "SL" : "TP"} {chip.price.toFixed(2)} ×
            </button>
          ))}
        </div>
      ) : null}
      {placing ? (
        <p className="pointer-events-none absolute top-10 start-1/2 z-20 -translate-x-1/2 rtl:translate-x-1/2 rounded border border-border bg-background/90 px-2 py-1 text-[10px] text-muted-foreground">
          {t("chartSetLevel", {
            level:
              interactionMode === "placing-sl"
                ? t("chartSl")
                : t("chartTp"),
          })}
        </p>
      ) : null}
      <LevelChangeConfirm
        pending={pendingLevel}
        onCancel={() => setPendingLevel(null)}
        onConfirm={() => {
          if (!pendingLevel) return
          commitPendingLevelChange({
            pending: pendingLevel,
            draft,
            onDraftLevelsChange,
            onModifyPosition,
          })
          setPendingLevel(null)
        }}
      />
      <p className="pointer-events-none absolute end-2 bottom-1 text-[9px] text-muted-foreground/50">
        {t("chartAttribution")}
      </p>
    </div>
  )
}

export { TradingViewChartWidget }
