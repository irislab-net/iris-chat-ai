/** Remote logos for tape / market chips — fetched at runtime (no bundle). */
export const MARKET_ASSET_LOGOS = {
  BTC: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
  ETH: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  SOL: "https://assets.coingecko.com/coins/images/4128/small/solana.png",
  // XAUUSD--big.svg and DXY--big.svg return 403 on TradingView's CDN.
  XAU: "https://s3-symbol-logo.tradingview.com/metal/gold--big.svg",
  DXY: "https://s3-symbol-logo.tradingview.com/currency/USD--big.svg",
  HYPE: "https://assets.coingecko.com/coins/images/50882/small/hyperliquid.jpeg",
  DOGE: "https://assets.coingecko.com/coins/images/5/small/dogecoin.png",
  LINK: "https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png",
  AVAX: "https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png",
  SUI: "https://assets.coingecko.com/coins/images/26375/small/sui-ocean-square.png",
  ARB: "https://assets.coingecko.com/coins/images/16547/small/photo_2023-03-29_21.47.00.jpeg",
  OP: "https://assets.coingecko.com/coins/images/25244/small/Optimism.png",
  APT: "https://assets.coingecko.com/coins/images/26455/small/aptos_round.png",
  NEAR: "https://assets.coingecko.com/coins/images/10365/small/near.jpg",
  AAVE: "https://assets.coingecko.com/coins/images/12645/small/aave-token-round.png",
  UNI: "https://assets.coingecko.com/coins/images/12504/small/uniswap-logo.png",
  PEPE: "https://assets.coingecko.com/coins/images/29850/small/pepe-token.jpeg",
  WIF: "https://assets.coingecko.com/coins/images/33566/small/dogwifhat.jpg",
  INJ: "https://assets.coingecko.com/coins/images/12882/small/Secondary_Symbol.png",
  TIA: "https://assets.coingecko.com/coins/images/31967/small/tia.jpg",
  ATOM: "https://assets.coingecko.com/coins/images/1481/small/cosmos_hub.png",
} as const

export type MarketAssetLogoKey = keyof typeof MARKET_ASSET_LOGOS

/** TradingView crypto mark — covers most live HL tickers not in the curated map. */
function tradingViewCryptoLogo(symbol: string): string {
  return `https://s3-symbol-logo.tradingview.com/crypto/XTVC${symbol}--big.svg`
}

function curatedOrTradingView(symbol: string): string {
  if (symbol in MARKET_ASSET_LOGOS) {
    return MARKET_ASSET_LOGOS[symbol as MarketAssetLogoKey]
  }
  return tradingViewCryptoLogo(symbol)
}

export function marketAssetLogoSrc(symbol: string): string | null {
  const key = symbol.trim().toUpperCase()
  if (!key) return null

  if (key in MARKET_ASSET_LOGOS) {
    return MARKET_ASSET_LOGOS[key as MarketAssetLogoKey]
  }

  // Hyperliquid 1000x units (kPEPE) → base ticker logo.
  if (/^K[A-Z0-9]{2,}$/.test(key)) {
    return curatedOrTradingView(key.slice(1))
  }

  // Hyperliquid 1000PEPE-style units.
  if (/^1000[A-Z0-9]+$/.test(key)) {
    return curatedOrTradingView(key.slice(4))
  }

  // Live tape coins outside the curated map (ZEC, BONK, …).
  if (/^[A-Z0-9]{2,16}$/.test(key)) {
    return tradingViewCryptoLogo(key)
  }

  return null
}
