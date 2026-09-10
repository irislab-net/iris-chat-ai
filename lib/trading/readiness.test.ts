import { describe, expect, it, vi } from "vitest"

import { executeTradingCommand } from "@/hooks/use-trading-session"
import type { TradingAdapter } from "@/lib/trading/adapter"
import { UNAVAILABLE_TRADING_ACCESS } from "@/lib/trading/access"
import {
  demoTradingReadiness,
  realTradingReadiness,
} from "@/lib/trading/readiness"

const entitledAccess = {
  ...UNAVAILABLE_TRADING_ACCESS,
  source: "SERVER" as const,
  resolved: true,
  canUseRealTrading: true,
  canExecuteTestnet: true,
  canExecuteMainnet: false,
}

describe("trading readiness", () => {
  it("keeps demo ready without wallet or entitlement state", () => {
    expect(demoTradingReadiness()).toEqual({
      mode: "demo",
      status: "READY",
      canSubmit: true,
      message: null,
    })
  })

  it("fails real trading closed when auth or the adapter is unavailable", () => {
    expect(
      realTradingReadiness({
        isAuthenticated: false,
        access: UNAVAILABLE_TRADING_ACCESS,
        adapterMode: "UNAVAILABLE",
      }).status
    ).toBe("AUTH_REQUIRED")
    expect(
      realTradingReadiness({
        isAuthenticated: true,
        access: UNAVAILABLE_TRADING_ACCESS,
        adapterMode: "UNAVAILABLE",
        walletStatus: "VERIFIED",
      }).status
    ).toBe("UNSUPPORTED")
  })

  it("requires a verified wallet before read-only trading", () => {
    expect(
      realTradingReadiness({
        isAuthenticated: true,
        access: UNAVAILABLE_TRADING_ACCESS,
        adapterMode: "UNAVAILABLE",
        walletStatus: "MISSING",
      }).status
    ).toBe("WALLET_REQUIRED")
    expect(
      realTradingReadiness({
        isAuthenticated: true,
        access: UNAVAILABLE_TRADING_ACCESS,
        adapterMode: "UNAVAILABLE",
        walletStatus: "UNVERIFIED",
      }).status
    ).toBe("WALLET_UNVERIFIED")
  })

  it("never dispatches a real command to a demo adapter", async () => {
    const command = vi.fn()
    const adapter = {
      id: "paper",
      mode: "demo",
      getCapabilities: () => ({
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
      }),
    } as TradingAdapter
    const readiness = realTradingReadiness({
      isAuthenticated: true,
      access: UNAVAILABLE_TRADING_ACCESS,
      adapterMode: "UNAVAILABLE",
      walletStatus: "VERIFIED",
    })

    const result = await executeTradingCommand(
      { mode: "real", adapter, readiness },
      command
    )

    expect(result).toMatchObject({
      ok: false,
      error: { code: "NOT_READY" },
    })
    expect(command).not.toHaveBeenCalled()
  })

  it("represents a connected Hyperliquid account as read-only", () => {
    const readiness = realTradingReadiness({
      isAuthenticated: true,
      access: UNAVAILABLE_TRADING_ACCESS,
      adapterMode: "READ_ONLY",
      walletStatus: "VERIFIED",
      accountStatus: "READY",
    })
    expect(readiness).toMatchObject({
      status: "READ_ONLY",
      canSubmit: false,
    })
  })

  it("does not reach execution readiness while execution is disabled", () => {
    const readiness = realTradingReadiness({
      isAuthenticated: true,
      access: entitledAccess,
      adapterMode: "EXECUTION",
      walletStatus: "VERIFIED",
      accountStatus: "READY",
      allowExecution: false,
    })
    expect(readiness).toMatchObject({
      status: "READ_ONLY",
      canSubmit: false,
    })
  })

  it("keeps read-only when the testnet signer is unavailable", () => {
    const readiness = realTradingReadiness({
      isAuthenticated: true,
      access: entitledAccess,
      adapterMode: "EXECUTION",
      walletStatus: "VERIFIED",
      accountStatus: "READY",
      allowExecution: true,
      signerAvailable: false,
    })
    expect(readiness).toMatchObject({
      status: "READ_ONLY",
      canSubmit: false,
    })
  })

  it("can represent execution readiness only when explicitly enabled", () => {
    const readiness = realTradingReadiness({
      isAuthenticated: true,
      access: entitledAccess,
      adapterMode: "EXECUTION",
      walletStatus: "VERIFIED",
      accountStatus: "READY",
      allowExecution: true,
      signerAvailable: true,
    })
    expect(readiness).toMatchObject({
      status: "EXECUTION_READY",
      canSubmit: true,
    })
  })

  it("does not dispatch through a read-only real adapter", async () => {
    const command = vi.fn()
    const adapter = {
      id: "hyperliquid-read-only",
      mode: "real",
      getCapabilities: () => ({
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
      }),
    } as TradingAdapter
    const readiness = realTradingReadiness({
      isAuthenticated: true,
      access: UNAVAILABLE_TRADING_ACCESS,
      adapterMode: "READ_ONLY",
      walletStatus: "VERIFIED",
      accountStatus: "READY",
    })

    const result = await executeTradingCommand(
      { mode: "real", adapter, readiness },
      command
    )
    expect(result).toMatchObject({ ok: false, error: { code: "NOT_READY" } })
    expect(command).not.toHaveBeenCalled()
  })
})
