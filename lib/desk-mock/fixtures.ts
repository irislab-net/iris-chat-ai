import type {
  DeskLedgerEntry,
  DeskMarketQuote,
  DeskPosition,
  DeskWalletBalances,
} from "@/lib/desk-mock/types"

export const MOCK_WALLET: DeskWalletBalances = {
  availableUsd: 0,
  lockedUsd: 0,
  withdrawHoldUsd: 0,
  realizedPnlUsd: 0,
  todayPnlUsd: 0,
}

/** Demo tape starts empty so trade empty states stay visible. */
export const MOCK_POSITIONS: DeskPosition[] = []

/** Demo activity starts empty so profile empty states stay visible. */
export const MOCK_LEDGER: DeskLedgerEntry[] = []

function spark(seed: number, n = 24): number[] {
  const out: number[] = []
  let v = seed
  for (let i = 0; i < n; i++) {
    v += Math.sin(i * 0.7 + seed) * (seed * 0.002) + (i % 3 === 0 ? 1 : -0.4)
    out.push(Number(v.toFixed(2)))
  }
  return out
}

function mockQuote(
  instrument: string,
  label: string,
  price: number,
  change24hPct: number,
  volume24hUsd: number
): DeskMarketQuote {
  const high24h = price * (1 + Math.max(change24hPct, 0.4) / 100)
  const low24h = price * (1 - Math.max(Math.abs(change24hPct), 0.4) / 100)
  return {
    instrument,
    label,
    quote: "USD",
    price,
    change24hPct,
    sparkline: spark(price * 0.97),
    high24h,
    low24h,
    volume24hUsd,
    updatedAt: new Date().toISOString(),
  }
}

/** Fallback tape when live Hyperliquid ctxs are unavailable. */
export const MOCK_MARKETS: DeskMarketQuote[] = [
  mockQuote("BTC", "Bitcoin", 111050, 2.14, 4_820_000_000),
  mockQuote("ETH", "Ethereum", 3899, -0.62, 2_140_000_000),
  mockQuote("SOL", "Solana", 178.4, 1.35, 980_000_000),
  mockQuote("XAU", "Gold", 2671.2, 0.48, 120_000_000),
  mockQuote("HYPE", "Hyperliquid", 28.6, 3.12, 410_000_000),
  mockQuote("DOGE", "Dogecoin", 0.182, -1.05, 620_000_000),
  mockQuote("LINK", "Chainlink", 18.42, 0.88, 190_000_000),
  mockQuote("AVAX", "Avalanche", 32.1, -0.41, 155_000_000),
  mockQuote("SUI", "Sui", 3.42, 2.05, 280_000_000),
  mockQuote("ARB", "Arbitrum", 0.62, -0.28, 95_000_000),
  mockQuote("OP", "Optimism", 1.48, 0.55, 72_000_000),
  mockQuote("APT", "Aptos", 8.9, 1.12, 88_000_000),
  mockQuote("NEAR", "NEAR", 4.15, -0.74, 64_000_000),
  mockQuote("AAVE", "Aave", 248, 1.65, 110_000_000),
  mockQuote("UNI", "Uniswap", 9.8, -0.33, 78_000_000),
  mockQuote("PEPE", "Pepe", 0.0000098, 4.2, 340_000_000),
  mockQuote("WIF", "dogwifhat", 1.85, -2.1, 145_000_000),
  mockQuote("INJ", "Injective", 22.4, 0.92, 58_000_000),
  mockQuote("TIA", "Celestia", 5.6, -1.4, 49_000_000),
  mockQuote("ATOM", "Cosmos", 6.15, 0.22, 42_000_000),
]

/** Mock NowPayments-style deposit address (not a real wallet). */
export const MOCK_NOWPAYMENTS_ADDRESS =
  "0xExurMockDeposit9f3A2cB71e8D004a55F1c290"
