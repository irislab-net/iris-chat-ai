import { describe, expect, it } from "vitest"

import {
  canTransitionExecution,
  lifecycleFromRemoteOrder,
  transitionExecution,
} from "@/lib/trading/hyperliquid/execution/lifecycle"
import {
  InMemoryIdempotencyStore,
  reconcileAfterTimeout,
  reconcileExecution,
  reserveIdempotencyKey,
} from "@/lib/trading/hyperliquid/execution/security"
import type { ExecutionRecord, Order, Position } from "@/lib/trading/types"

describe("execution lifecycle", () => {
  it("allows valid transitions and blocks invalid ones", () => {
    expect(canTransitionExecution("CREATED", "SUBMITTED")).toBe(true)
    expect(canTransitionExecution("FILLED", "SUBMITTED")).toBe(false)
    expect(transitionExecution("CREATED", "SUBMITTED")).toBe("SUBMITTED")
  })

  it("maps remote order status into lifecycle states", () => {
    expect(
      lifecycleFromRemoteOrder({
        status: "PARTIALLY_FILLED",
        filledQuantity: 1,
        totalQuantity: 2,
      })
    ).toBe("PARTIALLY_FILLED")
    expect(
      lifecycleFromRemoteOrder({
        status: "OPEN",
        filledQuantity: 0,
        totalQuantity: 2,
      })
    ).toBe("ACKNOWLEDGED")
  })
})

describe("execution security and reconciliation", () => {
  const baseExecution: ExecutionRecord = {
    id: "exec-1",
    idempotencyKey: "idem-1",
    clientOrderId: "client-1",
    action: "PLACE_MARKET",
    lifecycle: "SUBMITTED",
    symbol: "ETH",
    orderId: "hl:42",
    exchangeOrderId: "42",
    createdAt: 1_000,
    updatedAt: 1_000,
    error: null,
  }

  it("blocks replayed idempotency keys", () => {
    const store = new InMemoryIdempotencyStore()
    expect(reserveIdempotencyKey({ store, idempotencyKey: "k1", executionId: "e1" })).toEqual({
      ok: true,
    })
    expect(reserveIdempotencyKey({ store, idempotencyKey: "k1", executionId: "e2" })).toMatchObject({
      ok: false,
      error: { code: "REPLAY_DETECTED" },
    })
  })

  it("reconciles acknowledged orders from remote open orders", () => {
    const orders: Order[] = [
      {
        id: "hl:42",
        exchangeOrderId: "42",
        clientOrderId: "client-1",
        symbol: "ETH",
        side: "BUY",
        type: "MARKET",
        triggerKind: "NONE",
        status: "OPEN",
        quantity: "2",
        filledQuantity: "0",
        averageFillPrice: null,
        price: null,
        triggerPrice: null,
        timeInForce: "FRONTEND_MARKET",
        reduceOnly: false,
        linkedPositionId: null,
        createdAt: 1_000,
        updatedAt: 1_000,
        rejectionReason: null,
      },
    ]
    const reconciled = reconcileExecution({
      execution: baseExecution,
      orders,
      positions: [],
      fills: [],
      now: 2_000,
    })
    expect(reconciled.lifecycle).toBe("ACKNOWLEDGED")
  })

  it("marks timeout submissions as reconciliation required", () => {
    const reconciled = reconcileAfterTimeout(baseExecution, 20_000, 5_000)
    expect(reconciled.lifecycle).toBe("RECONCILIATION_REQUIRED")
    expect(reconciled.error?.code).toBe("RECONCILIATION_REQUIRED")
  })

  it("treats closed positions as filled for close actions", () => {
    const execution: ExecutionRecord = {
      ...baseExecution,
      action: "CLOSE_POSITION",
      lifecycle: "ACKNOWLEDGED",
    }
    const positions: Position[] = []
    const reconciled = reconcileExecution({
      execution,
      orders: [],
      positions,
      fills: [],
      now: 2_000,
    })
    expect(reconciled.lifecycle).toBe("FILLED")
  })
})
