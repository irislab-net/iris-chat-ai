/**
 * Stable-route network codes → human chain name + brand mark.
 * Logos use the same CoinGecko host already allowlisted in next.config.
 */
export type StableNetworkMeta = {
  code: string
  chain: string
  logoUrl: string
}

const NETWORKS: Record<string, StableNetworkMeta> = {
  TRC20: {
    code: "TRC20",
    chain: "Tron",
    logoUrl:
      "https://assets.coingecko.com/coins/images/1094/small/tron-logo.png",
  },
  ERC20: {
    code: "ERC20",
    chain: "Ethereum",
    logoUrl:
      "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  },
  BEP20: {
    code: "BEP20",
    chain: "BNB Smart Chain",
    logoUrl:
      "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png",
  },
}

export function stableNetworkMeta(
  network: string | null | undefined
): StableNetworkMeta | null {
  if (!network) return null
  const key = network.trim().toUpperCase()
  return NETWORKS[key] ?? {
    code: key,
    chain: key,
    logoUrl: NETWORKS.ERC20.logoUrl,
  }
}
