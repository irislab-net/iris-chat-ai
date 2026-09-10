import { describe, expect, it } from "vitest"

import { guardExecutionIntent } from "@/lib/trading/hyperliquid/execution/guard"
import { DEFAULT_KILL_SWITCH } from "@/lib/trading/hyperliquid/execution/kill-switch"
import {
  clearExecutionObservabilityBuffer,
  getExecutionObservabilityBuffer,
} from "@/lib/trading/hyperliquid/execution/observability"
import { ExecutionRateLimiter } from "@/lib/trading/hyperliquid/execution/rate-limit"
import { InMemoryIdempotencyStore, reserveIdempotencyKey } from "@/lib/trading/hyperliquid/execution/security"
import {
  assertExecutionNetwork,
  HYPERLIQUID_MAINNET_EXECUTION_ENABLED,
  resolveExecutionNetwork,
} from "@/lib/trading/hyperliquid/network"
import {
  validateLeverageLimit,
  validateOrderIntent,
  validateOrderSize,
  validateSupportedMarket,
} from "@/lib/trading/hyperliquid/execution/validation"
import type { AccountSnapshot, Market } from "@/lib/trading/types"

const ETH_MARKET: Market = {
  symbol: "ETH",
  baseAsset: "ETH",
  quoteAsset: "USDC",
  status: "ACTIVE",
  priceDecimals: 2,
  sizeDecimals: 4,
  maxLeverage: 50,
}

const READY_ACCOUNT: AccountSnapshot = {
  providerId: "hyperliquid",
  accountId: "0xabc",
  status: "READY",
  balances: [],
  equity: "1000",
  availableBalance: "500",
  initialMarginUsed: "0",
  maintenanceMarginUsed: null,
  funding: null,
  updatedAt: Date.now(),
}

describe("execution network boundary", () => {
  it("never resolves mainnet without separate entitlement and env", () => {
    expect(HYPERLIQUID_MAINNET_EXECUTION_ENABLED).toBe(false)
    expect(
      resolveExecutionNetwork({
        entitlements: {
          source: "SERVER",
          resolved: true,
          entitlements: [
            { capability: "trading.mainnet.execute", active: true, expiresAt: null },
          ],
        },
        mainnetEnvEnabled: true,
      })
    ).toBe("mainnet")
    expect(() => assertExecutionNetwork("mainnet")).toThrow(/disabled/)
  })

  it("requires testnet entitlement separate from mainnet", () => {
    expect(
      resolveExecutionNetwork({
        entitlements: {
          source: "SERVER",
          resolved: true,
          entitlements: [{ capability: "trading.testnet.execute", active: true, expiresAt: null }],
        },
        testnetEnvEnabled: true,
      })
    ).toBe("testnet")
    expect(
      resolveExecutionNetwork({
        entitlements: {
          source: "SERVER",
          resolved: true,
          entitlements: [{ capability: "trading.real", active: true, expiresAt: null }],
        },
        testnetEnvEnabled: true,
      })
    ).toBeNull()
  })
})

describe("order intent validation", () => {
  it("rejects unsupported assets and oversized leverage", () => {
    expect(validateSupportedMarket("DOGE", [ETH_MARKET])).toBeNull()
    expect(
      validateLeverageLimit({ leverage: 100, market: ETH_MARKET }).ok
    ).toBe(false)
    expect(
      validateOrderSize({
        quantity: "0",
        market: ETH_MARKET,
        markPrice: 2000,
        availableBalance: 500,
      }).ok
    ).toBe(false)
    expect(
      validateOrderSize({
        quantity: "1000",
        market: ETH_MARKET,
        markPrice: 2000,
        availableBalance: 10,
        leverage: 5,
      }).ok
    ).toBe(false)
  })

  it("validates market orders against account readiness and margin", () => {
    const ok = validateOrderIntent({
      action: "PLACE_MARKET",
      symbol: "ETH",
      side: "BUY",
      quantity: "0.1",
      markets: [ETH_MARKET],
      account: READY_ACCOUNT,
      positions: [],
      markPrice: 2000,
    })
    expect(ok.ok).toBe(true)

    const stale = validateOrderIntent({
      action: "PLACE_MARKET",
      symbol: "ETH",
      side: "BUY",
      quantity: "0.1",
      markets: [ETH_MARKET],
      account: { ...READY_ACCOUNT, status: "STALE" },
      positions: [],
      markPrice: 2000,
    })
    expect(stale.ok).toBe(false)
  })
})

describe("execution guard", () => {
  it("blocks kill switch, rate limits, and replays", () => {
    clearExecutionObservabilityBuffer()
    const blocked = guardExecutionIntent({
      requestId: "req-1",
      userId: "user-1",
      walletIdentityId: "wallet-1",
      network: "testnet",
      action: "PLACE_MARKET",
      symbol: "ETH",
      side: "BUY",
      quantity: "0.1",
      markets: [ETH_MARKET],
      account: READY_ACCOUNT,
      positions: [],
      markPrice: 2000,
      killSwitch: {
        source: "SERVER",
        globalExecutionEnabled: false,
        userExecutionEnabled: true,
        disabledMarkets: [],
      },
      rateLimiter: new ExecutionRateLimiter({ windowMs: 10_000, maxRequests: 100 }),
    })
    expect(blocked.ok).toBe(false)
    expect(getExecutionObservabilityBuffer().some((e) => e.phase === "KILL_SWITCH_BLOCKED")).toBe(
      true
    )

    const limiter = new ExecutionRateLimiter({ windowMs: 10_000, maxRequests: 1 })
    const first = guardExecutionIntent({
      requestId: "req-2",
      userId: "user-2",
      walletIdentityId: "wallet-2",
      network: "testnet",
      action: "PLACE_MARKET",
      symbol: "ETH",
      side: "BUY",
      quantity: "0.1",
      markets: [ETH_MARKET],
      account: READY_ACCOUNT,
      positions: [],
      markPrice: 2000,
      killSwitch: DEFAULT_KILL_SWITCH,
      rateLimiter: limiter,
    })
    const second = guardExecutionIntent({
      requestId: "req-3",
      userId: "user-2",
      walletIdentityId: "wallet-2",
      network: "testnet",
      action: "PLACE_MARKET",
      symbol: "ETH",
      side: "BUY",
      quantity: "0.1",
      markets: [ETH_MARKET],
      account: READY_ACCOUNT,
      positions: [],
      markPrice: 2000,
      killSwitch: DEFAULT_KILL_SWITCH,
      rateLimiter: limiter,
    })
    expect(first.ok).toBe(true)
    expect(second.ok).toBe(false)

    const store = new InMemoryIdempotencyStore()
    expect(reserveIdempotencyKey({ store, idempotencyKey: "k", executionId: "e1" }).ok).toBe(true)
    expect(reserveIdempotencyKey({ store, idempotencyKey: "k", executionId: "e2" }).ok).toBe(false)
  })
})
