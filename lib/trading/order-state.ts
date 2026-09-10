import type { Fill, Order, OrderStatus } from "@/lib/trading/types"
import { decimal, decimalNumber } from "@/lib/trading/types"

export type OrderLifecycleInput = {
  quantity: string
  filledQuantity: string
  cancelled?: boolean
  rejected?: boolean
  pending?: boolean
}

/** Shared order status derivation — Hyperliquid semantics. */
export function deriveOrderStatus(input: OrderLifecycleInput): OrderStatus {
  if (input.rejected) return "REJECTED"
  if (input.cancelled) return "CANCELLED"
  const total = decimalNumber(input.quantity)
  const filled = decimalNumber(input.filledQuantity)
  if (total > 0 && filled >= total - 1e-12) return "FILLED"
  if (filled > 0) return "PARTIALLY_FILLED"
  if (input.pending) return "PENDING"
  return "OPEN"
}

export function sumFilledQuantity(fills: readonly Fill[], orderId: string): number {
  return fills
    .filter((fill) => fill.orderId === orderId)
    .reduce((sum, fill) => sum + decimalNumber(fill.quantity), 0)
}

/** Volume-weighted average fill price. */
export function computeAverageFillPrice(
  fills: readonly Fill[],
  orderId: string
): string | null {
  const orderFills = fills.filter((fill) => fill.orderId === orderId)
  if (orderFills.length === 0) return null
  let notional = 0
  let quantity = 0
  for (const fill of orderFills) {
    const qty = decimalNumber(fill.quantity)
    const price = decimalNumber(fill.price)
    if (!(qty > 0) || !(price > 0)) continue
    notional += qty * price
    quantity += qty
  }
  if (!(quantity > 0)) return null
  return decimal(notional / quantity)
}

export function enrichOrderWithFills(order: Order, fills: readonly Fill[]): Order {
  const fromFills = sumFilledQuantity(fills, order.id)
  const fromExchange = decimalNumber(order.filledQuantity)
  const filled = Math.max(fromFills, fromExchange)
  const filledQuantity = decimal(filled)
  const averageFillPrice = computeAverageFillPrice(fills, order.id)
  const status = deriveOrderStatus({
    quantity: order.quantity,
    filledQuantity,
    cancelled: order.status === "CANCELLED" || order.status === "CANCEL_PENDING",
    rejected: order.status === "REJECTED",
    pending: order.status === "PENDING",
  })
  return {
    ...order,
    filledQuantity,
    averageFillPrice,
    status,
  }
}

export function isTerminalOrderStatus(status: OrderStatus): boolean {
  return status === "FILLED" || status === "CANCELLED" || status === "REJECTED"
}
