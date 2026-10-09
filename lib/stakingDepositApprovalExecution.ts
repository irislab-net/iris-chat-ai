/**
 * Single source of truth: whether an on-chain ERC20 `approve` runs in the deposit flow.
 *
 * Call-sites must branch only on `DepositApprovalExecution`, not parallel booleans.
 *
 * **Allowance sizing** (exact deposit wei vs `MaxUint256`) is implemented in
 * `useStakingVault.ensureAllowance` — this module only classifies *whether* an approve step runs.
 */

export type DepositApprovalExecution =
  | "skip"
  | "limited_approve"
  | "unlimited_approve"

export type StakingApprovalMode = "limited" | "unlimited"

export type DepositApprovalKind = "insufficient" | "downgrade_only"

export type DeriveDepositApprovalExecutionInput = {
  needsApproval: boolean
  depositApprovalKind: DepositApprovalKind | null | undefined
  approvalMode: StakingApprovalMode
}

/**
 * @see plan truth table: insufficient/degrade_only × limited/unlimited.
 * When `needsApproval` is false, always `"skip"`.
 * When `needsApproval` is true and kind is missing, treat as `"skip"` (defensive).
 */
export function deriveDepositApprovalExecution(
  input: DeriveDepositApprovalExecutionInput
): DepositApprovalExecution {
  if (!input.needsApproval) return "skip"
  const kind = input.depositApprovalKind
  if (kind !== "insufficient" && kind !== "downgrade_only") return "skip"

  if (kind === "insufficient") {
    return input.approvalMode === "unlimited"
      ? "unlimited_approve"
      : "limited_approve"
  }

  // downgrade_only
  return input.approvalMode === "unlimited"
    ? "skip"
    : "limited_approve"
}
