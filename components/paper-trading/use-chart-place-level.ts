/**
 * Chart-native SL/TP placement (ghost line + click to commit).
 * Complements OpenCharts useSlTpDrag which only moves existing lines.
 */
import {
  useEffect,
  useRef,
  type RefObject,
} from "react"
import {
  LineStyle,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
} from "lightweight-charts"

import type { ChartColors } from "@/components/paper-trading/chart-overlays"
import {
  isValidDraftStopLoss,
  isValidDraftTakeProfit,
  snapDraftPrice,
  type TradeDraft,
  type TradeInteractionMode,
} from "@/lib/trading/draft"
import { projectedPnlAt } from "@/lib/trading/draft"

export type PlacePreview = {
  field: "SL" | "TP"
  price: number
  y: number
  valid: boolean
  pnlUsd: number
}

type UseChartPlaceLevelArgs = {
  containerRef: RefObject<HTMLDivElement | null>
  chartRef: RefObject<IChartApi | null>
  seriesRef: RefObject<ISeriesApi<"Candlestick"> | null>
  mode: TradeInteractionMode
  draft: TradeDraft | null
  /** Open position entry context when placing onto an existing position. */
  placeContext: {
    side: TradeDraft["side"]
    entryPrice: number
    quantity: number
  } | null
  colors: ChartColors
  chartEpoch: number
  onCommit: (field: "stopLoss" | "takeProfit", price: number) => boolean
  onCancel: () => void
  onPreview: (preview: PlacePreview | null) => void
}

function restoreChartInteraction(chart: IChartApi) {
  chart.applyOptions({
    handleScroll: {
      mouseWheel: true,
      pressedMouseMove: true,
      horzTouchDrag: true,
      vertTouchDrag: true,
    },
  })
}

function disableChartPan(chart: IChartApi) {
  chart.applyOptions({
    handleScroll: {
      mouseWheel: true,
      pressedMouseMove: false,
      horzTouchDrag: false,
      vertTouchDrag: false,
    },
  })
}

export function useChartPlaceLevel({
  containerRef,
  chartRef,
  seriesRef,
  mode,
  draft,
  placeContext,
  colors,
  chartEpoch,
  onCommit,
  onCancel,
  onPreview,
}: UseChartPlaceLevelArgs): void {
  const ghostRef = useRef<IPriceLine | null>(null)
  const onCommitRef = useRef(onCommit)
  const onCancelRef = useRef(onCancel)
  const onPreviewRef = useRef(onPreview)
  const draftRef = useRef(draft)
  const placeContextRef = useRef(placeContext)
  const modeRef = useRef(mode)
  const colorsRef = useRef(colors)
  const rafRef = useRef(0)

  useEffect(() => {
    onCommitRef.current = onCommit
    onCancelRef.current = onCancel
    onPreviewRef.current = onPreview
    draftRef.current = draft
    placeContextRef.current = placeContext
    modeRef.current = mode
    colorsRef.current = colors
  })

  const placing =
    mode === "placing-sl" || mode === "placing-tp"

  useEffect(() => {
    const container = containerRef.current
    const chart = chartRef.current
    const series = seriesRef.current
    if (!container || !chart || !series) return

    const removeGhost = () => {
      if (ghostRef.current) {
        try {
          series.removePriceLine(ghostRef.current)
        } catch {
          /* ignore */
        }
        ghostRef.current = null
      }
      onPreviewRef.current(null)
      container.style.cursor = ""
      restoreChartInteraction(chart)
    }

    if (!placing) {
      removeGhost()
      return
    }

    disableChartPan(chart)
    container.style.cursor = "crosshair"

    const field = mode === "placing-sl" ? "stopLoss" : "takeProfit"
    const label = mode === "placing-sl" ? "SL" : "TP"
    const color =
      mode === "placing-sl" ? colorsRef.current.slLine : colorsRef.current.tpLine

    const ctx = () => {
      const d = draftRef.current
      if (d) {
        return {
          side: d.side,
          entryPrice: d.entryPrice,
          quantity: d.quantity,
        }
      }
      return placeContextRef.current
    }

    const isValid = (price: number) => {
      const c = ctx()
      if (!c) return false
      return field === "stopLoss"
        ? isValidDraftStopLoss(c, price)
        : isValidDraftTakeProfit(c, price)
    }

    const ensureGhost = (price: number, valid: boolean) => {
      const c = ctx()
      const pnl = c
        ? projectedPnlAt(c.side, c.entryPrice, c.quantity, price)
        : 0
      const title = valid
        ? `${label}  ${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)}`
        : `${label}  invalid`
      if (!ghostRef.current) {
        ghostRef.current = series.createPriceLine({
          price,
          color: valid ? color : "#71717a",
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title,
        })
      } else {
        ghostRef.current.applyOptions({
          price,
          color: valid ? color : "#71717a",
          title,
        })
      }
    }

    const pointerYToPrice = (clientY: number): number | null => {
      const rect = container.getBoundingClientRect()
      const y = clientY - rect.top
      const price = series.coordinateToPrice(y)
      return typeof price === "number" && Number.isFinite(price) ? price : null
    }

    const handleMove = (e: PointerEvent) => {
      if (modeRef.current !== "placing-sl" && modeRef.current !== "placing-tp") {
        return
      }
      const raw = pointerYToPrice(e.clientY)
      if (raw == null) return
      const price = snapDraftPrice(raw)
      const valid = isValid(price)
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        ensureGhost(price, valid)
        const rect = container.getBoundingClientRect()
        const c = ctx()
        onPreviewRef.current({
          field: label,
          price,
          y: e.clientY - rect.top,
          valid,
          pnlUsd: c
            ? projectedPnlAt(c.side, c.entryPrice, c.quantity, price)
            : 0,
        })
        container.style.cursor = valid ? "crosshair" : "not-allowed"
      })
    }

    const handleDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      if (modeRef.current !== "placing-sl" && modeRef.current !== "placing-tp") {
        return
      }
      e.preventDefault()
      e.stopPropagation()
      const raw = pointerYToPrice(e.clientY)
      if (raw == null) return
      const price = snapDraftPrice(raw)
      if (!isValid(price)) return
      const ok = onCommitRef.current(field, price)
      if (ok) {
        removeGhost()
      }
    }

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        removeGhost()
        onCancelRef.current()
      }
    }

    container.addEventListener("pointermove", handleMove)
    container.addEventListener("pointerdown", handleDown, true)
    window.addEventListener("keydown", handleKey)

    return () => {
      cancelAnimationFrame(rafRef.current)
      container.removeEventListener("pointermove", handleMove)
      container.removeEventListener("pointerdown", handleDown, true)
      window.removeEventListener("keydown", handleKey)
      removeGhost()
    }
  }, [
    chartEpoch,
    chartRef,
    containerRef,
    placing,
    mode,
    seriesRef,
  ])
}
