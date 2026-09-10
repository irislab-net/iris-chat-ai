"use client"

import * as React from "react"

import {
  applyPendingLevelChange,
  buildPendingLevelChange,
  createLinearPriceScale,
  findNearestDragTarget,
  projectedSlTpPnl,
  slTpFieldLabel,
  validateSlTpPrice,
  type OverlayLineDragTarget,
  type PendingLevelChange,
} from "@/lib/chart/trading-interactions"
import { snapDraftPrice } from "@/lib/trading/draft"
import type { TradeDraft } from "@/lib/trading/draft"

export type DragHudState = {
  field: "SL" | "TP"
  price: number
  y: number
  pnlUsd: number
  valid: boolean
}

type UseOverlayLineDragInput = {
  containerRef: React.RefObject<HTMLElement | null>
  targets: readonly OverlayLineDragTarget[]
  priceRange: { min: number; max: number } | null
  draft: TradeDraft | null
  enabled: boolean
  onDraftLevelsChange: (mods: {
    stopLoss?: number | null
    takeProfit?: number | null
  }) => boolean
  onModifyPosition: (
    positionId: string,
    mods: { takeProfit?: number | null; stopLoss?: number | null }
  ) => boolean
  onPendingChange: (pending: PendingLevelChange | null) => void
}

export function useOverlayLineDrag({
  containerRef,
  targets,
  priceRange,
  draft,
  enabled,
  onDraftLevelsChange,
  onModifyPosition,
  onPendingChange,
}: UseOverlayLineDragInput): DragHudState | null {
  const dragRef = React.useRef<{
    target: OverlayLineDragTarget
    pointerId: number
    startPrice: number
  } | null>(null)
  const [hud, setHud] = React.useState<DragHudState | null>(null)

  React.useEffect(() => {
    const container = containerRef.current
    if (!container || !enabled || !priceRange) return

    const scale = createLinearPriceScale(container.clientHeight, priceRange)
    const priceFromClientY = (clientY: number) => {
      const rect = container.getBoundingClientRect()
      return scale.priceFromY(clientY - rect.top)
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return
      const nearest = findNearestDragTarget(
        event.clientY,
        container.getBoundingClientRect().top,
        targets,
        (price) => scale.yFromPrice(price)
      )
      if (!nearest) return

      event.preventDefault()
      event.stopPropagation()
      try {
        container.setPointerCapture(event.pointerId)
      } catch {
        /* ignore */
      }
      dragRef.current = {
        target: nearest,
        pointerId: event.pointerId,
        startPrice: nearest.price,
      }
      container.style.cursor = "grabbing"
    }

    const handlePointerMove = (event: PointerEvent) => {
      const drag = dragRef.current
      if (drag?.target) {
        const price = priceFromClientY(event.clientY)
        if (price == null) return
        const rounded = snapDraftPrice(price)
        const valid = validateSlTpPrice(
          drag.target.side,
          drag.target.entryPrice,
          drag.target.field,
          rounded
        )
        const pnlUsd = projectedSlTpPnl(
          drag.target.side,
          drag.target.entryPrice,
          drag.target.quantity,
          rounded
        )
        const rect = container.getBoundingClientRect()
        setHud({
          field: slTpFieldLabel(drag.target.field),
          price: rounded,
          y: event.clientY - rect.top,
          pnlUsd,
          valid,
        })
        return
      }

      const nearest = findNearestDragTarget(
        event.clientY,
        container.getBoundingClientRect().top,
        targets,
        (price) => scale.yFromPrice(price)
      )
      container.style.cursor = nearest ? "grab" : "default"
    }

    const finishDrag = (event: PointerEvent) => {
      const drag = dragRef.current
      if (!drag) return
      if (event.pointerId !== drag.pointerId && event.type !== "pointercancel") return

      dragRef.current = null
      setHud(null)
      container.style.cursor = "default"
      try {
        if (container.hasPointerCapture(event.pointerId)) {
          container.releasePointerCapture(event.pointerId)
        }
      } catch {
        /* ignore */
      }

      const price = priceFromClientY(event.clientY)
      if (price == null) return
      const pending = buildPendingLevelChange({ target: drag.target, rawPrice: price })
      if (!pending) return
      onPendingChange(pending)
    }

    container.addEventListener("pointerdown", handlePointerDown, true)
    container.addEventListener("pointermove", handlePointerMove)
    container.addEventListener("pointerup", finishDrag)
    container.addEventListener("pointercancel", finishDrag)

    return () => {
      container.removeEventListener("pointerdown", handlePointerDown, true)
      container.removeEventListener("pointermove", handlePointerMove)
      container.removeEventListener("pointerup", finishDrag)
      container.removeEventListener("pointercancel", finishDrag)
    }
  }, [
    containerRef,
    draft,
    enabled,
    onDraftLevelsChange,
    onModifyPosition,
    onPendingChange,
    priceRange,
    targets,
  ])

  return hud
}

export function commitPendingLevelChange(input: {
  pending: PendingLevelChange
  draft: TradeDraft | null
  onDraftLevelsChange: (mods: {
    stopLoss?: number | null
    takeProfit?: number | null
  }) => boolean
  onModifyPosition: (
    positionId: string,
    mods: { takeProfit?: number | null; stopLoss?: number | null }
  ) => boolean
}): boolean {
  return applyPendingLevelChange(input)
}
