import type {
  ExecutionAuditEvent,
  ExecutionAuditEventType,
  ExecutionRecord,
  Fill,
  Order,
  OrderStatus,
  Position,
  TradingError,
} from "@/lib/trading/types"
import {
  isTerminalExecution,
  lifecycleFromRemoteOrder,
  transitionExecution,
} from "@/lib/trading/hyperliquid/execution/lifecycle"

export type IdempotencyStore = {
  has(key: string): boolean
  reserve(key: string, executionId: string): boolean
  getExecutionId(key: string): string | undefined
}

export class InMemoryIdempotencyStore implements IdempotencyStore {
  private readonly keys = new Map<string, string>()

  has(key: string): boolean {
    return this.keys.has(key)
  }

  reserve(key: string, executionId: string): boolean {
    if (this.keys.has(key)) return false
    this.keys.set(key, executionId)
    return true
  }

  getExecutionId(key: string): string | undefined {
    return this.keys.get(key)
  }
}

export function createIdempotencyKey(prefix = "iris"): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}:${crypto.randomUUID()}`
  }
  return `${prefix}:${Date.now()}:${Math.random().toString(16).slice(2)}`
}

export function createClientOrderId(prefix = "iris"): string {
  return createIdempotencyKey(prefix)
}

export function auditExecutionEvent(input: {
  type: ExecutionAuditEventType
  executionId: string
  userId?: string | null
  walletIdentityId?: string | null
  idempotencyKey: string
  reason?: string | null
  now?: number
  sink?: (event: ExecutionAuditEvent) => void
}): ExecutionAuditEvent {
  const event: ExecutionAuditEvent = {
    type: input.type,
    executionId: input.executionId,
    userId: input.userId ?? null,
    walletIdentityId: input.walletIdentityId ?? null,
    idempotencyKey: input.idempotencyKey,
    reason: input.reason ?? null,
    occurredAt: input.now ?? Date.now(),
  }
  input.sink?.(event)
  return event
}

export function reserveIdempotencyKey(input: {
  store: IdempotencyStore
  idempotencyKey: string
  executionId: string
  onAudit?: (event: ExecutionAuditEvent) => void
}): { ok: true } | { ok: false; error: TradingError } {
  if (input.store.has(input.idempotencyKey)) {
    auditExecutionEvent({
      type: "EXECUTION_REPLAY_BLOCKED",
      executionId: input.store.getExecutionId(input.idempotencyKey) ?? input.executionId,
      idempotencyKey: input.idempotencyKey,
      reason: "Duplicate idempotency key",
      sink: input.onAudit,
    })
    return {
      ok: false,
      error: {
        code: "REPLAY_DETECTED",
        message: "This execution request was already submitted.",
        retryable: false,
      },
    }
  }
  input.store.reserve(input.idempotencyKey, input.executionId)
  return { ok: true }
}

export type ReconciliationInput = {
  execution: ExecutionRecord
  orders: readonly Order[]
  positions: readonly Position[]
  fills: readonly Fill[]
  now?: number
}

function mapOrderStatusForLifecycle(
  status: OrderStatus
): "OPEN" | "PARTIALLY_FILLED" | "FILLED" | "CANCELLED" | "REJECTED" {
  if (status === "PARTIALLY_FILLED") return "PARTIALLY_FILLED"
  if (status === "FILLED") return "FILLED"
  if (status === "CANCELLED" || status === "CANCEL_PENDING") return "CANCELLED"
  if (status === "REJECTED") return "REJECTED"
  return "OPEN"
}

export function reconcileExecution(input: ReconciliationInput): ExecutionRecord {
  const now = input.now ?? Date.now()
  const { execution } = input

  if (isTerminalExecution(execution.lifecycle)) {
    return execution
  }

  const order = execution.exchangeOrderId
    ? input.orders.find((item) => item.exchangeOrderId === execution.exchangeOrderId)
    : execution.orderId
      ? input.orders.find((item) => item.id === execution.orderId)
      : undefined

  if (order) {
    const filled = Number(order.filledQuantity)
    const total = Number(order.quantity)
    const nextLifecycle = lifecycleFromRemoteOrder({
      status: mapOrderStatusForLifecycle(order.status),
      filledQuantity: Number.isFinite(filled) ? filled : 0,
      totalQuantity: Number.isFinite(total) ? total : 0,
    })
    return {
      ...execution,
      lifecycle: transitionExecution(execution.lifecycle, nextLifecycle),
      orderId: order.id,
      exchangeOrderId: order.exchangeOrderId,
      updatedAt: now,
      error: order.status === "REJECTED" ? execution.error : null,
    }
  }

  if (execution.action === "CLOSE_POSITION") {
    const stillOpen = input.positions.some(
      (position) => position.symbol === execution.symbol && Number(position.quantity) > 0
    )
    if (!stillOpen && execution.lifecycle !== "CREATED") {
      return {
        ...execution,
        lifecycle: transitionExecution(execution.lifecycle, "FILLED"),
        updatedAt: now,
      }
    }
  }

  const hasFill = input.fills.some(
    (fill) =>
      fill.orderId === execution.orderId ||
      (execution.exchangeOrderId != null && fill.orderId === `hl:${execution.exchangeOrderId}`)
  )
  if (hasFill && execution.lifecycle === "SUBMITTED") {
    return {
      ...execution,
      lifecycle: transitionExecution(execution.lifecycle, "ACKNOWLEDGED"),
      updatedAt: now,
    }
  }

  if (
    execution.lifecycle === "SUBMITTED" ||
    execution.lifecycle === "ACKNOWLEDGED" ||
    execution.lifecycle === "PARTIALLY_FILLED"
  ) {
    return {
      ...execution,
      lifecycle: transitionExecution(execution.lifecycle, "RECONCILIATION_REQUIRED"),
      updatedAt: now,
      error: {
        code: "RECONCILIATION_REQUIRED",
        message: "Execution state could not be confirmed against Hyperliquid.",
        retryable: true,
      },
    }
  }

  return execution
}

export function reconcileAfterTimeout(
  execution: ExecutionRecord,
  now = Date.now(),
  timeoutMs = 15_000
): ExecutionRecord {
  if (isTerminalExecution(execution.lifecycle)) return execution
  if (now - execution.updatedAt < timeoutMs) return execution
  return {
    ...execution,
    lifecycle: transitionExecution(execution.lifecycle, "RECONCILIATION_REQUIRED"),
    updatedAt: now,
    error: {
      code: "RECONCILIATION_REQUIRED",
      message: "No confirmation received after submit timeout.",
      retryable: true,
    },
  }
}
