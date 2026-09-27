/** Remote logos for tape / market chips — fetched at runtime (no bundle). */
export const MARKET_ASSET_LOGOS = {
  BTC: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
  ETH: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  // XAUUSD--big.svg and DXY--big.svg return 403 on TradingView's CDN.
  XAU: "https://s3-symbol-logo.tradingview.com/metal/gold--big.svg",
  DXY: "https://s3-symbol-logo.tradingview.com/currency/USD--big.svg",
} as const

export type MarketAssetLogoKey = keyof typeof MARKET_ASSET_LOGOS

export function marketAssetLogoSrc(symbol: string): string | null {
  const key = symbol.trim().toUpperCase()
  if (key in MARKET_ASSET_LOGOS) {
    return MARKET_ASSET_LOGOS[key as MarketAssetLogoKey]
  }
  return null
}
