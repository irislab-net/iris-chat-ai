import { ERC20_ABI } from "@/abis/stakingVault"
import { STAKING_VAULT_ADDRESS } from "@/constants/stakingVaultConfig"
import type { StakingApprovalMode } from "@/lib/stakingDepositApprovalExecution"
import { isUnlimitedErc20Allowance } from "@/lib/stakingAllowanceLimits"
import { getJsonRpcProviderForDeployment } from "@/staking/core/runtimeFamilyDispatch"
import type { StakingDeploymentConfig } from "@/staking/core/types"
import { traceMobileStakingFlow } from "@/staking/diagnostics/mobileStakingLanLog"
import { Contract, getAddress } from "ethers"

export type StakingApprovalOnChainVerifyInput = Readonly<{
  deployment: StakingDeploymentConfig
  tokenAddress: string
  ownerAddress: string
  requiredWei: bigint
  approvalMode: StakingApprovalMode
  submissionId?: number | null
  source: string
}>

export function isOnChainAllowanceSufficientForDeposit(
  allowance: bigint,
  requiredWei: bigint,
  approvalMode: StakingApprovalMode
): boolean {
  if (approvalMode === "unlimited") {
    return isUnlimitedErc20Allowance(allowance) || allowance >= requiredWei
  }
  return allowance >= requiredWei
}

async function readAllowanceOnce(
  input: StakingApprovalOnChainVerifyInput
): Promise<{ sufficient: boolean; allowanceWei: bigint }> {
  const provider = getJsonRpcProviderForDeployment(input.deployment)
  const token = new Contract(input.tokenAddress, ERC20_ABI, provider)
  const owner = getAddress(input.ownerAddress)
  const allowance = (await token.allowance(owner, STAKING_VAULT_ADDRESS)) as bigint
  const sufficient = isOnChainAllowanceSufficientForDeposit(
    allowance,
    input.requiredWei,
    input.approvalMode
  )
  return { sufficient, allowanceWei: allowance }
}

export async function verifyStakingApprovalOnChain(
  input: StakingApprovalOnChainVerifyInput
): Promise<{ sufficient: boolean; allowanceWei: bigint | null }> {
  traceMobileStakingFlow("allowance_after_approval_read_start", {
    submissionId: input.submissionId,
    source: input.source,
    requiredWei: input.requiredWei.toString(),
  })
  const maxAttempts = 2
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const { sufficient, allowanceWei } = await readAllowanceOnce(input)
      traceMobileStakingFlow("allowance_after_approval_read_result", {
        submissionId: input.submissionId,
        source: input.source,
        allowanceWei: allowanceWei.toString(),
        requiredWei: input.requiredWei.toString(),
        sufficient,
        attempt,
      })
      return { sufficient, allowanceWei }
    } catch (err) {
      if (attempt < maxAttempts) {
        await new Promise(resolve => window.setTimeout(resolve, 400))
        continue
      }
      traceMobileStakingFlow(
        "allowance_after_approval_read_result",
        {
          submissionId: input.submissionId,
          source: input.source,
          sufficient: false,
          readFailed: true,
          attempt,
        },
        err
      )
      return { sufficient: false, allowanceWei: null }
    }
  }
  return { sufficient: false, allowanceWei: null }
}
