import {
  calculateAccountMarginView,
  calculateInitialMargin,
  calculateLiquidationPrice,
  getMaxLeverage,
  isolatedAllocated,
} from "@/lib/paper-trading"
import type {
  PaperClosedTrade,
  PaperFill,
  PaperOrder,
  PaperPosition,
  PaperState,
} from "@/lib/paper-trading/types"
import type {
  AccountSnapshot,
  ClosedTrade,
  Fill,
  Order,
  TradingSnapshot,
} from "@/lib/trading/types"
import { decimal } from "@/lib/trading/types"
import {
  buildPaperClosedTrade,
  buildPaperFill,
  buildPaperOrder,
  buildPaperPosition,
} from "@/lib/trading/paper-domain"

export function mapPaperClosedTradeReason(
  reason: PaperClosedTrade["reason"]
): ClosedTrade["reason"] {
  if (reason === "tp") return "TAKE_PROFIT"
  if (reason === "sl") return "STOP_LOSS"
  if (reason === "liquidation") return "LIQUIDATION"
  if (reason === "ambiguous") return "AMBIGUOUS"
  return "MANUAL"
}

function mapPaperHistory(trade: PaperClosedTrade): ClosedTrade {
  return buildPaperClosedTrade({
    id: trade.id,
    positionId: trade.positionId,
    symbol: trade.symbol,
    side: trade.side,
    quantity: trade.quantity,
    entryPrice: trade.entryPrice,
    exitPrice: trade.exitPrice,
    realizedPnl: trade.realizedPnl,
    openedAt: trade.openedAt,
    closedAt: trade.closedAt,
    reason: mapPaperClosedTradeReason(trade.reason),
  })
}

function mapPaperPosition(position: PaperPosition, state: PaperState) {
  const marginUsed =
    position.marginMode === "ISOLATED"
      ? isolatedAllocated(position)
      : calculateInitialMargin(position.quantity, position.markPrice, position.leverage)
  const liquidationPrice = calculateLiquidationPrice(position, state)
  return buildPaperPosition({
    symbol: position.symbol,
    side: position.side,
    quantity: position.quantity,
    entryPrice: position.entryPrice,
    markPrice: position.markPrice,
    unrealizedPnl: position.unrealizedPnl,
    realizedPnl: position.realizedPnl,
    leverage: position.leverage,
    maxLeverage: getMaxLeverage(position.symbol),
    marginMode: position.marginMode,
    marginUsed,
    isolatedMargin:
      position.marginMode === "ISOLATED" ? isolatedAllocated(position) : null,
    liquidationPrice,
    stopLoss: position.stopLoss,
    takeProfit: position.takeProfit,
    openedAt: position.openedAt,
    source: position.source,
  })
}

function mapPaperFillRecord(fill: PaperFill): Fill {
  return buildPaperFill({
    id: fill.id,
    orderId: fill.orderId,
    symbol: fill.symbol,
    side: fill.side,
    size: fill.size,
    price: fill.price,
    fee: fill.fee,
    realizedPnl: fill.realizedPnl,
    createdAt: fill.createdAt,
  })
}

function mapPaperOrderRecord(order: PaperOrder, fills: readonly Fill[]): Order {
  return buildPaperOrder(
    {
      id: order.id,
      symbol: order.symbol,
      side: order.side,
      type: order.type,
      size: order.size,
      price: order.price,
      triggerPrice: order.triggerPrice,
      reduceOnly: order.reduceOnly,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      linkedPositionId: order.linkedPositionId,
      clientOrderId: order.clientOrderId,
      rejectReason: order.rejectReason,
      timeInForce: order.timeInForce,
    },
    fills
  )
}

function mapPaperAccount(state: PaperState): AccountSnapshot {
  const view = calculateAccountMarginView(state)
  return {
    providerId: "paper",
    accountId: "local-paper-account",
    status: "READY",
    balances: [
      {
        asset: "USDC",
        total: decimal(view.walletBalance),
        available: decimal(view.availableBalance),
      },
    ],
    equity: decimal(view.equity),
    availableBalance: decimal(view.availableBalance),
    initialMarginUsed: decimal(view.initialMarginUsed),
    maintenanceMarginUsed: decimal(view.maintenanceMarginRequired),
    funding: null,
    updatedAt: null,
  }
}

/** Map internal paper state into the shared trading domain snapshot. */
export function mapPaperStateToSnapshot(state: PaperState): TradingSnapshot {
  const fills = state.fills.map(mapPaperFillRecord)
  const openOrders = state.orders
    .filter(
      (order) =>
        order.status === "OPEN" ||
        order.status === "PARTIALLY_FILLED" ||
        order.status === "PENDING"
    )
    .map((order) => mapPaperOrderRecord(order, fills))
  return {
    account: mapPaperAccount(state),
    positions: state.positions.map((position) => mapPaperPosition(position, state)),
    openOrders,
    fills,
    history: state.history.map(mapPaperHistory),
  }
}
