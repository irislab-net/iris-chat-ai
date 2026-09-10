import { hyperliquidIntervalMs } from "@/lib/api/candles"
import {
  getMaxLeverage,
  refreshPaperInstruments,
} from "@/lib/paper-trading"
import {
  getPaperServerSnapshot,
  getPaperSnapshot,
  paperAddIsolatedMargin,
  paperCancelOrder,
  paperChangeLeverage,
  paperClosePosition,
  paperModifyOrder,
  paperModifyPosition,
  paperOpenTrade,
  paperPlaceOrder,
  paperReconcile,
  paperReconcileAway,
  paperRemoveIsolatedMargin,
  subscribePaperStore,
} from "@/lib/paper-trading/store"
import type { PaperOrder, PaperState } from "@/lib/paper-trading/types"
import type { TradingAdapter, TradingUnsubscribe } from "@/lib/trading/adapter"
import { paperCapabilities } from "@/lib/trading/capabilities"
import { buildPaperOrder } from "@/lib/trading/paper-domain"
import { mapPaperStateToSnapshot } from "@/lib/trading/paper-snapshot"
import {
  decimalNumber,
  type AccountSnapshot,
  type ClosedTrade,
  type Fill,
  type Market,
  type MarketReconciliation,
  type Order,
  type OrderRequest,
  type OrderResult,
  type OrderUpdate,
  type Position,
  type PositionProtectionUpdate,
  type TradingCapabilities,
  type TradingError,
  type TradingSnapshot,
} from "@/lib/trading/types"

const PAPER_MARKETS: readonly Market[] = [
  {
    symbol: "ETH",
    baseAsset: "ETH",
    quoteAsset: "USD",
    status: "ACTIVE",
    priceDecimals: 2,
    sizeDecimals: 4,
    maxLeverage: getMaxLeverage("ETH"),
  },
  {
    symbol: "BTC",
    baseAsset: "BTC",
    quoteAsset: "USD",
    status: "ACTIVE",
    priceDecimals: 2,
    sizeDecimals: 5,
    maxLeverage: getMaxLeverage("BTC"),
  },
  {
    symbol: "SOL",
    baseAsset: "SOL",
    quoteAsset: "USD",
    status: "ACTIVE",
    priceDecimals: 3,
    sizeDecimals: 2,
    maxLeverage: getMaxLeverage("SOL"),
  },
  {
    symbol: "XAU",
    baseAsset: "XAU",
    quoteAsset: "USD",
    status: "ACTIVE",
    priceDecimals: 2,
    sizeDecimals: 4,
    maxLeverage: getMaxLeverage("XAU"),
  },
]

function tradingError(message: string, code: TradingError["code"] = "PROVIDER_REJECTED"): TradingError {
  return { code, message, retryable: false }
}

function mapOrderFromState(order: PaperOrder, state: PaperState): Order {
  const fills = mapPaperStateToSnapshot(state).fills
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

export function mapPaperState(state: PaperState): TradingSnapshot {
  return mapPaperStateToSnapshot(state)
}

export class PaperTradingAdapter implements TradingAdapter {
  readonly id = "paper"
  readonly mode = "demo" as const

  private snapshot = mapPaperState(getPaperSnapshot())
  private readonly serverSnapshot = mapPaperState(getPaperServerSnapshot())

  getCapabilities(): TradingCapabilities {
    return paperCapabilities()
  }

  getMarkets(): readonly Market[] {
    return PAPER_MARKETS
  }

  getSnapshot = (): TradingSnapshot => this.snapshot

  getServerSnapshot = (): TradingSnapshot => this.serverSnapshot

  getAccount(): AccountSnapshot {
    return this.snapshot.account
  }

  getPositions(): readonly Position[] {
    return this.snapshot.positions
  }

  getOpenOrders(): readonly Order[] {
    return this.snapshot.openOrders
  }

  getFills(): readonly Fill[] {
    return this.snapshot.fills
  }

  getHistory(): readonly ClosedTrade[] {
    return this.snapshot.history
  }

  async initialize(signal?: AbortSignal): Promise<void> {
    await refreshPaperInstruments(signal)
    this.refresh()
  }

  private refresh() {
    this.snapshot = mapPaperState(getPaperSnapshot())
  }

  private rejected(message: string, code?: TradingError["code"]): OrderResult {
    this.refresh()
    return { ok: false, status: "REJECTED", error: tradingError(message, code) }
  }

  async placeOrder(request: OrderRequest): Promise<OrderResult> {
    const quantity = decimalNumber(request.quantity)
    const referencePrice = decimalNumber(request.referencePrice)
    if (!(quantity > 0)) return this.rejected("Invalid order quantity", "INVALID_REQUEST")

    if (request.type === "MARKET" && (request.stopLoss != null || request.takeProfit != null)) {
      if (!(referencePrice > 0)) {
        return this.rejected("Reference price required for market order", "INVALID_REQUEST")
      }
      const result = paperOpenTrade({
        symbol: request.symbol,
        side: request.side === "BUY" ? "LONG" : "SHORT",
        quantity,
        entryPrice: referencePrice,
        stopLoss: request.stopLoss == null ? null : decimalNumber(request.stopLoss),
        takeProfit:
          request.takeProfit == null ? null : decimalNumber(request.takeProfit),
        marginMode: request.marginMode,
        leverage: request.leverage,
        source: request.source,
      })
      this.refresh()
      if (!result.ok) return this.rejected(result.error)
      const position = result.position
        ? this.snapshot.positions.find((item) => item.id === result.position!.id) ?? null
        : null
      return { ok: true, status: "ACCEPTED", order: null, position }
    }

    const result = paperPlaceOrder({
      symbol: request.symbol,
      side: request.side,
      type: request.type,
      size: quantity,
      price: request.price == null ? null : decimalNumber(request.price),
      triggerPrice:
        request.triggerPrice == null ? null : decimalNumber(request.triggerPrice),
      reduceOnly: request.reduceOnly,
      markPrice: referencePrice || undefined,
      marginMode: request.marginMode,
      leverage: request.leverage,
      source: request.source,
      clientOrderId: request.clientOrderId,
      timeInForce: request.timeInForce,
    })
    this.refresh()
    if (!result.ok) return this.rejected(result.error)
    const paperState = getPaperSnapshot()
    return {
      ok: true,
      status: "ACCEPTED",
      order: result.order ? mapOrderFromState(result.order, paperState) : null,
      position: this.snapshot.positions.find((item) => item.symbol === request.symbol) ?? null,
    }
  }

  async cancelOrder(orderId: string): Promise<OrderResult> {
    const existing = getPaperSnapshot().orders.find((order) => order.id === orderId)
    if (!existing) return this.rejected("Order not found", "ORDER_NOT_FOUND")
    const result = paperCancelOrder(orderId)
    this.refresh()
    if (!result.ok) return this.rejected(result.error)
    const paperState = getPaperSnapshot()
    const cancelled = paperState.orders.find((order) => order.id === orderId)
    return {
      ok: true,
      status: "ACCEPTED",
      order: cancelled ? mapOrderFromState(cancelled, paperState) : null,
      position: null,
    }
  }

  async modifyOrder(orderId: string, update: OrderUpdate): Promise<OrderResult> {
    const result = paperModifyOrder(orderId, {
      size: update.quantity == null ? undefined : decimalNumber(update.quantity),
      price: update.price == null ? undefined : decimalNumber(update.price),
      triggerPrice:
        update.triggerPrice == null ? undefined : decimalNumber(update.triggerPrice),
    })
    this.refresh()
    if (!result.ok) {
      return this.rejected(
        result.error,
        result.error === "Order not found" ? "ORDER_NOT_FOUND" : "PROVIDER_REJECTED"
      )
    }
    const paperState = getPaperSnapshot()
    return {
      ok: true,
      status: "ACCEPTED",
      order: result.order ? mapOrderFromState(result.order, paperState) : null,
      position: null,
    }
  }

  async closePosition(positionId: string, referencePrice?: string): Promise<OrderResult> {
    const existing = getPaperSnapshot().positions.find((position) => position.id === positionId)
    if (!existing) return this.rejected("Position not found", "POSITION_NOT_FOUND")
    const price = referencePrice == null ? existing.markPrice : decimalNumber(referencePrice)
    if (!(price > 0)) return this.rejected("Valid close price required", "INVALID_REQUEST")
    paperClosePosition(positionId, price)
    this.refresh()
    return { ok: true, status: "ACCEPTED", order: null, position: null }
  }

  async updatePositionProtection(
    positionId: string,
    update: PositionProtectionUpdate
  ): Promise<OrderResult> {
    const result = paperModifyPosition(positionId, {
      stopLoss:
        update.stopLoss === undefined
          ? undefined
          : update.stopLoss === null
            ? null
            : decimalNumber(update.stopLoss),
      takeProfit:
        update.takeProfit === undefined
          ? undefined
          : update.takeProfit === null
            ? null
            : decimalNumber(update.takeProfit),
    })
    this.refresh()
    if (!result.ok) return this.rejected(result.error)
    return {
      ok: true,
      status: "ACCEPTED",
      order: null,
      position: this.snapshot.positions.find((item) => item.id === positionId) ?? null,
    }
  }

  async updateLeverage(positionId: string, leverage: number): Promise<OrderResult> {
    const result = paperChangeLeverage(positionId, leverage)
    this.refresh()
    if (!result.ok) return this.rejected(result.error)
    return {
      ok: true,
      status: "ACCEPTED",
      order: null,
      position: this.snapshot.positions.find((item) => item.id === positionId) ?? null,
    }
  }

  async addIsolatedMargin(positionId: string, amount: string): Promise<OrderResult> {
    const result = paperAddIsolatedMargin(positionId, decimalNumber(amount))
    this.refresh()
    if (!result.ok) return this.rejected(result.error)
    return { ok: true, status: "ACCEPTED", order: null, position: this.snapshot.positions.find((item) => item.id === positionId) ?? null }
  }

  async removeIsolatedMargin(positionId: string, amount: string): Promise<OrderResult> {
    const result = paperRemoveIsolatedMargin(positionId, decimalNumber(amount))
    this.refresh()
    if (!result.ok) return this.rejected(result.error)
    return { ok: true, status: "ACCEPTED", order: null, position: this.snapshot.positions.find((item) => item.id === positionId) ?? null }
  }

  reconcileMarket(input: MarketReconciliation): void {
    paperReconcile(input.symbol, input.bars, input.intervalMs)
    this.refresh()
  }

  async reconcileAway(symbol: string, signal?: AbortSignal): Promise<void> {
    await paperReconcileAway(symbol, signal)
    this.refresh()
  }

  subscribeSnapshot = (listener: () => void): TradingUnsubscribe => {
    return subscribePaperStore(() => {
      this.refresh()
      listener()
    })
  }

  subscribeAccount(listener: (account: AccountSnapshot) => void): TradingUnsubscribe {
    return this.subscribeSnapshot(() => listener(this.snapshot.account))
  }

  subscribePositions(listener: (positions: readonly Position[]) => void): TradingUnsubscribe {
    return this.subscribeSnapshot(() => listener(this.snapshot.positions))
  }

  subscribeOrders(listener: (orders: readonly Order[]) => void): TradingUnsubscribe {
    return this.subscribeSnapshot(() => listener(this.snapshot.openOrders))
  }

  subscribeFills(listener: (fills: readonly Fill[]) => void): TradingUnsubscribe {
    return this.subscribeSnapshot(() => listener(this.snapshot.fills))
  }

  reconcileLive(symbol: string, bars: MarketReconciliation["bars"], timeframe: string): void {
    this.reconcileMarket({ symbol, bars, intervalMs: hyperliquidIntervalMs(timeframe) })
  }
}

let paperAdapter: PaperTradingAdapter | null = null

export function getPaperTradingAdapter(): PaperTradingAdapter {
  if (!paperAdapter) paperAdapter = new PaperTradingAdapter()
  return paperAdapter
}
