/**
 * Phase 38 — DEV-only lifecycle assertions for runtime torture / long-session verification.
 * No production side effects; callers must gate on `isRuntimeTortureSuiteEnabled()` or similar.
 */
import { getStakingRefreshOrchestratorDevSnapshot } from "@/staking/refresh"
import { getStakingProviderRegistryDevSnapshot } from "@/staking/core/providerRegistry"
import type { PersistedStakingTxSessionV1 } from "@/staking/tx"
import { createActiveSubmissionTerminalFields, emptyStakingFeeCanonicalPair } from "@/staking/tx"
import type {
  TransactionRuntimeSnapshot,
} from "@/staking/core/persistenceTypes"
import { resolveFrozenExecutionTarget } from "@/staking/core/persistenceTypes"
import type { TransactionStatusSnapshot } from "@/staking/tx/types/transactionStatusSnapshot"
import { STAKING_DEFAULT_STABLECOIN_LABEL } from "@/staking/config"
import type { ActiveRuntimeSelection } from "@/staking/core/runtimeSelection"
import { buildTransactionRuntimeSnapshot } from "@/staking/core/runtimeTransition"
import {
  deriveRuntimeExecutionTarget,
  executionTargetEquals,
} from "@/staking/core/runtimeExecutionTarget"
import {
  getRuntimeTortureCounterSnapshot,
  traceRuntimeInvariantViolation,
  traceRuntimeStressLeak,
} from "@/staking/core/runtimeTransitionTelemetry"

export type RegistrySizeBaseline = ReturnType<typeof getStakingProviderRegistryDevSnapshot>

export function captureRegistrySizeBaseline(): RegistrySizeBaseline {
  return getStakingProviderRegistryDevSnapshot()
}

/** Warn when any registry map grew more than `maxDelta` vs baseline (per long session). */
export function assertRegistryGrowthBounded(
  baseline: RegistrySizeBaseline,
  maxDelta: number,
  label = "torture"
): boolean {
  const cur = getStakingProviderRegistryDevSnapshot()
  const keys = [
    "evmJsonRpcProviders",
    "tronHttpProviders",
    "receiptResolvers",
    "wsProviders",
  ] as const
  let ok = true
  for (const k of keys) {
    const d = cur[k] - baseline[k]
    if (d > maxDelta) {
      ok = false
      traceRuntimeStressLeak("registry_growth_exceeded", { label, key: k, delta: d, baseline, cur })
    }
  }
  return ok
}

/** At most one orchestrator session should be active at a time. */
export function assertSingleOrchestratorSession(): boolean {
  const s = getStakingRefreshOrchestratorDevSnapshot()
  if (s.hasSession && s.tortureSessionId == null) {
    traceRuntimeInvariantViolation("torture_orch_session_id_missing_while_active", { snapshot: s })
    return false
  }
  return true
}

/**
 * Sanity check when passive and frozen are expected to agree (e.g. synthetic row built from current passive).
 * After a runtime swap with an open modal, frozen snapshot may legitimately diverge from passive; do not use this there.
 */
export function assertFrozenTxRuntimeMatchesPassive(
  snapshot: TransactionStatusSnapshot,
  passive: ActiveRuntimeSelection
): boolean {
  if (snapshot.transactionRuntime == null) return true
  const frozenTarget = resolveFrozenExecutionTarget(snapshot.transactionRuntime)
  const passiveTarget = deriveRuntimeExecutionTarget(passive)
  const ok = executionTargetEquals(frozenTarget, passiveTarget)
  if (!ok) {
    traceRuntimeInvariantViolation("torture_frozen_runtime_passive_target_skew", {
      frozenTarget,
      passiveTarget,
    })
  }
  return ok
}

/** Synthetic persisted row for torture hydrate loops (non-terminal modal + frozen runtime). */
export function buildSyntheticPersistedStakingTxSessionV1(input: Readonly<{
  walletAddress: string
  chainId: number
  passive: ActiveRuntimeSelection
}>): PersistedStakingTxSessionV1 {
  const txRt: TransactionRuntimeSnapshot = buildTransactionRuntimeSnapshot(input.passive)
  const snap: TransactionStatusSnapshot = {
    dialogOpen: true,
    uiPhase: "awaiting_signature",
    scenario: "deposit",
    transactionRuntime: txRt,
    frozenVaultTokenSymbol: STAKING_DEFAULT_STABLECOIN_LABEL,
    needsApproval: false,
    depositApprovalKind: null,
    approvalMode: "limited",
    amountLabel: "0",
    feeLine: "",
    feeCanonical: emptyStakingFeeCanonicalPair(),
    preparingTransaction: false,
    previewGasEstimateReady: false,
    approveComplete: false,
    approveTxHash: null,
    depositTxHash: null,
    withdrawTxHash: null,
    approveWirePhase: "idle",
    depositWirePhase: "awaiting_signature",
    withdrawWirePhase: "idle",
    txHash: null,
    submittedAt: null,
    confirmations: null,
    successAmountLabel: "",
    successFeeLine: "",
    successExplorerUrl: null,
    errorMessage: "",
    ...createActiveSubmissionTerminalFields(1),
  }
  return {
    v: 1,
    updatedAt: Date.now(),
    walletAddress: input.walletAddress,
    chainId: input.chainId,
    snapshot: snap,
  }
}

/** After a generation bump, a stale identity must not equal the latest passive row. */
export function assertGenerationAdvanced(
  before: Pick<ActiveRuntimeSelection, "generation">,
  after: Pick<ActiveRuntimeSelection, "generation">
): boolean {
  const ok = Number(after.generation) > Number(before.generation)
  if (!ok) {
    traceRuntimeInvariantViolation("torture_generation_not_advanced", {
      before: Number(before.generation),
      after: Number(after.generation),
    })
  }
  return ok
}

export function summarizeTortureLifecycleCounters(): Readonly<{
  torture: ReturnType<typeof getRuntimeTortureCounterSnapshot>
  registry: ReturnType<typeof getStakingProviderRegistryDevSnapshot>
  orchestrator: ReturnType<typeof getStakingRefreshOrchestratorDevSnapshot>
}> {
  return {
    torture: getRuntimeTortureCounterSnapshot(),
    registry: getStakingProviderRegistryDevSnapshot(),
    orchestrator: getStakingRefreshOrchestratorDevSnapshot(),
  }
}
