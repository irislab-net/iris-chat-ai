/**
 * CFG2 — re-exports for staking codepaths. Implementations remain in `@/config/env` (env-backed, deployment-sensitive).
 * No behavior or default changes; use this module to avoid growing direct `import.meta.env` usage in `src/staking/*`.
 */
export {
  DEBUG_LOGS,
  getRuntimeSwitchRolloutLayer,
  getRuntimeTelemetryRolloutStage,
  getRuntimeTelemetrySampleRate,
  isAppKitTronIdentityEnabled,
  isRuntimeChaosSuiteEnabled,
  isRuntimePickerDevEnabled,
  isRuntimePickerDevPanelVisible,
  isStakingReferralEnabled,
  isRuntimeSwapStressHarnessEnabled,
  isRuntimeSwitchExecutionEnabledForInternalUse,
  isRuntimeTortureSuiteEnabled,
  isStakingEthereumEnabled,
  isStakingTronEnabled,
} from "@/config/env"
