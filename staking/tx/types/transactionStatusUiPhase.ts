/**
 * Neutral tx modal UI phase contract (runtime policy + persistence + CTA derivation).
 * No React; safe for `staking/core` and `staking/dev`.
 */

/** Summary screen before wallet; wires stay idle */
export type TransactionStatusUiPhase =
  | "preview"
  /** @deprecated Prefer `awaiting_signature`; still set by legacy `openPending` */
  | "pending"
  | "awaiting_signature"
  | "submitted"
  | "confirming"
  /** Terminal success (same UX as legacy `success`) */
  | "confirmed"
  /** Terminal failure (same UX as legacy `error`) */
  | "failed"
  /** User dismissed modal during an in-flight step — brief epilogue before close */
  | "cancelled"
  /** @deprecated Use `confirmed` */
  | "success"
  /** @deprecated Use `failed` */
  | "error"

const IN_FLIGHT_UI_PHASES: ReadonlySet<TransactionStatusUiPhase> = new Set([
  "pending",
  "awaiting_signature",
  "submitted",
  "confirming",
])

/** Phases that do not block runtime swap when modal is open with a frozen runtime row. */
export const TERMINAL_UI_PHASES_FOR_RUNTIME_SWAP: ReadonlySet<TransactionStatusUiPhase> =
  new Set<TransactionStatusUiPhase>([
    "confirmed",
    "failed",
    "cancelled",
    "success",
    "error",
  ])

export function isTransactionStatusInFlightPhase(
  phase: TransactionStatusUiPhase | null
): boolean {
  return phase !== null && IN_FLIGHT_UI_PHASES.has(phase)
}

export function isTransactionStatusTerminalUiPhase(
  phase: TransactionStatusUiPhase | null
): boolean {
  return phase !== null && TERMINAL_UI_PHASES_FOR_RUNTIME_SWAP.has(phase)
}
