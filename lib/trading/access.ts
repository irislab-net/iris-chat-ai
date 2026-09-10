export type TradingAccess = {
  source: "UNAVAILABLE" | "SERVER"
  resolved: boolean
  canUseRealTrading: boolean
  canExecuteTestnet: boolean
  canExecuteMainnet: boolean
  canUsePrediction24H: boolean
  canUsePrediction4H: boolean
  canUsePrediction1M: boolean
  canUseAdvancedIntelligence: boolean
}

/** No backend entitlement contract resolved yet; fail closed. */
export const UNAVAILABLE_TRADING_ACCESS: TradingAccess = {
  source: "UNAVAILABLE",
  resolved: false,
  canUseRealTrading: false,
  canExecuteTestnet: false,
  canExecuteMainnet: false,
  canUsePrediction24H: false,
  canUsePrediction4H: false,
  canUsePrediction1M: false,
  canUseAdvancedIntelligence: false,
}
