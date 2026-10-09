import { getAddress, isAddress } from "ethers"

function readOptionalFeedEnv(): string | null {
  const raw = (process.env.NEXT_PUBLIC_CHAINLINK_ETH_USD_FEED ?? process.env.VITE_CHAINLINK_ETH_USD_FEED)
  if (raw === undefined || raw === null) return null
  const s = String(raw).replace(/^\uFEFF/, "").trim()
  if (s === "") return null
  return s.replace(/^["']|["']$/g, "").trim() || null
}

/**
 * Default Chainlink ETH/USD Data Feed addresses by chain (same chain the staking
 * JsonRpcProvider is pinned to). Override with `VITE_CHAINLINK_ETH_USD_FEED` when
 * deploying to a chain not listed here.
 *
 * @see https://docs.chain.link/data-feeds/price-feeds/addresses
 */
const DEFAULT_ETH_USD_FEEDS: Readonly<Record<number, string>> = Object.freeze({
  // Ethereum
  1: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
  11155111: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
  // Arbitrum One
  42161: "0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612",
  // Base
  8453: "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70",
  // Optimism
  10: "0x13e3Ee699D1909E989722E753853AE30b17e08c5",
  // Polygon PoS
  137: "0xF9680D99D6C9589e2a93a78A04A279e509205945",
})

/** Optional env override: single checksummed feed contract for the staking chain. */
function readOptionalFeedOverride(): string | null {
  const raw = readOptionalFeedEnv()
  if (!raw || !isAddress(raw)) return null
  return getAddress(raw)
}

/**
 * Resolves the Chainlink ETH/USD aggregator for `chainId`, or null if unsupported
 * and no valid env override.
 */
export function resolveChainlinkEthUsdFeedAddress(chainId: number): string | null {
  const override = readOptionalFeedOverride()
  if (override) return override
  const a = DEFAULT_ETH_USD_FEEDS[chainId]
  if (!a || !isAddress(a)) return null
  return getAddress(a)
}
