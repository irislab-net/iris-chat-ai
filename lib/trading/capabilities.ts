import type { TradingCapabilities } from "@/lib/trading/types"

export function readOnlyCapabilities(): TradingCapabilities {
  return {
    canReadAccount: true,
    canReadPositions: true,
    canSubmitOrders: false,
    canCancelOrders: false,
    canModifyOrders: false,
    canUpdateLeverage: false,
    canClosePositions: false,
    canTrade: false,
    canPlaceMarketOrders: false,
    canPlaceLimitOrders: false,
    canUseCrossMargin: false,
    canUseIsolatedMargin: false,
    canAdjustIsolatedMargin: false,
    canSetStopLoss: false,
    canSetTakeProfit: false,
  }
}

export function paperCapabilities(): TradingCapabilities {
  return {
    canReadAccount: true,
    canReadPositions: true,
    canSubmitOrders: true,
    canCancelOrders: true,
    canModifyOrders: true,
    canUpdateLeverage: true,
    canClosePositions: true,
    canTrade: true,
    canPlaceMarketOrders: true,
    canPlaceLimitOrders: true,
    canUseCrossMargin: true,
    canUseIsolatedMargin: true,
    canAdjustIsolatedMargin: true,
    canSetStopLoss: true,
    canSetTakeProfit: true,
  }
}

/** Phase 4 initial testnet scope: market open, close, cancel. */
export function executionCapabilities(
  overrides: Partial<TradingCapabilities> = {}
): TradingCapabilities {
  return {
    canReadAccount: true,
    canReadPositions: true,
    canSubmitOrders: true,
    canCancelOrders: true,
    canModifyOrders: false,
    canUpdateLeverage: false,
    canClosePositions: true,
    canTrade: true,
    canPlaceMarketOrders: true,
    canPlaceLimitOrders: false,
    canUseCrossMargin: true,
    canUseIsolatedMargin: false,
    canAdjustIsolatedMargin: false,
    canSetStopLoss: false,
    canSetTakeProfit: false,
    ...overrides,
  }
}

export function canExecuteOrders(capabilities: TradingCapabilities): boolean {
  return (
    capabilities.canSubmitOrders &&
    capabilities.canCancelOrders &&
    capabilities.canClosePositions
  )
}
