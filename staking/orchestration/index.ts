export type {
  UnifiedWalletRuntimeNamespace,
  UnifiedWalletAppKitClient,
} from "@/staking/orchestration/openUnifiedWallet"
export {
  resolveAppKitCaipNetworkForDeployment,
  openUnifiedWallet,
  openUnifiedAccountView,
  requestUnifiedNetworkSwitch,
} from "@/staking/orchestration/openUnifiedWallet"

export { useUnifiedWalletAppKitClient } from "@/staking/orchestration/useUnifiedWalletOrchestration"
export type { UnifiedWalletOrchestrationActions } from "@/staking/orchestration/useUnifiedWalletOrchestration"
export { useUnifiedWalletOrchestration } from "@/staking/orchestration/useUnifiedWalletOrchestration"
export {
  stakingMobileResumeStore,
  isRecentBfCacheRestore,
  isWalletHandoffLikely,
} from "@/staking/orchestration/stakingMobileResumeCoordinator"

export type { RuntimeTransitionSequenceStage } from "@/staking/orchestration/runtimeTransitionSequence"
export {
  sequenceStageAllowsBalanceRefresh,
  sequenceStageAllowsAsyncCommit,
  sequenceStageAllowsRuntimeSelectionSwap,
  devAssertRuntimeTransitionSequence,
  assertRuntimeSelectionMutationPhase,
} from "@/staking/orchestration/runtimeTransitionSequence"

export type {
  RuntimeTransitionCoordinatorSnapshot,
  TransitionGeneration,
} from "@/staking/orchestration/runtimeTransitionCoordinator"
export {
  buildRuntimeTransitionCoordinatorSnapshot,
  coordinatorSnapshotFromExecutionIdentity,
  canRuntimeOperationRefresh,
  canRuntimeOperationCommit,
  summarizeCoordinatorSnapshotForTelemetry,
  explainCanRuntimeOperationCommitDenied,
  explainCanRuntimeOperationRefreshDenied,
  maybeDevTraceRuntimeAsyncCommitRejected,
  canRuntimeOperationCommitWithDevTrace,
  STAKING_TRANSITION_GENERATION_INITIAL,
} from "@/staking/orchestration/runtimeTransitionCoordinator"

export type {
  RuntimeSwapPolicyResult,
  RuntimeSwapPolicyDenialReason,
  RuntimeSwapTxModalSurface,
  RuntimeSwapPolicyEvaluateInput,
} from "@/staking/orchestration/runtimeSwapPolicy"
export {
  RUNTIME_SWAP_POLICY_DENIAL_MESSAGES,
  isRuntimeSwapEntryAllowed,
  setRuntimeSwapStressTxModalSurfaceOverride,
  registerRuntimeSwapTxModalSurfaceGetter,
  getRuntimeSwapTxModalSurfaceForPolicy,
  validateRuntimeWalletCompatibility,
  evaluateRuntimeSwapPolicy,
} from "@/staking/orchestration/runtimeSwapPolicy"

export type {
  RuntimeSwapRequest,
  RuntimeSwapFailureReason,
  RuntimeSwapResult,
} from "@/staking/orchestration/runtimeSwapEngine"
export { executeRuntimeSwap } from "@/staking/orchestration/runtimeSwapEngine"

export type { RegistrySizeBaseline } from "@/staking/orchestration/runtimeLifecycleAssertions"
export {
  captureRegistrySizeBaseline,
  assertRegistryGrowthBounded,
  assertSingleOrchestratorSession,
  assertFrozenTxRuntimeMatchesPassive,
  buildSyntheticPersistedStakingTxSessionV1,
  assertGenerationAdvanced,
  summarizeTortureLifecycleCounters,
} from "@/staking/orchestration/runtimeLifecycleAssertions"

import { devRegisterStakingPackageOwner } from "@/staking/diagnostics/stakingBoundaryRules"
devRegisterStakingPackageOwner("orchestration")
