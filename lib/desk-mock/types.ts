export type DeskInstrument = "BTC" | "ETH" | "XAU"

export type DeskSide = "long" | "short"

export type DeskPositionStatus = "open" | "closed"

export type DeskLedgerKind = "deposit" | "withdrawal"

export type DeskLedgerStatus =
  | "pending"
  | "confirming"
  | "credited"
  | "settled"
  | "failed"
  | "cancelled"

export type DeskWalletBalances = {
  availableUsd: number
  lockedUsd: number
  withdrawHoldUsd: number
  realizedPnlUsd: number
  unrealizedPnlUsd: number
}

export type DeskPosition = {
  id: string
  instrument: DeskInstrument
  side: DeskSide
  status: DeskPositionStatus
  size: number
  entryPrice: number
  markPrice: number
  marginUsd: number
  unrealizedPnlUsd: number
  realizedPnlUsd: number
  feeUsd: number
  takeProfit: number | null
  stopLoss: number | null
  openedAt: string
  closedAt: string | null
}

export type DeskLedgerEntry = {
  id: string
  kind: DeskLedgerKind
  amountUsd: number
  currency: "USDT" | "USDC"
  status: DeskLedgerStatus
  createdAt: string
  /** Mock NowPayments / payout address fragment for display. */
  reference?: string
}

export type DeskMarketQuote = {
  instrument: string
  /** Hyperliquid universe name when live (for search aliases). */
  hlCoin?: string
  label: string
  /** Quote currency shown on the tape (exchange-style pair). */
  quote?: string
  price: number
  change24hPct: number
  sparkline: number[]
  high24h: number
  low24h: number
  /** 24h notional volume in USD when live. */
  volume24hUsd?: number
  updatedAt: string
}

export type DeskMockDepositInvoice = {
  id: string
  amountUsd: number
  currency: "USDT" | "USDC"
  payAddress: string
  status: "pending" | "confirming" | "paid" | "expired"
  createdAt: string
  expiresAt: string
}
