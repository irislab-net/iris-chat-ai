/** Paper-trading market switcher options (desk markets). */

export type PaperMarketId = "eth" | "btc" | "sol" | "xau"

export type PaperMarketOption = {
  id: PaperMarketId
  label: string
  symbol: string
  available: boolean
  defaultQuantity: number
}

export const PAPER_MARKETS: PaperMarketOption[] = [
  { id: "eth", label: "Ethereum", symbol: "ETH", available: true, defaultQuantity: 1 },
  { id: "btc", label: "Bitcoin", symbol: "BTC", available: true, defaultQuantity: 0.01 },
  { id: "sol", label: "Solana", symbol: "SOL", available: true, defaultQuantity: 1 },
  { id: "xau", label: "Gold", symbol: "XAU", available: true, defaultQuantity: 0.1 },
]

export function paperMarketBySymbol(
  symbol: string
): PaperMarketOption | undefined {
  const key = symbol.trim().toUpperCase()
  return PAPER_MARKETS.find((m) => m.symbol === key)
}
