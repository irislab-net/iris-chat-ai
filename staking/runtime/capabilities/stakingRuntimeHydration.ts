/**
 * CFG6 — single session predicate for “may this deployment run staking refresh / reads / history?”.
 */
import {
  isCfg6StakingRuntimeDisabledSentinel,
} from "@/staking/runtime/capabilities/stakingRuntimeDisabledSentinel"
import { isRuntimeFamilyEnabled } from "@/staking/runtime/capabilities/stakingRuntimeFamilyRollout"
import type { StakingDeploymentConfig } from "@/staking/core/types"

export function isStakingVaultRuntimeHydrationEnabled(
  deployment: StakingDeploymentConfig
): boolean {
  if (isCfg6StakingRuntimeDisabledSentinel(deployment)) return false
  return isRuntimeFamilyEnabled(deployment.chainFamily)
}
