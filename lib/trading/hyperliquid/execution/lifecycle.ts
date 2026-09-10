import type { ExecutionLifecycleState } from "@/lib/trading/types"

const TERMINAL: ReadonlySet<ExecutionLifecycleState> = new Set([
  "FILLED",
  "REJECTED",
  "CANCELLED",
  "FAILED",
])

const TRANSITIONS: Record<ExecutionLifecycleState, readonly ExecutionLifecycleState[]> = {
  CREATED: ["SUBMITTED", "FAILED", "REJECTED"],
  SUBMITTED: [
    "ACKNOWLEDGED",
    "PARTIALLY_FILLED",
    "FILLED",
    "RECONCILIATION_REQUIRED",
    "FAILED",
    "REJECTED",
  ],
  ACKNOWLEDGED: [
    "PARTIALLY_FILLED",
    "FILLED",
    "CANCELLED",
    "REJECTED",
    "RECONCILIATION_REQUIRED",
    "FAILED",
  ],
  PARTIALLY_FILLED: ["FILLED", "CANCELLED", "RECONCILIATION_REQUIRED", "FAILED"],
  RECONCILIATION_REQUIRED: [
    "ACKNOWLEDGED",
    "PARTIALLY_FILLED",
    "FILLED",
    "CANCELLED",
    "REJECTED",
    "FAILED",
  ],
  FILLED: [],
  REJECTED: [],
  CANCELLED: [],
  FAILED: [],
}

export function canTransitionExecution(
  from: ExecutionLifecycleState,
  to: ExecutionLifecycleState
): boolean {
  if (from === to) return true
  return TRANSITIONS[from].includes(to)
}

export function transitionExecution(
  from: ExecutionLifecycleState,
  to: ExecutionLifecycleState
): ExecutionLifecycleState {
  if (!canTransitionExecution(from, to)) {
    throw new Error(`Invalid execution transition: ${from} -> ${to}`)
  }
  return to
}

export function isTerminalExecution(state: ExecutionLifecycleState): boolean {
  return TERMINAL.has(state)
}

export function lifecycleFromRemoteOrder(input: {
  status: "OPEN" | "PARTIALLY_FILLED" | "FILLED" | "CANCELLED" | "REJECTED"
  filledQuantity: number
  totalQuantity: number
}): ExecutionLifecycleState {
  if (input.status === "REJECTED") return "REJECTED"
  if (input.status === "CANCELLED") return "CANCELLED"
  if (input.status === "FILLED") return "FILLED"
  if (input.status === "PARTIALLY_FILLED" || input.filledQuantity > 0) {
    return "PARTIALLY_FILLED"
  }
  if (input.status === "OPEN") return "ACKNOWLEDGED"
  return "RECONCILIATION_REQUIRED"
}
