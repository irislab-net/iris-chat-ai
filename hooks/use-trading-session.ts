"use client"

import * as React from "react"

import type { TradingAdapter } from "@/lib/trading/adapter"
import {
  UNAVAILABLE_TRADING_ACCESS,
  type TradingAccess,
} from "@/lib/trading/access"
import { canExecuteOrders } from "@/lib/trading/capabilities"
import { getPaperTradingAdapter } from "@/lib/trading/paper-adapter"
import { createHyperliquidRealAdapter } from "@/lib/trading/hyperliquid/execution-adapter"
import { BackendHyperliquidExecutionService } from "@/lib/trading/hyperliquid/execution/service"
import { isTestnetExecutionEnabled } from "@/lib/trading/hyperliquid/network"
import {
  canSubmitTradingOrder,
  demoTradingReadiness,
  realTradingReadiness,
  type TradingReadiness,
} from "@/lib/trading/readiness"
import type { WalletReadinessStatus } from "@/lib/wallet/identity"
import type {
  MarketReconciliation,
  Market,
  OrderRequest,
  OrderResult,
  OrderUpdate,
  PositionProtectionUpdate,
  TradingMode,
  TradingCapabilities,
  TradingSnapshot,
} from "@/lib/trading/types"

const NOT_READY_RESULT: OrderResult = {
  ok: false,
  status: "REJECTED",
  error: {
    code: "NOT_READY",
    message: "Trading is not ready in the selected mode.",
    retryable: false,
  },
}

const UNAVAILABLE_SNAPSHOT: TradingSnapshot = {
  account: {
    providerId: "unavailable",
    accountId: null,
    status: "UNAVAILABLE",
    balances: [],
    equity: null,
    availableBalance: null,
    initialMarginUsed: null,
    maintenanceMarginUsed: null,
    funding: null,
    updatedAt: null,
  },
  positions: [],
  openOrders: [],
  fills: [],
  history: [],
}

function subscribeUnavailable(): () => void {
  return () => undefined
}

function getUnavailableSnapshot(): TradingSnapshot {
  return UNAVAILABLE_SNAPSHOT
}

export async function executeTradingCommand(
  input: {
    mode: TradingMode
    adapter: TradingAdapter | null
    readiness: TradingReadiness
  },
  command: (adapter: TradingAdapter) => Promise<OrderResult>
): Promise<OrderResult> {
  if (
    !canSubmitTradingOrder({
      mode: input.mode,
      readiness: input.readiness,
      hasAdapter: input.adapter != null,
    }) ||
    input.adapter == null ||
    input.adapter.mode !== input.mode ||
    !canExecuteOrders(input.adapter.getCapabilities())
  ) {
    return NOT_READY_RESULT
  }
  try {
    return await command(input.adapter)
  } catch (error) {
    return {
      ok: false,
      status: "REJECTED",
      error: {
        code: "UNKNOWN",
        message:
          error instanceof Error ? error.message : "The trading command failed.",
        retryable: true,
      },
    }
  }
}

export type TradingSession = {
  mode: TradingMode
  adapterId: string | null
  capabilities: TradingCapabilities | null
  markets: readonly Market[]
  snapshot: TradingSnapshot | null
  readiness: TradingReadiness
  executionReady: boolean
  canSubmit: boolean
  initialize: (signal?: AbortSignal) => Promise<void>
  placeOrder: (request: OrderRequest) => Promise<OrderResult>
  cancelOrder: (orderId: string) => Promise<OrderResult>
  modifyOrder: (orderId: string, update: OrderUpdate) => Promise<OrderResult>
  closePosition: (positionId: string, referencePrice?: string) => Promise<OrderResult>
  updatePositionProtection: (
    positionId: string,
    update: PositionProtectionUpdate
  ) => Promise<OrderResult>
  updateLeverage: (positionId: string, leverage: number) => Promise<OrderResult>
  addIsolatedMargin: (positionId: string, amount: string) => Promise<OrderResult>
  removeIsolatedMargin: (positionId: string, amount: string) => Promise<OrderResult>
  reconcileMarket: (input: MarketReconciliation) => void
  reconcileAway: (symbol: string, signal?: AbortSignal) => Promise<void>
}

const executionService = new BackendHyperliquidExecutionService()

function readOnlyExecutionCapabilities(): TradingCapabilities {
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

export function useTradingSession(input: {
  mode: TradingMode
  isAuthenticated: boolean
  access?: TradingAccess
  verifiedWalletAddress?: string | null
  walletStatus?: WalletReadinessStatus
  walletIdentityId?: string | null
  userId?: string | null
}): TradingSession {
  const paperAdapter = React.useMemo(() => getPaperTradingAdapter(), [])
  const access = input.access ?? UNAVAILABLE_TRADING_ACCESS
  const executionEnabled =
    isTestnetExecutionEnabled({
      accessResolved: access.resolved,
      canExecuteTestnet: access.canExecuteTestnet,
    }) &&
    input.walletStatus === "VERIFIED"

  const realAdapter = React.useMemo(
    () =>
      createHyperliquidRealAdapter({
        address: input.verifiedWalletAddress ?? "",
        walletIdentityId: input.walletIdentityId ?? null,
        executionEnabled,
        executionService,
        userId: input.userId ?? null,
      }),
    [
      executionEnabled,
      input.userId,
      input.verifiedWalletAddress,
      input.walletIdentityId,
    ]
  )
  React.useEffect(() => () => realAdapter?.dispose?.(), [realAdapter])
  const adapter: TradingAdapter | null =
    input.mode === "demo" ? paperAdapter : realAdapter
  // Signer readiness belongs to one adapter/wallet/execution combination.
  // Keying it means switching any of them invalidates it by derivation
  // instead of a reset effect.
  const signerKey = `${realAdapter?.id ?? "none"}:${
    input.walletIdentityId ?? "none"
  }:${executionEnabled}`
  const [signer, setSigner] = React.useState<{
    key: string
    ready: boolean
  } | null>(null)
  const signerReady = signer?.key === signerKey && signer.ready

  const subscribedSnapshot = React.useSyncExternalStore(
    adapter?.subscribeSnapshot ?? subscribeUnavailable,
    adapter?.getSnapshot ?? getUnavailableSnapshot,
    adapter?.getServerSnapshot ?? getUnavailableSnapshot
  )
  const adapterMode =
    realAdapter?.id === "hyperliquid-testnet"
      ? "EXECUTION"
      : realAdapter
        ? "READ_ONLY"
        : "UNAVAILABLE"
  const signerAvailable =
    adapterMode === "EXECUTION" &&
    signerReady &&
    canExecuteOrders(realAdapter?.getCapabilities() ?? readOnlyExecutionCapabilities())

  const readiness = React.useMemo(
    () =>
      input.mode === "demo"
        ? demoTradingReadiness()
        : realTradingReadiness({
            isAuthenticated: input.isAuthenticated,
            access,
            adapterMode,
            walletStatus: input.walletStatus ?? "MISSING",
            accountStatus: realAdapter ? subscribedSnapshot.account.status : undefined,
            allowExecution: executionEnabled && signerAvailable,
            signerAvailable,
          }),
    [
      access,
      adapterMode,
      executionEnabled,
      input.isAuthenticated,
      input.mode,
      input.walletStatus,
      realAdapter,
      signerAvailable,
      subscribedSnapshot.account.status,
    ]
  )
  const executionReady =
    input.mode === "real" &&
    readiness.mode === "real" &&
    readiness.status === "EXECUTION_READY"
  const canSubmit = canSubmitTradingOrder({
    mode: input.mode,
    readiness,
    hasAdapter: adapter != null,
  })

  const run = React.useCallback(
    (command: (active: TradingAdapter) => Promise<OrderResult>) =>
      executeTradingCommand({ mode: input.mode, adapter, readiness }, command),
    [adapter, input.mode, readiness]
  )
  const initialize = React.useCallback(
    async (signal?: AbortSignal) => {
      await adapter?.initialize?.(signal)
      setSigner({
        key: signerKey,
        ready:
          adapter?.id === "hyperliquid-testnet" &&
          canExecuteOrders(adapter.getCapabilities()),
      })
    },
    [adapter, signerKey]
  )
  const reconcileMarket = React.useCallback(
    (market: MarketReconciliation) => adapter?.reconcileMarket?.(market),
    [adapter]
  )
  const reconcileAway = React.useCallback(
    async (symbol: string, signal?: AbortSignal) => {
      await adapter?.reconcileAway?.(symbol, signal)
    },
    [adapter]
  )

  return {
    mode: input.mode,
    adapterId: adapter?.id ?? null,
    capabilities: adapter?.getCapabilities() ?? null,
    markets: adapter?.getMarkets() ?? [],
    snapshot: adapter ? subscribedSnapshot : null,
    readiness,
    executionReady,
    canSubmit,
    initialize,
    placeOrder: (request) => run((active) => active.placeOrder(request)),
    cancelOrder: (orderId) => run((active) => active.cancelOrder(orderId)),
    modifyOrder: (orderId, update) =>
      run((active) => active.modifyOrder(orderId, update)),
    closePosition: (positionId, referencePrice) =>
      run((active) => active.closePosition(positionId, referencePrice)),
    updatePositionProtection: (positionId, update) =>
      run((active) => active.updatePositionProtection(positionId, update)),
    updateLeverage: (positionId, leverage) =>
      run((active) => active.updateLeverage(positionId, leverage)),
    addIsolatedMargin: (positionId, amount) =>
      run((active) =>
        active.addIsolatedMargin
          ? active.addIsolatedMargin(positionId, amount)
          : Promise.resolve({
              ok: false as const,
              status: "REJECTED" as const,
              error: {
                code: "CAPABILITY_UNAVAILABLE" as const,
                message: "This adapter cannot add isolated margin.",
                retryable: false,
              },
            })
      ),
    removeIsolatedMargin: (positionId, amount) =>
      run((active) =>
        active.removeIsolatedMargin
          ? active.removeIsolatedMargin(positionId, amount)
          : Promise.resolve({
              ok: false as const,
              status: "REJECTED" as const,
              error: {
                code: "CAPABILITY_UNAVAILABLE" as const,
                message: "This adapter cannot remove isolated margin.",
                retryable: false,
              },
            })
      ),
    reconcileMarket,
    reconcileAway,
  }
}
