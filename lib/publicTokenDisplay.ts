/** Public-facing USDM token branding (display only — not on-chain identifiers). */

export const USDM_TOKEN_SYMBOL = "USDM"
export const USDM_SYNTHETIC_DOLLAR = "USDM synthetic dollar"
export const USDM_PROTOCOL_TOKEN = "USDM protocol token"

const PUBLIC_SYMBOL_ALIASES: Record<string, string> = {
  MUSDT: USDM_TOKEN_SYMBOL,
  USDM: USDM_TOKEN_SYMBOL,
}

/** Map legacy/on-chain merchant tickers to the public USDM label for UI copy. */
export function publicTokenSymbolLabel(symbol: string): string {
  const trimmed = symbol.trim()
  if (!trimmed) return USDM_TOKEN_SYMBOL
  const key = trimmed.toUpperCase()
  return PUBLIC_SYMBOL_ALIASES[key] ?? trimmed
}
