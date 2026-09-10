/** Stable cross-mode position identifiers — one net position per symbol. */
export function positionIdForProvider(providerId: string, symbol: string): string {
  const normalized = symbol.trim().toUpperCase()
  if (providerId === "hyperliquid") return `hl:${normalized}`
  if (providerId === "paper") return `paper:${normalized}`
  return `${providerId}:${normalized}`
}

export function orderIdForProvider(
  providerId: string,
  exchangeOrderId: string | null,
  localId: string
): string {
  if (providerId === "hyperliquid" && exchangeOrderId) return `hl:${exchangeOrderId}`
  return localId
}
