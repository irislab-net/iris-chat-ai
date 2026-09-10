export type ExecutionObservabilityPhase =
  | "INTENT_CREATED"
  | "VALIDATION_PASSED"
  | "VALIDATION_FAILED"
  | "KILL_SWITCH_BLOCKED"
  | "RATE_LIMIT_BLOCKED"
  | "SIGNING_STARTED"
  | "SUBMITTED"
  | "EXCHANGE_RESPONSE"
  | "FILLED"
  | "REJECTED"
  | "RECONCILIATION_STARTED"
  | "RECONCILIATION_COMPLETED"

export type ExecutionObservabilityEvent = {
  phase: ExecutionObservabilityPhase
  requestId: string
  userId: string | null
  walletIdentityId: string | null
  symbol: string
  action: string
  clientOrderId: string | null
  exchangeOrderId: string | null
  idempotencyKey: string | null
  lifecycle: string | null
  reason: string | null
  occurredAt: number
}

export type ExecutionObservabilitySink = (event: ExecutionObservabilityEvent) => void

let globalSink: ExecutionObservabilitySink | null = null
const buffer: ExecutionObservabilityEvent[] = []
const MAX_BUFFER = 500

export function setExecutionObservabilitySink(sink: ExecutionObservabilitySink | null): void {
  globalSink = sink
}

export function getExecutionObservabilityBuffer(): readonly ExecutionObservabilityEvent[] {
  return buffer
}

export function clearExecutionObservabilityBuffer(): void {
  buffer.length = 0
}

export function emitExecutionObservability(input: {
  phase: ExecutionObservabilityPhase
  requestId: string
  userId?: string | null
  walletIdentityId?: string | null
  symbol: string
  action: string
  clientOrderId?: string | null
  exchangeOrderId?: string | null
  idempotencyKey?: string | null
  lifecycle?: string | null
  reason?: string | null
  now?: number
}): ExecutionObservabilityEvent {
  const event: ExecutionObservabilityEvent = {
    phase: input.phase,
    requestId: input.requestId,
    userId: input.userId ?? null,
    walletIdentityId: input.walletIdentityId ?? null,
    symbol: input.symbol,
    action: input.action,
    clientOrderId: input.clientOrderId ?? null,
    exchangeOrderId: input.exchangeOrderId ?? null,
    idempotencyKey: input.idempotencyKey ?? null,
    lifecycle: input.lifecycle ?? null,
    reason: input.reason ?? null,
    occurredAt: input.now ?? Date.now(),
  }
  buffer.push(event)
  if (buffer.length > MAX_BUFFER) buffer.shift()
  globalSink?.(event)
  return event
}

/** Safe structured log — never includes keys, signatures, or secrets. */
export function formatExecutionObservabilityEvent(
  event: ExecutionObservabilityEvent
): string {
  return JSON.stringify({
    phase: event.phase,
    requestId: event.requestId,
    userId: event.userId,
    walletIdentityId: event.walletIdentityId,
    symbol: event.symbol,
    action: event.action,
    clientOrderId: event.clientOrderId,
    exchangeOrderId: event.exchangeOrderId,
    idempotencyKey: event.idempotencyKey,
    lifecycle: event.lifecycle,
    reason: event.reason,
    occurredAt: event.occurredAt,
  })
}
