import { deriveDepositApprovalExecution } from "@/lib/stakingDepositApprovalExecution"
import { tryParseAmountWei } from "@/lib/stakingAmountInput"
import type { TransactionStatusSnapshot } from "@/staking/tx/types/transactionStatusSnapshot"
import {
  verifyStakingApprovalOnChain,
  type StakingApprovalOnChainVerifyInput,
} from "@/staking/tx/stakingPostReturnApprovalVerification"
import type { StakingDeploymentConfig } from "@/staking/core/types"

function parseRequiredWeiFromSnapshot(
  snap: TransactionStatusSnapshot,
  tokenDecimals: number | null
): bigint | null {
  if (tokenDecimals === null || snap.scenario !== "deposit") return null
  const m = /^([0-9]+(?:[.,][0-9]+)?)/.exec(snap.amountLabel.trim())
  const human = m?.[1]?.replace(",", ".") ?? ""
  if (!human) return null
  return tryParseAmountWei(human, tokenDecimals)
}

export function snapshotNeedsApprovalRecoveryCheck(
  snap: TransactionStatusSnapshot
): boolean {
  if (!snap.dialogOpen || snap.scenario !== "deposit") return false
  if (snap.approveComplete || Boolean(snap.approveTxHash?.trim())) return false
  const execution = deriveDepositApprovalExecution({
    needsApproval: snap.needsApproval,
    depositApprovalKind: snap.depositApprovalKind,
    approvalMode: snap.approvalMode,
  })
  if (execution === "skip") return false
  return (
    snap.uiPhase === "awaiting_signature" ||
    snap.uiPhase === "submitted" ||
    snap.uiPhase === "confirming" ||
    snap.uiPhase === "cancelled"
  )
}

export async function tryRecoverStakingApprovalFromOnChainAllowance(input: Readonly<{
  snapshot: TransactionStatusSnapshot
  deployment: StakingDeploymentConfig
  tokenAddress: string | null
  tokenDecimals: number | null
  ownerAddress: string | null | undefined
  source: string
}>): Promise<boolean> {
  const { snapshot, deployment, tokenAddress, tokenDecimals, ownerAddress, source } =
    input
  if (!snapshotNeedsApprovalRecoveryCheck(snapshot)) return false
  if (!tokenAddress?.trim() || !ownerAddress?.trim()) return false
  const requiredWei = parseRequiredWeiFromSnapshot(snapshot, tokenDecimals)
  if (requiredWei === null || requiredWei <= 0n) return false

  const verifyInput: StakingApprovalOnChainVerifyInput = {
    deployment,
    tokenAddress,
    ownerAddress,
    requiredWei,
    approvalMode: snapshot.approvalMode,
    submissionId: snapshot.submissionId,
    source,
  }
  const { sufficient } = await verifyStakingApprovalOnChain(verifyInput)
  return sufficient
}
