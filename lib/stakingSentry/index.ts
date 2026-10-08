export {
  STAKING_SENTRY_EVENT,
  RUNTIME_TELEMETRY_TO_SENTRY,
  type StakingSentryEventName,
} from "@/lib/stakingSentry/taxonomy"

export type {
  StakingCanonicalTags,
  StakingStructuredContexts,
  StakingSentryTagContext,
} from "@/lib/stakingSentry/types"

export {
  shouldEmitStakingSentryEvent,
  resetStakingSentryDedupeForTests,
} from "@/lib/stakingSentry/dedupe"

export {
  stakingSentryBreadcrumb,
  stakingSentryRuntimeReadyOnce,
  type StakingSentryBreadcrumbKind,
} from "@/lib/stakingSentry/breadcrumbs"

export {
  captureStakingStructuredEvent,
  captureStakingException,
  stakingSentryTagsFromDeployment,
  type StakingSentryLevel,
} from "@/lib/stakingSentry/capture"

export { captureStakingNetworkError } from "@/lib/stakingSentry/captureNetworkError"

export {
  captureStakingConnectStall,
  captureStakingTxSignatureStall,
  captureStakingVaultTxLoadingStall,
  type StakingConnectStallReportContext,
  type StakingTxSignatureStallReportContext,
  type StakingVaultTxLoadingStallContext,
} from "@/lib/stakingSentry/stalls"

export { reportStakingInvariantViolation } from "@/lib/stakingSentry/invariants"

export { installStakingVisibilityBreadcrumbs } from "@/lib/stakingSentry/visibility"

export { registerStakingRuntimeTelemetrySentryBridge } from "@/lib/stakingSentry/runtimeTelemetryBridge"

export { readStakingClientEnvironmentTags } from "@/lib/stakingSentry/tags"
