import { DRAFT_POSITION_ID, projectedPnlAt, type TradeDraft } from "@/lib/trading/draft"
import { buildPredictionOverlay } from "@/lib/chart/prediction-overlay"
import type { ChartPredictionContract } from "@/lib/chart/prediction-contract"
import type { ChartExecutionMark, ChartOverlayLine, ChartOverlayModel } from "@/lib/chart/types"
import { decimalNumber, type ClosedTrade, type Fill, type Order, type Position } from "@/lib/trading/types"

const HL_UP = "#0ecb81"
const HL_DOWN = "#f6465d"
const HL_ENTRY_LONG = "#0ecb81"
const HL_ENTRY_SHORT = "#f6465d"
const HL_LIQ = "#f59e0b"

function pnlLabel(prefix: string, pnl: number): string {
  return `${prefix} ${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)}`
}

function addSlTpLine(
  lines: ChartOverlayLine[],
  input: {
    id: string
    price: number
    field: "stopLoss" | "takeProfit"
    pnl: number
    positionId: string
    draggable: boolean
    entryPrice: number
    quantity: number
    side: Position["side"]
  }
): void {
  lines.push({
    id: input.id,
    price: input.price,
    color: input.field === "takeProfit" ? HL_UP : HL_DOWN,
    title: pnlLabel(input.field === "takeProfit" ? "TP" : "SL", input.pnl),
    lineStyle: "dashed",
    kind: input.field === "takeProfit" ? "take-profit" : "stop-loss",
    draggable: input.draggable,
    field: input.field,
    positionId: input.positionId,
    entryPrice: input.entryPrice,
    quantity: input.quantity,
    side: input.side,
  })
}

function positionLines(
  pos: Position,
  symbol: string,
  livePnl: number,
  liquidationPrice: number | null | undefined,
  draggable: boolean
): ChartOverlayLine[] {
  const lines: ChartOverlayLine[] = []
  const key = symbol.trim().toUpperCase()
  if (pos.symbol !== key) return lines

  const entryPrice = decimalNumber(pos.entryPrice)
  const markPrice = decimalNumber(pos.markPrice)
  if (!Number.isFinite(entryPrice)) return lines

  lines.push({
    id: `${pos.id}:entry`,
    price: entryPrice,
    color: pos.side === "LONG" ? HL_ENTRY_LONG : HL_ENTRY_SHORT,
    title: `Avg entry ${entryPrice.toFixed(2)} · ${pos.quantity}`,
    lineStyle: "dotted",
    kind: "average-entry",
    entryPrice,
    quantity: decimalNumber(pos.quantity),
    side: pos.side,
  })

  lines.push({
    id: `${pos.id}:mark`,
    price: markPrice,
    color: livePnl >= 0 ? HL_UP : HL_DOWN,
    title: pnlLabel("PNL", livePnl),
    lineStyle: "solid",
    kind: "mark",
  })

  if (
    liquidationPrice != null &&
    Number.isFinite(liquidationPrice) &&
    liquidationPrice > 0
  ) {
    lines.push({
      id: `${pos.id}:liq`,
      price: liquidationPrice,
      color: HL_LIQ,
      title: `LIQ ${liquidationPrice.toFixed(1)}`,
      lineStyle: "dashed",
      kind: "liquidation",
    })
  }

  const pnlAt = (target: number) =>
    parseFloat(
      projectedPnlAt(pos.side, entryPrice, decimalNumber(pos.quantity), target).toFixed(2)
    )

  const takeProfit = pos.takeProfit == null ? null : decimalNumber(pos.takeProfit)
  const stopLoss = pos.stopLoss == null ? null : decimalNumber(pos.stopLoss)

  if (takeProfit != null && Number.isFinite(takeProfit)) {
    addSlTpLine(lines, {
      id: `${pos.id}:tp`,
      price: takeProfit,
      field: "takeProfit",
      pnl: pnlAt(takeProfit),
      positionId: pos.id,
      draggable,
      entryPrice,
      quantity: decimalNumber(pos.quantity),
      side: pos.side,
    })
  }
  if (stopLoss != null && Number.isFinite(stopLoss)) {
    addSlTpLine(lines, {
      id: `${pos.id}:sl`,
      price: stopLoss,
      field: "stopLoss",
      pnl: pnlAt(stopLoss),
      positionId: pos.id,
      draggable,
      entryPrice,
      quantity: decimalNumber(pos.quantity),
      side: pos.side,
    })
  }

  return lines
}

function draftLines(draft: TradeDraft, draggable: boolean): ChartOverlayLine[] {
  const lines: ChartOverlayLine[] = []
  if (!(draft.entryPrice > 0)) return lines

  lines.push({
    id: "draft:entry",
    price: draft.entryPrice,
    color: draft.side === "LONG" ? HL_ENTRY_LONG : HL_ENTRY_SHORT,
    title: `ENTRY ${draft.side === "LONG" ? "long" : "short"} ${draft.quantity}`,
    lineStyle: "dotted",
  })

  if (draft.takeProfit != null && Number.isFinite(draft.takeProfit)) {
    const pnl = parseFloat(
      projectedPnlAt(
        draft.side,
        draft.entryPrice,
        draft.quantity,
        draft.takeProfit
      ).toFixed(2)
    )
    addSlTpLine(lines, {
      id: "draft:tp",
      price: draft.takeProfit,
      field: "takeProfit",
      pnl,
      positionId: DRAFT_POSITION_ID,
      draggable,
      entryPrice: draft.entryPrice,
      quantity: draft.quantity,
      side: draft.side,
    })
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
    addSlTpLine(lines, {
      id: "draft:sl",
      price: draft.stopLoss,
      field: "stopLoss",
      pnl,
      positionId: DRAFT_POSITION_ID,
      draggable,
      entryPrice: draft.entryPrice,
      quantity: draft.quantity,
      side: draft.side,
    })
  }

  return lines
}

export function buildExecutionMarks(
  positions: Position[],
  history: ClosedTrade[],
  symbol: string
): ChartExecutionMark[] {
  const marks: ChartExecutionMark[] = []
  const key = symbol.trim().toUpperCase()

  for (const pos of positions) {
    if (pos.symbol !== key || pos.openedAt == null) continue
    const isLong = pos.side === "LONG"
    marks.push({
      id: `open:${pos.id}`,
      time: Math.floor(pos.openedAt / 1000),
      color: isLong ? "#2196F3" : "#FF9800",
      text: isLong ? "B" : "S",
      label: isLong ? "Buy" : "Sell",
      labelFontColor: "#ffffff",
      minSize: 14,
    })
  }

  for (const trade of history) {
    if (trade.symbol !== key) continue
    const isLong = trade.side === "LONG"
    marks.push({
      id: `hist-open:${trade.id}`,
      time: Math.floor(trade.openedAt / 1000),
      color: isLong ? "#2196F3" : "#FF9800",
      text: isLong ? "B" : "S",
      label: isLong ? "Buy" : "Sell",
      labelFontColor: "#ffffff",
      minSize: 14,
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
    marks.push({
      id: `hist-close:${trade.id}`,
      time: Math.floor(trade.closedAt / 1000),
      color: profit ? HL_UP : HL_DOWN,
      text: reason,
      label: reason,
      labelFontColor: "#ffffff",
      minSize: 14,
    })
  }

  return marks.sort((a, b) => a.time - b.time)
}

function buildFillMarks(fills: readonly Fill[], symbol: string): ChartExecutionMark[] {
  const key = symbol.trim().toUpperCase()
  return fills
    .filter((fill) => fill.symbol === key)
    .map((fill) => ({
      id: `fill:${fill.id}`,
      time: Math.floor(fill.createdAt / 1000),
      color: fill.side === "BUY" ? "#2196F3" : "#FF9800",
      text: fill.side === "BUY" ? "F" : "F",
      label: `Fill ${fill.quantity}@${fill.price}`,
      labelFontColor: "#ffffff",
      minSize: 10,
    }))
}

function buildOpenOrderLines(
  orders: readonly Order[],
  symbol: string
): ChartOverlayLine[] {
  const key = symbol.trim().toUpperCase()
  const lines: ChartOverlayLine[] = []

  for (const order of orders) {
    if (order.symbol !== key) continue
    const price =
      order.type === "LIMIT" && order.price != null
        ? decimalNumber(order.price)
        : order.triggerPrice != null
          ? decimalNumber(order.triggerPrice)
          : null
    if (price == null || !Number.isFinite(price)) continue

    lines.push({
      id: `order:${order.id}`,
      price,
      color: order.status === "PARTIALLY_FILLED" ? "#f59e0b" : "#6366f1",
      title: `${order.type} ${order.side} ${order.filledQuantity}/${order.quantity}`,
      lineStyle: "dashed",
      kind: "open-order",
    })
  }

  return lines
}

export function overlayLineDragTargets(lines: readonly ChartOverlayLine[]) {
  return lines
    .filter((line) => line.draggable && line.field && line.positionId)
    .map((line) => ({
      key: line.id,
      positionId: line.positionId!,
      field: line.field!,
      price: line.price,
      entryPrice: line.entryPrice ?? line.price,
      quantity: line.quantity ?? 1,
      side: line.side ?? ("LONG" as const),
    }))
}

/** Build engine-agnostic overlay model from trading session state. */
export function buildChartOverlayModel(input: {
  symbol: string
  positions: Position[]
  openOrders?: readonly Order[]
  fills?: readonly Fill[]
  history: ClosedTrade[]
  draft: TradeDraft | null
  showDraft: boolean
  openPosition: Position | null
  liquidationPrice?: number | null
  interactive: boolean
  prediction?: ChartPredictionContract | null
}): ChartOverlayModel {
  const lines: ChartOverlayLine[] = []
  const draggable = input.interactive

  if (input.openPosition) {
    lines.push(
      ...positionLines(
        input.openPosition,
        input.symbol,
        decimalNumber(input.openPosition.unrealizedPnl),
        input.liquidationPrice,
        draggable
      )
    )
  } else if (input.showDraft && input.draft) {
    lines.push(...draftLines(input.draft, draggable))
  }

  lines.push(...buildOpenOrderLines(input.openOrders ?? [], input.symbol))

  const predictionOverlay = buildPredictionOverlay(input.prediction ?? null)
  lines.push(...predictionOverlay.lines)

  const marks = [
    ...buildExecutionMarks(input.positions, input.history, input.symbol),
    ...buildFillMarks(input.fills ?? [], input.symbol),
    ...predictionOverlay.marks,
  ].sort((a, b) => a.time - b.time)

  return {
    lines,
    marks,
    predictedCandles: predictionOverlay.predictedCandles,
  }
}
