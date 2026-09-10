export type {
  Capability,
  EntitlementRecord,
  EntitlementSnapshot,
  EntitlementSource,
  EntitlementsApiResponse,
  HyperliquidTradingAccount,
  TradingAccount,
  TradingAccountProvider,
} from "@/lib/entitlements/types"

export { UNRESOLVED_ENTITLEMENTS } from "@/lib/entitlements/types"

export {
  canExecuteMainnet,
  canExecuteTestnet,
  canUseAdvancedIntelligence,
  canUsePrediction1M,
  canUsePrediction24H,
  canUsePrediction4H,
  canUseRealTrading,
  hasCapability,
  KNOWN_CAPABILITIES,
  unknownCapabilities,
} from "@/lib/entitlements/capabilities"

export {
  fetchEntitlements,
  tradingAccessFromEntitlements,
} from "@/lib/entitlements/service"
