import { logger } from "@/lib/logger"
import { stakingHistoryCacheKey } from "@/staking/execution/stakingEtherscanHistory"
import type { StakingDeploymentConfig } from "@/staking/core/types"
import type { BuildStakingHistoryKeyInput } from "@/staking/history/stakingHistoryTypes"
import { isCfg6StakingRuntimeDisabledSentinel } from "@/staking/runtime/capabilities/stakingRuntimeDisabledSentinel"

let stakingHistoryWarnedDeprecatedZeroBlock = false

export function normalizeHistoryLatestScannedBlock(
  n: number | null | undefined
): number | null {
  if (n === undefined || n === null) return null
  if (n === 0) {
    if (!stakingHistoryWarnedDeprecatedZeroBlock) {
      stakingHistoryWarnedDeprecatedZeroBlock = true
      logger.warn("[staking] latestScannedBlock=0 is deprecated and ignored")
    }
    return null
  }
  return n
}

export function chainSegmentForStakingHistoryCache(
  d: StakingDeploymentConfig
): string {
  if (d.chainFamily === "tron") return d.caip2.trim()
  const m = /^eip155:(\d+)$/i.exec(d.caip2.trim())
  return m ? m[1] : d.caip2.trim()
}

export function buildStakingHistoryKey(
  input: BuildStakingHistoryKeyInput
): string | null {
  const { stakingOwnerAddress, tokenAddress, deployment } = input
  if (isCfg6StakingRuntimeDisabledSentinel(deployment)) return null
  if (!stakingOwnerAddress || !tokenAddress) return null
  return stakingHistoryCacheKey({
    deploymentId: deployment.id.trim(),
    chainSegment: chainSegmentForStakingHistoryCache(deployment),
    walletAddress: stakingOwnerAddress,
    tokenAddress,
    vaultAddress: deployment.vault.address,
  })
}
