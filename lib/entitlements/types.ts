export type Capability =
  | "prediction.24h"
  | "prediction.4h"
  | "prediction.1m"
  | "trading.real"
  | "trading.testnet.execute"
  | "trading.mainnet.execute"
  | "intelligence.advanced"

export type EntitlementSource = "UNAVAILABLE" | "SERVER"

export type EntitlementRecord = {
  capability: Capability
  active: boolean
  expiresAt: string | null
}

export type EntitlementSnapshot = {
  source: EntitlementSource
  resolved: boolean
  entitlements: readonly EntitlementRecord[]
}

/** Fail closed until the server entitlement contract resolves. */
export const UNRESOLVED_ENTITLEMENTS: EntitlementSnapshot = {
  source: "UNAVAILABLE",
  resolved: false,
  entitlements: [],
}

/** API contract — GET /v1/entitlements */
export type EntitlementsApiResponse = {
  entitlements: EntitlementRecord[]
}

export type TradingAccountProvider = "hyperliquid"

/** Trading account bound to a verified wallet identity — not the same as Agent Wallet. */
export type HyperliquidTradingAccount = {
  provider: "hyperliquid"
  walletIdentityId: string
  address: string
}

export type TradingAccount = HyperliquidTradingAccount
