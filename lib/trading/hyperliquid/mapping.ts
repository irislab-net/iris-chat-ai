import type {
  AccountSnapshot,
  ClosedTrade,
  Fill,
  FundingRate,
  FundingSnapshot,
  Market,
  Order,
  Position,
  PositionSide,
  TradingSnapshot,
} from "@/lib/trading/types"
import { decimalNumber } from "@/lib/trading/types"
import { deriveLiquidationStatusFromDecimals } from "@/lib/trading/liquidation-status"
import { positionIdForProvider } from "@/lib/trading/ids"
import { deriveOrderStatus, enrichOrderWithFills } from "@/lib/trading/order-state"
import { orderTypeFromHyperliquidLabel } from "@/lib/trading/trigger-kind"
import type { HyperliquidRawSnapshot } from "@/lib/trading/hyperliquid/transport"

export class HyperliquidProtocolError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "HyperliquidProtocolError"
  }
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new HyperliquidProtocolError(`Malformed ${label}`)
  }
  return value as Record<string, unknown>
}

function array(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) throw new HyperliquidProtocolError(`Malformed ${label}`)
  return value
}

function string(value: unknown, label: string): string {
  if (typeof value !== "string") throw new HyperliquidProtocolError(`Malformed ${label}`)
  return value
}

function finiteNumber(value: unknown, label: string): number {
  const parsed = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(parsed)) throw new HyperliquidProtocolError(`Malformed ${label}`)
  return parsed
}

function nullableDecimal(value: unknown): string | null {
  return value == null ? null : string(value, "decimal")
}

function subtractDecimal(left: string, right: string): string {
  const leftNumber = Number(left)
  const rightNumber = Number(right)
  if (!Number.isFinite(leftNumber) || !Number.isFinite(rightNumber)) {
    throw new HyperliquidProtocolError("Malformed decimal")
  }
  const scale = Math.min(
    12,
    Math.max(left.split(".")[1]?.length ?? 0, right.split(".")[1]?.length ?? 0)
  )
  const fixed = (leftNumber - rightNumber).toFixed(scale)
  return fixed.includes(".") ? fixed.replace(/0+$/, "").replace(/\.$/, "") : fixed
}

export function mapHyperliquidMarkets(raw: unknown): Market[] {
  const pair = array(raw, "metaAndAssetCtxs")
  const meta = record(pair[0], "perpetual metadata")
  const universe = array(meta.universe, "market universe")
  return universe.map((item, index) => {
    const market = record(item, `market ${index}`)
    const symbol = string(market.name, "market name")
    return {
      symbol,
      baseAsset: symbol,
      quoteAsset: "USDC",
      status: market.isDelisted === true ? "UNAVAILABLE" : "ACTIVE",
      priceDecimals: null,
      sizeDecimals: finiteNumber(market.szDecimals, "size decimals"),
      maxLeverage: finiteNumber(market.maxLeverage, "max leverage"),
    }
  })
}

export function mapHyperliquidFunding(raw: unknown, updatedAt: number): FundingSnapshot | null {
  const pair = array(raw, "metaAndAssetCtxs")
  const meta = record(pair[0], "perpetual metadata")
  const contexts = array(pair[1] ?? [], "asset contexts")
  const universe = array(meta.universe, "market universe")
  const rates: FundingRate[] = universe.flatMap((item, index) => {
    const market = record(item, `market ${index}`)
    const ctx = contexts[index]
    if (!ctx || typeof ctx !== "object") return []
    const funding = (ctx as Record<string, unknown>).funding
    if (typeof funding !== "string" && typeof funding !== "number") return []
    return [
      {
        symbol: string(market.name, "market name"),
        rate: String(funding),
        updatedAt,
      },
    ]
  })
  if (rates.length === 0) return null
  return { rates, updatedAt }
}

export function mapHyperliquidAccount(
  raw: unknown,
  address: string,
  updatedAt: number,
  funding: FundingSnapshot | null = null
): AccountSnapshot {
  const envelope = record(raw, "clearinghouse state")
  const state = envelope.clearinghouseState
    ? record(envelope.clearinghouseState, "clearinghouse state")
    : envelope
  const margin = record(state.marginSummary, "margin summary")
  const accountValue = string(margin.accountValue, "account value")
  const available = string(state.withdrawable, "withdrawable balance")
  const maintenance =
    nullableDecimal(margin.crossMaintenanceMarginUsed) ??
    nullableDecimal(margin.totalMaintenanceMargin)
  return {
    providerId: "hyperliquid",
    accountId: address,
    status: "READY",
    balances: [{ asset: "USDC", total: accountValue, available }],
    equity: accountValue,
    availableBalance: available,
    initialMarginUsed: string(margin.totalMarginUsed, "margin used"),
    maintenanceMarginUsed: maintenance,
    funding,
    updatedAt,
  }
}

export function mapHyperliquidPositions(raw: unknown): Position[] {
  const envelope = record(raw, "clearinghouse state")
  const state = envelope.clearinghouseState
    ? record(envelope.clearinghouseState, "clearinghouse state")
    : envelope
  return array(state.assetPositions, "asset positions").flatMap((item, index) => {
    const wrapper = record(item, `asset position ${index}`)
    const position = record(wrapper.position, `position ${index}`)
    const signedSize = string(position.szi, "position size")
    const size = Number(signedSize)
    if (!Number.isFinite(size)) throw new HyperliquidProtocolError("Malformed position size")
    if (size === 0) return []
    const leverage = record(position.leverage, "position leverage")
    const symbol = string(position.coin, "position coin")
    const side = size > 0 ? "LONG" : "SHORT"
    const positionValue = finiteNumber(position.positionValue, "position value")
    const markPrice = String(Math.abs(positionValue / size))
    const marginMode = leverage.type === "isolated" ? "ISOLATED" : "CROSS"
    const marginUsed = string(position.marginUsed, "position margin")
    const liquidationPrice = nullableDecimal(position.liquidationPx)
    return [
      {
        id: positionIdForProvider("hyperliquid", symbol),
        symbol,
        side,
        quantity: String(Math.abs(size)),
        entryPrice: string(position.entryPx, "entry price"),
        markPrice,
        unrealizedPnl: string(position.unrealizedPnl, "unrealized pnl"),
        realizedPnl: null,
        leverage: {
          value: finiteNumber(leverage.value, "leverage value"),
          max: finiteNumber(position.maxLeverage, "max leverage"),
        },
        marginMode,
        marginUsed,
        isolatedMargin: marginMode === "ISOLATED" ? marginUsed : null,
        liquidationPrice,
        liquidationStatus: deriveLiquidationStatusFromDecimals({
          side,
          markPrice,
          liquidationPrice,
        }),
        stopLoss: null,
        takeProfit: null,
        openedAt: null,
        source: "EXTERNAL",
      } satisfies Position,
    ]
  })
}

export function mapHyperliquidOrders(raw: unknown): Order[] {
  const source = Array.isArray(raw)
    ? raw
    : array(record(raw, "open-orders update").orders, "open orders")
  return source.map((item, index) => {
    const order = record(item, `open order ${index}`)
    const quantity = string(order.origSz ?? order.sz, "order quantity")
    const remaining = string(order.sz, "remaining quantity")
    const filledQuantity = subtractDecimal(quantity, remaining)
    const exchangeId = String(finiteNumber(order.oid, "order id"))
    const isTrigger = order.isTrigger === true
    const orderTypeLabel =
      typeof order.orderType === "string" ? order.orderType : "Limit"
    const mappedType = orderTypeFromHyperliquidLabel(orderTypeLabel)
    const status = deriveOrderStatus({
      quantity,
      filledQuantity,
    })
    const base: Order = {
      id: `hl:${exchangeId}`,
      exchangeOrderId: exchangeId,
      clientOrderId: typeof order.cloid === "string" ? order.cloid : null,
      symbol: string(order.coin, "order coin"),
      side:
        order.side === "B"
          ? "BUY"
          : order.side === "A"
            ? "SELL"
            : (() => {
                throw new HyperliquidProtocolError("Malformed order side")
              })(),
      type: mappedType.type,
      triggerKind: mappedType.triggerKind,
      status,
      quantity,
      filledQuantity,
      averageFillPrice: null,
      price: nullableDecimal(order.limitPx),
      triggerPrice: isTrigger ? nullableDecimal(order.triggerPx) : null,
      timeInForce: "GTC",
      reduceOnly: order.reduceOnly === true,
      linkedPositionId: order.reduceOnly
        ? positionIdForProvider("hyperliquid", string(order.coin, "order coin"))
        : null,
      createdAt: finiteNumber(order.timestamp, "order timestamp"),
      updatedAt: finiteNumber(order.timestamp, "order timestamp"),
      rejectionReason: null,
    }
    return base
  })
}

function fillArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw
  const update = record(raw, "fills update")
  return array(update.fills, "fills")
}

export function mapHyperliquidFills(raw: unknown): Fill[] {
  return fillArray(raw).map((item, index) => {
    const fill = record(item, `fill ${index}`)
    const orderId = String(finiteNumber(fill.oid, "fill order id"))
    const tradeId = fill.tid == null ? `${fill.hash ?? "unknown"}:${index}` : String(fill.tid)
    return {
      id: `hl:${tradeId}`,
      orderId: `hl:${orderId}`,
      exchangeTradeId: tradeId,
      symbol: string(fill.coin, "fill coin"),
      side:
        fill.side === "B"
          ? "BUY"
          : fill.side === "A"
            ? "SELL"
            : (() => {
                throw new HyperliquidProtocolError("Malformed fill side")
              })(),
      quantity: string(fill.sz, "fill size"),
      price: string(fill.px, "fill price"),
      fee: string(fill.fee, "fill fee"),
      feeAsset: typeof fill.feeToken === "string" ? fill.feeToken : "USDC",
      realizedPnl: string(fill.closedPnl ?? "0", "closed pnl"),
      createdAt: finiteNumber(fill.time, "fill timestamp"),
    }
  })
}

export function mapHyperliquidClosedTrades(fills: readonly Fill[]): ClosedTrade[] {
  return fills
    .filter((fill) => Math.abs(decimalNumber(fill.realizedPnl)) > 0)
    .map((fill) => ({
      id: `hl:closed:${fill.exchangeTradeId ?? fill.id}`,
      positionId: positionIdForProvider("hyperliquid", fill.symbol),
      symbol: fill.symbol,
      side: (fill.side === "BUY" ? "LONG" : "SHORT") as PositionSide,
      quantity: fill.quantity,
      entryPrice: fill.price,
      exitPrice: fill.price,
      realizedPnl: fill.realizedPnl,
      openedAt: fill.createdAt,
      closedAt: fill.createdAt,
      reason: "MANUAL" as const,
    }))
    .slice(0, 200)
}

export function enrichHyperliquidOrders(orders: readonly Order[], fills: readonly Fill[]): Order[] {
  return orders.map((order) => enrichOrderWithFills(order, fills))
}

export function mapHyperliquidSnapshot(
  raw: HyperliquidRawSnapshot,
  address: string,
  updatedAt: number
): { markets: Market[]; snapshot: TradingSnapshot } {
  const funding = mapHyperliquidFunding(raw.metaAndAssetContexts, updatedAt)
  const fills = mapHyperliquidFills(raw.fills)
  const openOrders = enrichHyperliquidOrders(mapHyperliquidOrders(raw.openOrders), fills)
  const history = mapHyperliquidClosedTrades(fills)
  return {
    markets: mapHyperliquidMarkets(raw.metaAndAssetContexts),
    snapshot: {
      account: mapHyperliquidAccount(raw.clearinghouseState, address, updatedAt, funding),
      positions: mapHyperliquidPositions(raw.clearinghouseState),
      openOrders,
      fills,
      history,
    },
  }
}
