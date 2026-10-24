/**
 * Friendly desk labels + search aliases for Hyperliquid coins.
 * Full tape comes from live HL meta; this only enriches display/search.
 */
export type DeskMarketAlias = {
  /** Desk ticker shown in the list (defaults to HL coin). */
  instrument?: string
  label: string
  /** Extra search tokens (names, tickers, aliases). */
  aliases?: readonly string[]
}

/** Keyed by Hyperliquid universe name (uppercased). */
export const DESK_MARKET_ALIASES: Readonly<Record<string, DeskMarketAlias>> = {
  BTC: {
    label: "Bitcoin",
    aliases: ["btc", "bitcoin", "xbt"],
  },
  ETH: {
    label: "Ethereum",
    aliases: ["eth", "ethereum", "ether"],
  },
  SOL: {
    label: "Solana",
    aliases: ["sol", "solana"],
  },
  PAXG: {
    instrument: "XAU",
    label: "Gold",
    aliases: ["xau", "gold", "paxg", "xauusd"],
  },
  HYPE: {
    label: "Hyperliquid",
    aliases: ["hype", "hyperliquid"],
  },
  DOGE: {
    label: "Dogecoin",
    aliases: ["doge", "dogecoin"],
  },
  LINK: {
    label: "Chainlink",
    aliases: ["link", "chainlink"],
  },
  AVAX: {
    label: "Avalanche",
    aliases: ["avax", "avalanche"],
  },
  SUI: {
    label: "Sui",
    aliases: ["sui"],
  },
  ARB: {
    label: "Arbitrum",
    aliases: ["arb", "arbitrum"],
  },
  OP: {
    label: "Optimism",
    aliases: ["op", "optimism"],
  },
  APT: {
    label: "Aptos",
    aliases: ["apt", "aptos"],
  },
  NEAR: {
    label: "NEAR",
    aliases: ["near"],
  },
  AAVE: {
    label: "Aave",
    aliases: ["aave"],
  },
  UNI: {
    label: "Uniswap",
    aliases: ["uni", "uniswap"],
  },
  KPEPE: {
    instrument: "PEPE",
    label: "Pepe",
    aliases: ["pepe", "kpepe"],
  },
  WIF: {
    label: "dogwifhat",
    aliases: ["wif", "dogwifhat"],
  },
  INJ: {
    label: "Injective",
    aliases: ["inj", "injective"],
  },
  TIA: {
    label: "Celestia",
    aliases: ["tia", "celestia"],
  },
  ATOM: {
    label: "Cosmos",
    aliases: ["atom", "cosmos"],
  },
  BNB: {
    label: "BNB",
    aliases: ["bnb", "binance"],
  },
  XRP: {
    label: "XRP",
    aliases: ["xrp", "ripple"],
  },
  LTC: {
    label: "Litecoin",
    aliases: ["ltc", "litecoin"],
  },
  BCH: {
    label: "Bitcoin Cash",
    aliases: ["bch", "bitcoin cash"],
  },
}

/** Normalize HL coin → desk display ticker (kPEPE → PEPE, PAXG → XAU). */
export function deskInstrumentFromHlCoin(hlCoin: string): string {
  const key = hlCoin.trim().toUpperCase()
  const alias = DESK_MARKET_ALIASES[key]
  if (alias?.instrument) return alias.instrument
  // Hyperliquid 1000x units: kPEPE, kSHIB, …
  if (/^K[A-Z0-9]{2,}$/.test(key)) return key.slice(1)
  return key
}

export function deskLabelFromHlCoin(hlCoin: string): string {
  const key = hlCoin.trim().toUpperCase()
  const alias = DESK_MARKET_ALIASES[key]
  if (alias?.label) return alias.label
  if (/^K[A-Z0-9]{2,}$/.test(key)) return key.slice(1)
  return key
}

export function deskSearchHaystack(input: {
  hlCoin: string
  instrument: string
  label: string
  quote?: string
}): string {
  const key = input.hlCoin.trim().toUpperCase()
  const alias = DESK_MARKET_ALIASES[key]
  const parts = [
    input.hlCoin,
    input.instrument,
    input.label,
    input.quote ?? "USD",
    ...(alias?.aliases ?? []),
  ]
  return parts.join(" ").toLowerCase()
}
