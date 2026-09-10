import type { OrderType, TriggerOrderKind } from "@/lib/trading/types"

export function triggerKindFromOrderType(type: OrderType): TriggerOrderKind {
  if (type === "STOP_LOSS") return "STOP_LOSS"
  if (type === "TAKE_PROFIT") return "TAKE_PROFIT"
  if (type === "STOP_MARKET") return "STOP_MARKET"
  return "NONE"
}

export function orderTypeFromHyperliquidLabel(label: string): {
  type: OrderType
  triggerKind: TriggerOrderKind
} {
  const normalized = label.toLowerCase()
  if (normalized.includes("take profit")) {
    return { type: "TAKE_PROFIT", triggerKind: "TAKE_PROFIT" }
  }
  if (normalized.includes("stop market")) {
    return { type: "STOP_MARKET", triggerKind: "STOP_MARKET" }
  }
  if (normalized.includes("stop")) {
    return { type: "STOP_LOSS", triggerKind: "STOP_LOSS" }
  }
  if (normalized.includes("market")) {
    return { type: "MARKET", triggerKind: "NONE" }
  }
  return { type: "LIMIT", triggerKind: "NONE" }
}
