/** Shared staking primary CTA / snapshot-derived transaction step. */
export type StakingCtaTxPhase =
  | "idle"
  | "preview"
  | "preparing_transaction"
  | "approving"
  | "depositing"
  | "depositAfterApproval"
  | "withdrawing"
  | "submitted"
  | "confirming"
  | "confirmed"
  | "failed"
  | "cancelled"
