import { beforeEach, describe, expect, it, vi } from "vitest"

import { HyperliquidExecutionAdapter } from "@/lib/trading/hyperliquid/execution-adapter"
import { HyperliquidTradingAdapter } from "@/lib/trading/hyperliquid/adapter"
import type {
  ExecutionSubmitInput,
  ExecutionSubmitResult,
  HyperliquidExecutionService,
  SignerStatus,
} from "@/lib/trading/hyperliquid/execution/signer"
import type {
  HyperliquidRawSnapshot,
  HyperliquidReadOnlyTransport,
  HyperliquidStreamHandlers,
  HyperliquidStreamStatus,
} from "@/lib/trading/hyperliquid/transport"
import { InMemoryIdempotencyStore } from "@/lib/trading/hyperliquid/execution/security"
import { reconcileAfterTimeout, reconcileExecution } from "@/lib/trading/hyperliquid/execution/security"
import type { ExecutionRecord, Order } from "@/lib/trading/types"

const ADDRESS = "0x1111111111111111111111111111111111111111"
const WALLET_ID = "wallet-1"
const USER_ID = "user-1"

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
  handlers: HyperliquidStreamHandlers | null = null
  fetchSnapshot = vi.fn(async () => validRawSnapshot())
  subscribe(_address: string, handlers: HyperliquidStreamHandlers): () => void {
    this.handlers = handlers
    return () => {
      this.handlers = null
    }
  }
}

class SoakExecutionService implements HyperliquidExecutionService {
  available = true
  submitCalls = 0
  failNextSubmit = false
  delayMs = 0

  async getSignerStatus(): Promise<SignerStatus> {
    return {
      available: this.available,
      network: "testnet",
      walletIdentityId: WALLET_ID,
      expiresAt: null,
    }
  }

  async submit(input: ExecutionSubmitInput): Promise<ExecutionSubmitResult> {
    this.submitCalls += 1
    if (this.delayMs > 0) await new Promise((resolve) => setTimeout(resolve, this.delayMs))
    if (this.failNextSubmit) {
      return {
        ok: false,
        execution: null,
        error: {
          code: "SIGNER_UNAVAILABLE",
          message: "Signer restarted",
          retryable: true,
        },
      }
    }
    const now = Date.now()
    const execution: ExecutionRecord = {
      id: `exec-${this.submitCalls}`,
      idempotencyKey: input.idempotencyKey,
      clientOrderId: input.clientOrderId,
      action: input.action,
      lifecycle: input.action === "CANCEL_ORDER" ? "CANCELLED" : "ACKNOWLEDGED",
      symbol: input.symbol,
      orderId: "hl:100",
      exchangeOrderId: "100",
      createdAt: now,
      updatedAt: now,
      error: null,
    }
    const order: Order = {
      id: "hl:100",
      exchangeOrderId: "100",
      clientOrderId: input.clientOrderId,
      symbol: input.symbol,
      side: input.side ?? "BUY",
      type: "MARKET",
      triggerKind: "NONE",
      status: input.action === "CANCEL_ORDER" ? "CANCELLED" : "OPEN",
      quantity: input.quantity ?? "1",
      filledQuantity: input.action === "PLACE_MARKET" ? "0.5" : "0",
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
  }
}

describe("hyperliquid testnet soak scenarios", () => {
  let transport: FakeTransport
  let service: SoakExecutionService

  beforeEach(() => {
    transport = new FakeTransport()
    service = new SoakExecutionService()
  })

  it("survives websocket disconnect without inventing execution success", async () => {
    const readAdapter = new HyperliquidTradingAdapter(ADDRESS, transport, () => 1_000)
    const adapter = new HyperliquidExecutionAdapter(
      ADDRESS,
      WALLET_ID,
      service,
      () => 1_000,
      new InMemoryIdempotencyStore(),
      readAdapter,
      {
        userId: USER_ID,
        killSwitch: {
          source: "SERVER",
          globalExecutionEnabled: true,
          userExecutionEnabled: true,
          disabledMarkets: [],
        },
        fetchKillSwitch: async () => ({
          source: "SERVER",
          globalExecutionEnabled: true,
          userExecutionEnabled: true,
          disabledMarkets: [],
        }),
      }
    )
    await adapter.initialize()
    transport.handlers?.onStatus("DISCONNECTED" as HyperliquidStreamStatus)
    expect(adapter.getAccount().status).toBe("STALE")
    const result = await adapter.placeOrder({
      symbol: "ETH",
      side: "BUY",
      type: "MARKET",
      quantity: "0.1",
    })
    expect(result.ok).toBe(false)
    adapter.dispose()
  })

  it("handles backend restart then recovery", async () => {
    service.failNextSubmit = true
    const adapter = new HyperliquidExecutionAdapter(
      ADDRESS,
      WALLET_ID,
      service,
      Date.now,
      new InMemoryIdempotencyStore(),
      new HyperliquidTradingAdapter(ADDRESS, transport, () => 1_000),
      { userId: USER_ID, fetchKillSwitch: async () => ({
        source: "SERVER",
        globalExecutionEnabled: true,
        userExecutionEnabled: true,
        disabledMarkets: [],
      }) }
    )
    await adapter.initialize()
    const failed = await adapter.placeOrder({
      symbol: "ETH",
      side: "BUY",
      type: "MARKET",
      quantity: "0.1",
    })
    expect(failed.ok).toBe(false)

    service.failNextSubmit = false
    await adapter.initialize()
    const recovered = await adapter.placeOrder({
      symbol: "ETH",
      side: "BUY",
      type: "MARKET",
      quantity: "0.1",
    })
    expect(recovered.ok).toBe(true)
    adapter.dispose()
  })

  it("reconciles partial fills and submit timeouts", () => {
    const now = 1_000
    const execution: ExecutionRecord = {
      id: "e1",
      idempotencyKey: "k1",
      clientOrderId: "c1",
      action: "PLACE_MARKET",
      lifecycle: "SUBMITTED",
      symbol: "ETH",
      orderId: "hl:100",
      exchangeOrderId: "100",
      createdAt: now,
      updatedAt: now,
      error: null,
    }
    const partial = reconcileExecution({
      execution,
      orders: [
        {
          id: "hl:100",
          exchangeOrderId: "100",
          clientOrderId: "c1",
          symbol: "ETH",
          side: "BUY",
          type: "MARKET",
          triggerKind: "NONE",
          status: "PARTIALLY_FILLED",
          quantity: "1",
          filledQuantity: "0.5",
          averageFillPrice: null,
          price: null,
          triggerPrice: null,
          timeInForce: "FRONTEND_MARKET",
          reduceOnly: false,
          linkedPositionId: null,
          createdAt: now,
          updatedAt: now,
          rejectionReason: null,
        },
      ],
      positions: [],
      fills: [],
      now: now + 100,
    })
    expect(partial.lifecycle).toBe("PARTIALLY_FILLED")

    const timedOut = reconcileAfterTimeout(execution, now + 20_000, 5_000)
    expect(timedOut.lifecycle).toBe("RECONCILIATION_REQUIRED")
  })

  it("runs cancel lifecycle against an open order", async () => {
    transport.fetchSnapshot.mockResolvedValue({
      ...validRawSnapshot(),
      openOrders: [
        {
          coin: "ETH",
          oid: 100,
          side: "B",
          orderType: "Limit",
          origSz: "1",
          sz: "1",
          limitPx: "1800",
          reduceOnly: false,
          timestamp: Date.now(),
        },
      ],
    })
    const readAdapter = new HyperliquidTradingAdapter(ADDRESS, transport, () => 1_000)
    const adapter = new HyperliquidExecutionAdapter(
      ADDRESS,
      WALLET_ID,
      service,
      Date.now,
      new InMemoryIdempotencyStore(),
      readAdapter,
      { userId: USER_ID, fetchKillSwitch: async () => ({
        source: "SERVER",
        globalExecutionEnabled: true,
        userExecutionEnabled: true,
        disabledMarkets: [],
      }) }
    )
    await adapter.initialize()
    const order = adapter.getOpenOrders()[0]
    const result = await adapter.cancelOrder(order.id)
    expect(result.ok).toBe(true)
    adapter.dispose()
  })
})
