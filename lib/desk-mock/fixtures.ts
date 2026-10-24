import type {
  DeskLedgerEntry,
  DeskMarketQuote,
  DeskPosition,
  DeskWalletBalances,
} from "@/lib/desk-mock/types"

export const MOCK_WALLET: DeskWalletBalances = {
  availableUsd: 12480.5,
  lockedUsd: 3200,
  withdrawHoldUsd: 0,
  realizedPnlUsd: 1842.35,
  unrealizedPnlUsd: 267.8,
}

export const MOCK_POSITIONS: DeskPosition[] = [
  {
    id: "pos_open_xau_1",
    instrument: "XAU",
    side: "long",
    status: "open",
    size: 1.25,
    entryPrice: 2648.4,
    markPrice: 2671.2,
    marginUsd: 1600,
    unrealizedPnlUsd: 28.5,
    realizedPnlUsd: 0,
    feeUsd: 4.2,
    takeProfit: 2720,
    stopLoss: 2610,
    openedAt: "2026-10-22T14:22:00.000Z",
    closedAt: null,
  },
  {
    id: "pos_open_btc_1",
    instrument: "BTC",
    side: "long",
    status: "open",
    size: 0.08,
    entryPrice: 108420,
    markPrice: 111050,
    marginUsd: 1200,
    unrealizedPnlUsd: 210.4,
    realizedPnlUsd: 0,
    feeUsd: 3.6,
    takeProfit: 118000,
    stopLoss: 104500,
    openedAt: "2026-10-23T09:05:00.000Z",
    closedAt: null,
  },
  {
    id: "pos_open_eth_1",
    instrument: "ETH",
    side: "short",
    status: "open",
    size: 1.4,
    entryPrice: 3920,
    markPrice: 3899,
    marginUsd: 400,
    unrealizedPnlUsd: 29.4,
    realizedPnlUsd: 0,
    feeUsd: 1.8,
    takeProfit: 3720,
    stopLoss: 4050,
    openedAt: "2026-10-24T07:40:00.000Z",
    closedAt: null,
  },
  {
    id: "pos_closed_xau_1",
    instrument: "XAU",
    side: "short",
    status: "closed",
    size: 0.9,
    entryPrice: 2688,
    markPrice: 2654.5,
    marginUsd: 900,
    unrealizedPnlUsd: 0,
    realizedPnlUsd: 30.15,
    feeUsd: 3.1,
    takeProfit: 2620,
    stopLoss: 2725,
    openedAt: "2026-10-18T11:10:00.000Z",
    closedAt: "2026-10-19T16:48:00.000Z",
  },
  {
    id: "pos_closed_btc_1",
    instrument: "BTC",
    side: "long",
    status: "closed",
    size: 0.05,
    entryPrice: 102800,
    markPrice: 109100,
    marginUsd: 750,
    unrealizedPnlUsd: 0,
    realizedPnlUsd: 315,
    feeUsd: 2.9,
    takeProfit: 110000,
    stopLoss: 99000,
    openedAt: "2026-10-12T08:00:00.000Z",
    closedAt: "2026-10-15T20:12:00.000Z",
  },
  {
    id: "pos_closed_eth_1",
    instrument: "ETH",
    side: "long",
    status: "closed",
    size: 2.1,
    entryPrice: 3680,
    markPrice: 3555,
    marginUsd: 520,
    unrealizedPnlUsd: 0,
    realizedPnlUsd: -262.5,
    feeUsd: 2.4,
    takeProfit: 3900,
    stopLoss: 3550,
    openedAt: "2026-10-08T13:30:00.000Z",
    closedAt: "2026-10-09T04:05:00.000Z",
  },
]

export const MOCK_LEDGER: DeskLedgerEntry[] = [
  {
    id: "led_dep_1",
    kind: "deposit",
    amountUsd: 5000,
    currency: "USDT",
    status: "credited",
    createdAt: "2026-10-10T12:00:00.000Z",
    reference: "NP-7f3a…c291",
  },
  {
    id: "led_dep_2",
    kind: "deposit",
    amountUsd: 2500,
    currency: "USDC",
    status: "credited",
    createdAt: "2026-10-16T18:22:00.000Z",
    reference: "NP-91b2…aa04",
  },
  {
    id: "led_dep_3",
    kind: "deposit",
    amountUsd: 1000,
    currency: "USDT",
    status: "confirming",
    createdAt: "2026-10-24T15:05:00.000Z",
    reference: "NP-c4e8…1102",
  },
  {
    id: "led_wd_1",
    kind: "withdrawal",
    amountUsd: 800,
    currency: "USDT",
    status: "settled",
    createdAt: "2026-10-20T10:40:00.000Z",
    reference: "0x8f…a1c",
  },
  {
    id: "led_wd_2",
    kind: "withdrawal",
    amountUsd: 250,
    currency: "USDT",
    status: "pending",
    createdAt: "2026-10-24T09:12:00.000Z",
    reference: "0x2b…91e",
  },
]

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
