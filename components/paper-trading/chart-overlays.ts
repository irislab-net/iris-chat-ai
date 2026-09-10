/**
 * Position / SL / TP overlays adapted from OpenCharts ChartPanel.tsx (MIT).
 */
import {
  LineStyle,
  type IPriceLine,
  type ISeriesApi,
  type SeriesMarker,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts"

import {
  DRAFT_POSITION_ID,
  projectedPnlAt,
  type TradeDraft,
} from "@/lib/trading/draft"
import {
  decimalNumber,
  type ClosedTrade,
  type Position,
} from "@/lib/trading/types"

export type ChartColors = {
  up: string
  down: string
  tpLine: string
  slLine: string
  entryLong: string
  entryShort: string
  bg: string
  text: string
  grid: string
  border: string
  watermark: string
}

function pageBackground(isDark: boolean) {
  if (typeof document !== "undefined") {
    const painted = getComputedStyle(document.body).backgroundColor
    if (painted && painted !== "rgba(0, 0, 0, 0)") return painted
  }
  return isDark ? "#252525" : "#f5f5f5"
}

export function tradingChartColors(isDark: boolean): ChartColors {
  return {
    up: "#0ecb81",
    down: "#f6465d",
    tpLine: "#0ecb81",
    slLine: "#f6465d",
    entryLong: "#0ecb81",
    entryShort: "#f6465d",
    bg: pageBackground(isDark),
    text: isDark ? "#a1a1aa" : "#52525b",
    grid: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
    border: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)",
    watermark: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
  }
}

export type SlTpField = "takeProfit" | "stopLoss"

export type SlTpMapEntry = {
  line: IPriceLine
  price: number
  positionId: string
  field: SlTpField
  side: string
  entryPrice: number
  quantity: number
}

export type SlTpMap = Map<string, SlTpMapEntry>

export function clearPriceLines(
  series: ISeriesApi<"Candlestick">,
  list: IPriceLine[]
): void {
  for (const pl of list) {
    try {
      series.removePriceLine(pl)
    } catch {
      /* ignore */
    }
  }
}

function addSlTpLine(
  series: ISeriesApi<"Candlestick">,
  pos: Pick<Position, "id" | "side" | "entryPrice" | "quantity">,
  field: SlTpField,
  price: number,
  pnl: number,
  out: IPriceLine[],
  map: SlTpMap,
  colors: ChartColors
): void {
  const isTp = field === "takeProfit"
  const line = series.createPriceLine({
    price,
    color: isTp ? colors.tpLine : colors.slLine,
    lineWidth: 2,
    lineStyle: LineStyle.Dashed,
    axisLabelVisible: true,
    title: `${isTp ? "TP" : "SL"}  ${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)}`,
  })
  out.push(line)
  map.set(`${pos.id}:${isTp ? "tp" : "sl"}`, {
    line,
    price,
    positionId: pos.id,
    field,
    side: pos.side,
    entryPrice: decimalNumber(pos.entryPrice),
    quantity: decimalNumber(pos.quantity),
  })
}

export function addPositionOverlay(
  series: ISeriesApi<"Candlestick">,
  pos: Position,
  symbol: string,
  colors: ChartColors,
  out: IPriceLine[],
  map: SlTpMap,
  livePnl: number,
  liquidationPrice?: number | null
): void {
  const entryPrice = decimalNumber(pos.entryPrice)
  const markPrice = decimalNumber(pos.markPrice)
  if (pos.symbol !== symbol || !Number.isFinite(entryPrice)) return

  out.push(
    series.createPriceLine({
      price: entryPrice,
      color: pos.side === "LONG" ? colors.entryLong : colors.entryShort,
      lineWidth: 1,
      lineStyle: LineStyle.Dotted,
      axisLabelVisible: true,
      title: `${pos.side === "LONG" ? "buy" : "sell"} ${pos.quantity}`,
    })
  )

  // PnL label line at mark
  out.push(
    series.createPriceLine({
      price: markPrice,
      color: livePnl >= 0 ? colors.up : colors.down,
      lineWidth: 1,
      lineStyle: LineStyle.Solid,
      axisLabelVisible: true,
      title: `PNL ${livePnl >= 0 ? "+" : ""}$${livePnl.toFixed(2)}`,
    })
  )

  if (
    liquidationPrice != null &&
    Number.isFinite(liquidationPrice) &&
    liquidationPrice > 0
  ) {
    out.push(
      series.createPriceLine({
        price: liquidationPrice,
        color: "#f59e0b",
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: `LIQ ${liquidationPrice.toFixed(1)}`,
      })
    )
  }

  const pnlAt = (target: number) =>
    parseFloat(
      projectedPnlAt(pos.side, entryPrice, decimalNumber(pos.quantity), target).toFixed(2)
    )

  const takeProfit = pos.takeProfit == null ? null : decimalNumber(pos.takeProfit)
  const stopLoss = pos.stopLoss == null ? null : decimalNumber(pos.stopLoss)
  if (takeProfit != null && Number.isFinite(takeProfit)) {
    addSlTpLine(
      series,
      pos,
      "takeProfit",
      takeProfit,
      pnlAt(takeProfit),
      out,
      map,
      colors
    )
  }
  if (stopLoss != null && Number.isFinite(stopLoss)) {
    addSlTpLine(
      series,
      pos,
      "stopLoss",
      stopLoss,
      pnlAt(stopLoss),
      out,
      map,
      colors
    )
  }
}

/** Pre-submit draft entry + SL/TP lines (not a real position). */
export function addDraftOverlay(
  series: ISeriesApi<"Candlestick">,
  draft: TradeDraft,
  colors: ChartColors,
  out: IPriceLine[],
  map: SlTpMap
): void {
  if (!(draft.entryPrice > 0)) return

  out.push(
    series.createPriceLine({
      price: draft.entryPrice,
      color: draft.side === "LONG" ? colors.entryLong : colors.entryShort,
      lineWidth: 1,
      lineStyle: LineStyle.Dotted,
      axisLabelVisible: true,
      title: `ENTRY ${draft.side === "LONG" ? "long" : "short"} ${draft.quantity}`,
    })
  )

  const fakePos: Pick<Position, "id" | "side" | "entryPrice" | "quantity"> = {
    id: DRAFT_POSITION_ID,
    side: draft.side,
    entryPrice: String(draft.entryPrice),
    quantity: String(draft.quantity),
  }

  if (draft.takeProfit != null && Number.isFinite(draft.takeProfit)) {
    const pnl = parseFloat(
      projectedPnlAt(
        draft.side,
        draft.entryPrice,
        draft.quantity,
        draft.takeProfit
      ).toFixed(2)
    )
    addSlTpLine(
      series,
      fakePos,
      "takeProfit",
      draft.takeProfit,
      pnl,
      out,
      map,
      colors
    )
  }
  if (draft.stopLoss != null && Number.isFinite(draft.stopLoss)) {
    const pnl = parseFloat(
      projectedPnlAt(
        draft.side,
        draft.entryPrice,
        draft.quantity,
        draft.stopLoss
      ).toFixed(2)
    )
    addSlTpLine(
      series,
      fakePos,
      "stopLoss",
      draft.stopLoss,
      pnl,
      out,
      map,
      colors
    )
  }
}

export function toChartTime(ms: number): UTCTimestamp {
  return Math.floor(ms / 1000) as UTCTimestamp
}

export function buildExecutionMarkers(
  positions: Position[],
  history: ClosedTrade[],
  symbol: string
): SeriesMarker<Time>[] {
  const markers: SeriesMarker<Time>[] = []
  const key = symbol.trim().toUpperCase()

  for (const pos of positions) {
    if (pos.symbol !== key || pos.openedAt == null) continue
    const isLong = pos.side === "LONG"
    markers.push({
      time: toChartTime(pos.openedAt),
      position: isLong ? "belowBar" : "aboveBar",
      color: isLong ? "#2196F3" : "#FF9800",
      shape: isLong ? "arrowUp" : "arrowDown",
      text: isLong ? "B" : "S",
    })
  }

  for (const trade of history) {
    if (trade.symbol !== key) continue
    const isLong = trade.side === "LONG"
    markers.push({
      time: toChartTime(trade.openedAt),
      position: isLong ? "belowBar" : "aboveBar",
      color: isLong ? "#2196F3" : "#FF9800",
      shape: isLong ? "arrowUp" : "arrowDown",
      text: isLong ? "B" : "S",
    })

    const reason =
      trade.reason === "TAKE_PROFIT"
        ? "TP"
        : trade.reason === "STOP_LOSS"
          ? "SL"
          : trade.reason === "AMBIGUOUS"
            ? "?"
            : "X"
    const profit = decimalNumber(trade.realizedPnl) >= 0
    markers.push({
      time: toChartTime(trade.closedAt),
      position: profit ? "aboveBar" : "belowBar",
      color: profit ? "#0ecb81" : "#f6465d",
      shape: "circle",
      text: reason,
    })
  }

  return markers.sort((a, b) => Number(a.time) - Number(b.time))
}
