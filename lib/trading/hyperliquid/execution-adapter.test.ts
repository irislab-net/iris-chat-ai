import { describe, expect, it, vi } from "vitest"

import { HyperliquidExecutionAdapter } from "@/lib/trading/hyperliquid/execution-adapter"
import { HyperliquidTradingAdapter } from "@/lib/trading/hyperliquid/adapter"
import type {
  HyperliquidExecutionService,
  SignerStatus,
} from "@/lib/trading/hyperliquid/execution/signer"
import type {
  ExecutionSubmitInput,
  ExecutionSubmitResult,
} from "@/lib/trading/hyperliquid/execution/signer"
import type {
  HyperliquidRawSnapshot,
  HyperliquidReadOnlyTransport,
} from "@/lib/trading/hyperliquid/transport"
import { InMemoryIdempotencyStore } from "@/lib/trading/hyperliquid/execution/security"
import type { ExecutionRecord, Order } from "@/lib/trading/types"

const ADDRESS = "0x1111111111111111111111111111111111111111"
const WALLET_ID = "wallet-1"

function validRawSnapshot(): HyperliquidRawSnapshot {
  return {
    metaAndAssetContexts: [{ universe: [{ name: "ETH", szDecimals: 4, maxLeverage: 50 }] }, []],
    clearinghouseState: {
      marginSummary: { accountValue: "1000", totalMarginUsed: "0" },
      withdrawable: "1000",
      assetPositions: [],
    },
    openOrders: [],
    fills: [],
  }
}

class FakeTransport implements HyperliquidReadOnlyTransport {
  fetchSnapshot = vi.fn(async () => validRawSnapshot())
  subscribe(): () => void {
    return () => undefined
  }
}

class FakeExecutionService implements HyperliquidExecutionService {
  submit = vi.fn(async (input: ExecutionSubmitInput): Promise<ExecutionSubmitResult> => {
    const now = Date.now()
    const execution: ExecutionRecord = {
      id: "exec-1",
      idempotencyKey: input.idempotencyKey,
      clientOrderId: input.clientOrderId,
      action: input.action,
      lifecycle: "ACKNOWLEDGED",
      symbol: input.symbol,
      orderId: "hl:99",
      exchangeOrderId: "99",
      createdAt: now,
      updatedAt: now,
      error: null,
    }
    const order: Order = {
      id: "hl:99",
      exchangeOrderId: "99",
      clientOrderId: input.clientOrderId,
      symbol: input.symbol,
      side: input.side ?? "BUY",
      type: "MARKET",
      triggerKind: "NONE",
      status: "OPEN",
      quantity: input.quantity ?? "1",
      filledQuantity: "0",
      averageFillPrice: null,
      price: null,
      triggerPrice: null,
      timeInForce: "FRONTEND_MARKET",
      reduceOnly: false,
      linkedPositionId: null,
      createdAt: now,
      updatedAt: now,
      rejectionReason: null,
    }
    return { ok: true, execution, order }
  })

  async getSignerStatus(): Promise<SignerStatus> {
    return {
      available: true,
      network: "testnet",
      walletIdentityId: WALLET_ID,
      expiresAt: null,
    }
  }
}

describe("HyperliquidExecutionAdapter", () => {
  it("submits a market order through the isolated execution service", async () => {
    const transport = new FakeTransport()
    const readAdapter = new HyperliquidTradingAdapter(ADDRESS, transport, () => 1000)
    const service = new FakeExecutionService()
    const adapter = new HyperliquidExecutionAdapter(
      ADDRESS,
      WALLET_ID,
      service,
      () => 1000,
      new InMemoryIdempotencyStore(),
      readAdapter,
      {
        userId: "user-1",
        fetchKillSwitch: async () => ({
          source: "SERVER",
          globalExecutionEnabled: true,
          userExecutionEnabled: true,
          disabledMarkets: [],
        }),
      }
    )

    await adapter.initialize()
    const result = await adapter.placeOrder({
      symbol: "ETH",
      side: "BUY",
      type: "MARKET",
      quantity: "1",
    })

    expect(result.ok).toBe(true)
    expect(service.submit).toHaveBeenCalledWith(
      expect.objectContaining({
        walletIdentityId: WALLET_ID,
        action: "PLACE_MARKET",
        symbol: "ETH",
      })
    )
    adapter.dispose()
  })

  it("rejects limit orders until expanded", async () => {
    const transport = new FakeTransport()
    const readAdapter = new HyperliquidTradingAdapter(ADDRESS, transport, () => 1000)
    const service = new FakeExecutionService()
    const adapter = new HyperliquidExecutionAdapter(
      ADDRESS,
      WALLET_ID,
      service,
      () => 1000,
      new InMemoryIdempotencyStore(),
      readAdapter,
      {
        userId: "user-1",
        fetchKillSwitch: async () => ({
          source: "SERVER",
          globalExecutionEnabled: true,
          userExecutionEnabled: true,
          disabledMarkets: [],
        }),
      }
    )
    await adapter.initialize()

    const result = await adapter.placeOrder({
      symbol: "ETH",
      side: "BUY",
      type: "LIMIT",
      quantity: "1",
      price: "1800",
    })
    expect(result).toMatchObject({
      ok: false,
      error: { code: "CAPABILITY_UNAVAILABLE" },
    })
    expect(service.submit).not.toHaveBeenCalled()
    adapter.dispose()
  })

  it("fails closed when the signer is unavailable", async () => {
    const unavailable: HyperliquidExecutionService = {
      async getSignerStatus() {
        return {
          available: false,
          network: "testnet",
          walletIdentityId: WALLET_ID,
          expiresAt: null,
        }
      },
      submit: vi.fn(),
    }
    const adapter = new HyperliquidExecutionAdapter(
      ADDRESS,
      WALLET_ID,
      unavailable,
      Date.now,
      new InMemoryIdempotencyStore(),
      new HyperliquidTradingAdapter(ADDRESS, new FakeTransport(), () => 1000)
    )
    await adapter.initialize()
    expect(adapter.getCapabilities().canSubmitOrders).toBe(false)

    const result = await adapter.placeOrder({
      symbol: "ETH",
      side: "BUY",
      type: "MARKET",
      quantity: "1",
    })
    expect(result).toMatchObject({
      ok: false,
      error: { code: "SIGNER_UNAVAILABLE" },
    })
    adapter.dispose()
  })
})
