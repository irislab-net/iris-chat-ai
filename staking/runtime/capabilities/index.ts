/**
 * CFG6 — centralized **family rollout** + **hydration** guards for staking runtime entrypoints.
 */
export {
  buildCfg6StakingRuntimeDisabledSentinelDeployment,
  CFG6_STAKING_RUNTIME_DISABLED_DEPLOYMENT_ID,
  isCfg6StakingRuntimeDisabledSentinel,
  resolveStakingDeploymentForActiveSelection,
} from "@/staking/runtime/capabilities/stakingRuntimeDisabledSentinel"
export {
  getEnabledRuntimeFamilies,
  isRuntimeFamilyEnabled,
} from "@/staking/runtime/capabilities/stakingRuntimeFamilyRollout"
export { isStakingVaultRuntimeHydrationEnabled } from "@/staking/runtime/capabilities/stakingRuntimeHydration"
