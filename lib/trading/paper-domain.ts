import type {
  ClosedTrade,
  Fill,
  Order,
  Position,
  PositionSide,
  TimeInForce,
} from "@/lib/trading/types"
import { decimal, decimalNumber } from "@/lib/trading/types"
import { deriveLiquidationStatusFromDecimals } from "@/lib/trading/liquidation-status"
import { positionIdForProvider } from "@/lib/trading/ids"
import { enrichOrderWithFills } from "@/lib/trading/order-state"
import { triggerKindFromOrderType } from "@/lib/trading/trigger-kind"

export function mapPaperOrderStatus(
  status: "OPEN" | "PARTIALLY_FILLED" | "FILLED" | "CANCELED" | "REJECTED" | "PENDING"
): Order["status"] {
  if (status === "CANCELED") return "CANCELLED"
  return status
}

export function buildPaperOrder(
  order: {
    id: string
    symbol: string
    side: Order["side"]
    type: Order["type"]
    size: number
    price: number | null
    triggerPrice: number | null
    reduceOnly: boolean
    status: "OPEN" | "PARTIALLY_FILLED" | "FILLED" | "CANCELED" | "REJECTED" | "PENDING"
    createdAt: number
    updatedAt: number
    linkedPositionId: string | null
    clientOrderId?: string | null
    rejectReason?: string
    timeInForce?: TimeInForce
  },
  fills: readonly Fill[]
): Order {
  const base: Order = {
    id: order.id,
    exchangeOrderId: null,
    clientOrderId: order.clientOrderId ?? null,
    symbol: order.symbol,
    side: order.side,
    type: order.type,
    triggerKind: triggerKindFromOrderType(order.type),
    status: mapPaperOrderStatus(order.status),
    quantity: decimal(order.size),
    filledQuantity: "0",
    averageFillPrice: null,
    price: order.price == null ? null : decimal(order.price),
    triggerPrice: order.triggerPrice == null ? null : decimal(order.triggerPrice),
    timeInForce: order.timeInForce ?? (order.type === "MARKET" ? "FRONTEND_MARKET" : "GTC"),
    reduceOnly: order.reduceOnly,
    linkedPositionId: order.linkedPositionId,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    rejectionReason: order.rejectReason ?? null,
  }
  return enrichOrderWithFills(base, fills)
}

export function buildPaperPosition(input: {
  symbol: string
  side: PositionSide
  quantity: number
  entryPrice: number
  markPrice: number
  unrealizedPnl: number
  realizedPnl: number
  leverage: number
  maxLeverage: number
  marginMode: Position["marginMode"]
  marginUsed: number
  isolatedMargin: number | null
  liquidationPrice: number | null
  stopLoss: number | null
  takeProfit: number | null
  openedAt: number | null
  source?: Position["source"]
  liquidated?: boolean
}): Position {
  const liquidationPrice =
    input.liquidationPrice != null && Number.isFinite(input.liquidationPrice)
      ? decimal(input.liquidationPrice)
      : null
  return {
    id: positionIdForProvider("paper", input.symbol),
    symbol: input.symbol,
    side: input.side,
    quantity: decimal(input.quantity),
    entryPrice: decimal(input.entryPrice),
    markPrice: decimal(input.markPrice),
    unrealizedPnl: decimal(input.unrealizedPnl),
    realizedPnl: decimal(input.realizedPnl),
    leverage: { value: input.leverage, max: input.maxLeverage },
    marginMode: input.marginMode,
    marginUsed: decimal(input.marginUsed),
    isolatedMargin:
      input.isolatedMargin == null ? null : decimal(input.isolatedMargin),
    liquidationPrice,
    liquidationStatus: deriveLiquidationStatusFromDecimals({
      side: input.side,
      markPrice: decimal(input.markPrice),
      liquidationPrice,
      liquidated: input.liquidated,
    }),
    stopLoss: input.stopLoss == null ? null : decimal(input.stopLoss),
    takeProfit: input.takeProfit == null ? null : decimal(input.takeProfit),
    openedAt: input.openedAt,
    source: input.source,
  }
}

export function buildPaperFill(fill: {
  id: string
  orderId: string
  symbol: string
  side: Order["side"]
  size: number
  price: number
  fee: number
  realizedPnl: number
  createdAt: number
}): Fill {
  return {
    id: fill.id,
    orderId: fill.orderId,
    exchangeTradeId: null,
    symbol: fill.symbol,
    side: fill.side,
    quantity: decimal(fill.size),
    price: decimal(fill.price),
    fee: decimal(fill.fee),
    feeAsset: "USDC",
    realizedPnl: decimal(fill.realizedPnl),
    createdAt: fill.createdAt,
  }
}

export function buildPaperClosedTrade(trade: {
  id: string
  positionId: string
  symbol: string
  side: PositionSide
  quantity: number
  entryPrice: number
  exitPrice: number
  realizedPnl: number
  openedAt: number
  closedAt: number
  reason: ClosedTrade["reason"]
}): ClosedTrade {
  return {
    id: trade.id,
    positionId: trade.positionId,
    symbol: trade.symbol,
    side: trade.side,
    quantity: decimal(trade.quantity),
    entryPrice: decimal(trade.entryPrice),
    exitPrice: decimal(trade.exitPrice),
    realizedPnl: decimal(trade.realizedPnl),
    openedAt: trade.openedAt,
    closedAt: trade.closedAt,
    reason: trade.reason,
  }
}

export function closedTradesFromFills(fills: readonly Fill[]): ClosedTrade[] {
  return fills
    .filter((fill) => Math.abs(decimalNumber(fill.realizedPnl)) > 0)
    .map((fill) => ({
      id: `closed:${fill.id}`,
      positionId: positionIdForProvider("hyperliquid", fill.symbol),
      symbol: fill.symbol,
      side: fill.side === "BUY" ? ("LONG" as const) : ("SHORT" as const),
      quantity: fill.quantity,
      entryPrice: fill.price,
      exitPrice: fill.price,
      realizedPnl: fill.realizedPnl,
      openedAt: fill.createdAt,
      closedAt: fill.createdAt,
      reason: "MANUAL" as const,
    }))
    .slice(0, 40)
}
