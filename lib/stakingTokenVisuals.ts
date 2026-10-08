const LOGO_BY_SYMBOL: Record<string, string> = {
  USDC: "/staking/tokens/usdc.svg",
  USDT: "/staking/tokens/usdt.svg",
  USDM: "/staking/tokens/usdm.svg",
  MUSDT: "/staking/tokens/musdt.svg",
  ETH: "/staking/tokens/ethereum-eth.svg",
  WETH: "/staking/tokens/ethereum-eth.svg",
}

/** Normalize on-chain / UI token tickers for comparison. */
export function normalizeStakingTokenSymbol(symbol: string): string {
  return symbol.trim().toUpperCase()
}

/**
 * Merchant vault share ticker shown when depositing a pool stable.
 * Deposit stables map to MUSDT (public label → USDM via `publicTokenSymbolLabel`).
 */
export function vaultMerchantShareSymbol(poolTokenSymbol: string): string {
  const key = normalizeStakingTokenSymbol(poolTokenSymbol)
  if (!key) return "MUSDT"
  if (key === "MUSDT" || key === "USDM") return "MUSDT"
  if (key === "USDC" || key === "USDT" || key === "DAI") return "MUSDT"
  return key.startsWith("M") ? key : `M${key}`
}

/** Public-folder logo URL for a token symbol, or null if unknown. */
export function resolveStakingTokenLogoUrl(symbol: string): string | null {
  const key = normalizeStakingTokenSymbol(symbol)
  if (!key) return null
  return LOGO_BY_SYMBOL[key] ?? LOGO_BY_SYMBOL[vaultMerchantShareSymbol(key)] ?? null
}
