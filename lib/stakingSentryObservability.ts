/**
 * @deprecated Import from `@/lib/stakingSentry` — re-export barrel for existing call sites.
 */
export {
  STAKING_SENTRY_EVENT,
  stakingSentryBreadcrumb,
  stakingSentryRuntimeReadyOnce,
  captureStakingException,
  captureStakingNetworkError,
  captureStakingStructuredEvent,
  captureStakingConnectStall,
  captureStakingTxSignatureStall,
  captureStakingVaultTxLoadingStall,
  stakingSentryTagsFromDeployment,
  reportStakingInvariantViolation,
  installStakingVisibilityBreadcrumbs,
  registerStakingRuntimeTelemetrySentryBridge,
  type StakingSentryBreadcrumbKind,
  type StakingConnectStallReportContext,
  type StakingTxSignatureStallReportContext,
  type StakingVaultTxLoadingStallContext,
  type StakingSentryTagContext,
  type StakingSentryEventName,
} from "@/lib/stakingSentry"
