/**
 * Adapted from OpenCharts `src/pages/trading/useSlTpDrag.ts` (MIT).
 * Drag-to-edit SL/TP price lines on Lightweight Charts.
 * Extended: Pointer Events, geometry validation, draft target support.
 */
import {
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react"
import type { IChartApi, IPriceLine, ISeriesApi } from "lightweight-charts"

import {
  DRAFT_POSITION_ID,
  isValidDraftStopLoss,
  isValidDraftTakeProfit,
  snapDraftPrice,
} from "@/lib/trading/draft"
import { projectedPnlAt } from "@/lib/trading/draft"
import type { PositionSide } from "@/lib/trading/types"

export interface DragPriceState {
  price: number
  y: number
  field: "TP" | "SL"
  pnlUsd: number
  valid: boolean
}

export interface SlTpLineEntry {
  positionId: string
  field: "takeProfit" | "stopLoss"
  line: IPriceLine
  price: number
  entryPrice: number
  quantity: number
  side: string
}

export function useSlTpDrag(
  containerRef: RefObject<HTMLDivElement | null>,
  chartRef: RefObject<IChartApi | null>,
  candleSeriesRef: RefObject<ISeriesApi<"Candlestick"> | null>,
  slTpLinesRef: RefObject<Map<string, SlTpLineEntry>>,
  onModifyPosition:
    | ((
        posId: string,
        mods: { takeProfit?: number | null; stopLoss?: number | null }
      ) => boolean | void)
    | undefined,
  onModifyDraft:
    | ((mods: {
        takeProfit?: number | null
        stopLoss?: number | null
      }) => boolean)
    | undefined,
  chartEpoch: number,
  enabled = true
): DragPriceState | null {
  const dragRef = useRef<{
    active: boolean
    positionId: string
    field: "takeProfit" | "stopLoss"
    priceLine: IPriceLine
    startPrice: number
    entryPrice: number
    quantity: number
    side: string
    pointerId: number
  } | null>(null)
  const [dragPrice, setDragPrice] = useState<DragPriceState | null>(null)

  const onModifyPositionRef = useRef(onModifyPosition)
  const onModifyDraftRef = useRef(onModifyDraft)
  const enabledRef = useRef(enabled)

  useEffect(() => {
    onModifyPositionRef.current = onModifyPosition
    onModifyDraftRef.current = onModifyDraft
    enabledRef.current = enabled
  })

  useEffect(() => {
    const container = containerRef.current
    const chart = chartRef.current
    const series = candleSeriesRef.current
    if (!container || !chart || !series) return

    const SNAP_PX = 8

    const yToPrice = (clientY: number): number | null => {
      const rect = container.getBoundingClientRect()
      const y = clientY - rect.top
      const price = series.coordinateToPrice(y)
      return typeof price === "number" && Number.isFinite(price) ? price : null
    }

    const findNearestLine = (
      clientY: number
    ): { key: string; entry: SlTpLineEntry; dist: number } | null => {
      const rect = container.getBoundingClientRect()
      const mouseY = clientY - rect.top
      let closest: { key: string; entry: SlTpLineEntry; dist: number } | null =
        null

      for (const [key, entry] of slTpLinesRef.current) {
        const lineY = series.priceToCoordinate(entry.price)
        if (lineY === null || lineY === undefined) continue
        const dist = Math.abs(mouseY - (lineY as number))
        if (dist <= SNAP_PX && (!closest || dist < closest.dist)) {
          closest = { key, entry, dist }
        }
      }
      return closest
    }

    const isValid = (
      side: string,
      entryPrice: number,
      field: "takeProfit" | "stopLoss",
      price: number
    ) => {
      const ctx = { side: side as PositionSide, entryPrice }
      return field === "stopLoss"
        ? isValidDraftStopLoss(ctx, price)
        : isValidDraftTakeProfit(ctx, price)
    }

    const restoreScroll = () => {
      chart.applyOptions({
        handleScroll: {
          mouseWheel: true,
          pressedMouseMove: true,
          horzTouchDrag: true,
          vertTouchDrag: true,
        },
      })
    }

    const handlePointerDown = (e: PointerEvent) => {
      if (!enabledRef.current || e.button !== 0) return
      const nearest = findNearestLine(e.clientY)
      if (!nearest) return

      e.preventDefault()
      e.stopPropagation()
      try {
        container.setPointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }

      dragRef.current = {
        active: true,
        positionId: nearest.entry.positionId,
        field: nearest.entry.field,
        priceLine: nearest.entry.line,
        startPrice: nearest.entry.price,
        entryPrice: nearest.entry.entryPrice,
        quantity: nearest.entry.quantity,
        side: nearest.entry.side,
        pointerId: e.pointerId,
      }
      chart.applyOptions({
        handleScroll: {
          mouseWheel: true,
          pressedMouseMove: false,
          horzTouchDrag: false,
          vertTouchDrag: false,
        },
      })
      container.style.cursor = "grabbing"
    }

    const handlePointerMove = (e: PointerEvent) => {
      if (!enabledRef.current) return
      const drag = dragRef.current

      if (drag?.active) {
        const price = yToPrice(e.clientY)
        if (price !== null) {
          const rounded = snapDraftPrice(price)
          const valid = isValid(
            drag.side,
            drag.entryPrice,
            drag.field,
            rounded
          )
          drag.priceLine.applyOptions({ price: rounded })

          const pnlUsd = parseFloat(
            projectedPnlAt(
              drag.side as PositionSide,
              drag.entryPrice,
              drag.quantity,
              rounded
            ).toFixed(2)
          )

          const label = drag.field === "takeProfit" ? "TP" : "SL"
          const sign = pnlUsd >= 0 ? "+" : ""
          drag.priceLine.applyOptions({
            title: valid
              ? `${label}  ${sign}$${pnlUsd.toFixed(2)}`
              : `${label}  invalid`,
            color: valid
              ? drag.field === "takeProfit"
                ? "#0ecb81"
                : "#f6465d"
              : "#71717a",
          })

          const rect = container.getBoundingClientRect()
          setDragPrice({
            price: rounded,
            y: e.clientY - rect.top,
            field: drag.field === "takeProfit" ? "TP" : "SL",
            pnlUsd,
            valid,
          })
        }
        return
      }

      const nearest = findNearestLine(e.clientY)
      if (nearest) {
        container.style.cursor = "grab"
      } else {
        container.style.cursor = "default"
      }
    }

    const finishDrag = (e: PointerEvent) => {
      const drag = dragRef.current
      if (!drag?.active) return
      if (e.pointerId !== drag.pointerId && e.type !== "pointercancel") return

      const newPrice = yToPrice(e.clientY)
      dragRef.current = null
      setDragPrice(null)
      restoreScroll()
      container.style.cursor = "default"
      try {
        if (container.hasPointerCapture(e.pointerId)) {
          container.releasePointerCapture(e.pointerId)
        }
      } catch {
        /* ignore */
      }

      if (newPrice === null) {
        drag.priceLine.applyOptions({ price: drag.startPrice })
        return
      }
      const rounded = snapDraftPrice(newPrice)

      if (Math.abs(rounded - drag.startPrice) < 1e-12) {
        return
      }

      if (!isValid(drag.side, drag.entryPrice, drag.field, rounded)) {
        drag.priceLine.applyOptions({ price: drag.startPrice })
        const entry = slTpLinesRef.current.get(
          `${drag.positionId}:${drag.field === "takeProfit" ? "tp" : "sl"}`
        )
        if (entry) entry.price = drag.startPrice
        return
      }

      let ok = false
      if (drag.positionId === DRAFT_POSITION_ID) {
        ok = onModifyDraftRef.current?.({ [drag.field]: rounded }) ?? false
      } else {
        const result = onModifyPositionRef.current?.(drag.positionId, {
          [drag.field]: rounded,
        })
        ok = result !== false
      }

      if (!ok) {
        drag.priceLine.applyOptions({ price: drag.startPrice })
        return
      }

      const entry = slTpLinesRef.current.get(
        `${drag.positionId}:${drag.field === "takeProfit" ? "tp" : "sl"}`
      )
      if (entry) entry.price = rounded
    }

    container.addEventListener("pointerdown", handlePointerDown, true)
    container.addEventListener("pointermove", handlePointerMove)
    container.addEventListener("pointerup", finishDrag)
    container.addEventListener("pointercancel", finishDrag)
    window.addEventListener("pointerup", finishDrag)

    return () => {
      container.removeEventListener("pointerdown", handlePointerDown, true)
      container.removeEventListener("pointermove", handlePointerMove)
      container.removeEventListener("pointerup", finishDrag)
      container.removeEventListener("pointercancel", finishDrag)
      window.removeEventListener("pointerup", finishDrag)
    }
  }, [candleSeriesRef, chartEpoch, chartRef, containerRef, slTpLinesRef])

  return dragPrice
}
