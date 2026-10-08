/** Per-step wiring phase for deposit / withdraw modal rows. */
export type TransactionWireStepPhase =
  | "idle"
  | "awaiting_signature"
  | "submitted"
  | "confirming"
  | "done"
  | "failed"
