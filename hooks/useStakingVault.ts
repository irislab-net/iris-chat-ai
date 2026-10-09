import {
  useStakingVaultDiagnostics,
  useStakingVaultDiagnosticsMount,
} from "@/staking/diagnostics/useStakingVaultDiagnostics"
import { useStakingConnectStallWatchdog } from "@/staking/diagnostics/useStakingConnectStallWatchdog"
import { useStakingRuntimeFamilyParticipationCheck } from "@/staking/diagnostics/useStakingRuntimeFamilyParticipationCheck"
import { useStakingVaultTxLoadingStallWatchdog } from "@/staking/diagnostics/useStakingVaultTxLoadingStallWatchdog"
import { useStakingTrustWalletConnectDebug } from "@/staking/diagnostics/useStakingTrustWalletConnectDebug"
import { isStakingVaultRuntimeHydrationEnabled } from "@/staking/runtime/capabilities/stakingRuntimeHydration"
import { stakingSentryBreadcrumb } from "@/lib/stakingSentryObservability"
import { markStakingConnectIntent } from "@/staking/diagnostics/stakingTrustWalletConnectDebug"
import {
  selectStakingNetPrincipalWei,
  selectStakingPnlBasisReady,
  selectAwaitingSigner,
  selectCanTransact,
  selectTxExecutionReady,
  selectIsWrongNetwork,
} from "@/staking/selectors"
import { useUnifiedWalletOrchestration } from "@/staking/orchestration"
import { useStakingVaultTokenReads } from "@/staking/reads"
import { useRuntimeTransitionSnapshot } from "@/staking/core/runtimeSelectionHooks"
import {
  useStakingVaultNetworkChainMirrors,
  useStakingVaultNetworkRefs,
  useStakingVaultNetworkTopologyDev,
} from "@/staking/runtime/network"
import { useStakingVaultRuntimePlanes } from "@/staking/runtime/useStakingVaultRuntimePlanes"
import { useStakingVaultTxExecution } from "@/staking/tx/execution"
import { registerStakingVaultTxExecutionAbandon } from "@/staking/tx/execution/stakingVaultTxExecutionOwnershipBridge"
import {
  assembleStakingVaultPublicValue,
  useStakingVaultComposerBalanceState,
  useStakingVaultComposerLifecycleEffects,
  useStakingVaultComposerRefs,
  useStakingVaultComposerTxState,
  useStakingVaultHistoryPlane,
  useStakingVaultPresentationPlane,
  useStakingVaultRefreshPlane,
  useStakingVaultRuntimeContext,
} from "@/staking/vault/composer"
import { useAffiliateFirestoreStats } from "./useAffiliateFirestoreStats"
import { useCallback, useEffect, useMemo, useRef } from "react"

export type { StakingTokenMetaError } from "@/staking/reads/types"

export type {
  StakingApprovalMode,
  StakingTxOptions,
  StakingTxResult,
} from "@/staking/tx/execution"

/**
 * Staking vault composer facade (Phase D4).
 *
 * Subsystems live in `@/staking/*` planes; this hook wires them in a fixed order.
 * See `stakingVaultComposerContracts.ts` for sequencing invariants.
 *
 * **Phase 23–36 runtime / modal / coordinator notes** — unchanged; see git history of this file
 * before D4 for full narrative (`useRuntimeTransitionSnapshot`, modal snapshot vs vault execution,
 * `canRuntimeOperationCommitWithDevTrace`, etc.).
 */
export function useStakingVaultState() {
  // --- Runtime plane ---
  const transition = useRuntimeTransitionSnapshot()
  const runtimeCtx = useStakingVaultRuntimeContext(transition.operationContext)
  const { stakingRuntime } = runtimeCtx
  const planes = useStakingVaultRuntimePlanes({ stakingRuntime })

  // --- Composer ref bags ---
  const composerRefs = useStakingVaultComposerRefs()
  const networkRefs = useStakingVaultNetworkRefs()
  const { lifecycle, historyGlue } = composerRefs

  // --- Reads plane ---
  const tokenReads = useStakingVaultTokenReads({
    isMountedRef: lifecycle.isMountedRef,
    transition,
    stakingRuntime,
    stakingReadOptions: runtimeCtx.stakingReadOptions,
    stakingReadJsonRpc: runtimeCtx.stakingReadJsonRpc,
    tronAddressCodec: runtimeCtx.tronAddressCodec,
    isTronPassiveRuntime: runtimeCtx.isTronPassiveRuntime,
    isEthereumNetwork: planes.isEthereumNetwork,
    chainId: planes.executionChainId,
    expectedChainId: planes.expectedChainId,
    runtimeWalletAddress: planes.runtimeWalletAddress,
  })

  // --- Affiliate plane ---
  const affiliate = useAffiliateFirestoreStats(planes.executionAddress)

  // --- Balance + tx state ---
  const balance = useStakingVaultComposerBalanceState()
  const txState = useStakingVaultComposerTxState()
  const {
    loading: vaultTxLoading,
    acquireVaultTxExecutionLoading,
    releaseVaultTxExecutionLoading,
    abandonVaultTxExecutionLoading,
    reconcileVaultTxExecutionLoading,
    setRefreshKey,
    isAttemptingNetworkSwitch,
  } = txState

  // --- Identity plane (derived flags + wallet orchestration) ---
  const isWrongNetwork = useMemo(
    () =>
      selectIsWrongNetwork({
        isTronPassiveRuntime: runtimeCtx.isTronPassiveRuntime,
        runtimeWalletHasAccount: planes.runtimeWallet.hasAccount,
        runtimeWalletNetworkOk: planes.runtimeWallet.networkOk,
        executionConnected: planes.executionConnected,
        isEthereumNetwork: planes.isEthereumNetwork,
        numericChainId: planes.numericChainId,
        expectedChainId: planes.expectedChainId,
      }),
    [
      runtimeCtx.isTronPassiveRuntime,
      planes.runtimeWallet.hasAccount,
      planes.runtimeWallet.networkOk,
      planes.executionConnected,
      planes.isEthereumNetwork,
      planes.numericChainId,
      planes.expectedChainId,
    ]
  )

  const walletOrchestration = useUnifiedWalletOrchestration({
    namespace: runtimeCtx.isTronPassiveRuntime ? "tron" : "eip155",
    connected: planes.runtimeWalletConnected,
    wrongNetwork: isWrongNetwork,
  })

  useStakingVaultNetworkTopologyDev({
    stakingRuntime,
    planes,
    isWrongNetwork,
  })

  /** History glue — must register before refresh plane (wrong-network abort). */
  useEffect(() => {
    if (!isWrongNetwork) return
    historyGlue.clearStakingHistoryOnWrongNetworkRef.current?.()
  }, [isWrongNetwork])

  const walletIdentityConnected = runtimeCtx.isTronPassiveRuntime
    ? planes.runtimeWalletConnected
    : planes.executionConnected

  const stakingNetPrincipalWei = useMemo(
    () =>
      selectStakingNetPrincipalWei({
        walletIdentityConnected,
        isWrongNetwork,
        tokenDecimals: tokenReads.tokenDecimals,
        affiliateStatsError: affiliate.error,
        affiliateStatsLoading: affiliate.loading,
        affiliateStats: affiliate.stats,
      }),
    [
      walletIdentityConnected,
      isWrongNetwork,
      tokenReads.tokenDecimals,
      affiliate.error,
      affiliate.loading,
      affiliate.stats,
    ]
  )

  const stakingPnlBasisReady = selectStakingPnlBasisReady({
    walletIdentityConnected,
    isWrongNetwork,
    tokenDecimals: tokenReads.tokenDecimals,
    affiliateStatsError: affiliate.error,
    affiliateStatsLoading: affiliate.loading,
    affiliateStats: affiliate.stats,
    stakingNetPrincipalWei,
  })

  const txExecutionReadyInput = {
    executionConnected: planes.executionConnected,
    isTronPassiveRuntime: runtimeCtx.isTronPassiveRuntime,
    isEthereumNetwork: planes.isEthereumNetwork,
    isWrongNetwork,
    executionAddress: planes.executionAddress,
    signer: planes.signer,
    provider: planes.provider,
    tokenAddress: tokenReads.tokenAddress,
    tokenDecimals: tokenReads.tokenDecimals,
    tokenMetaError: tokenReads.tokenMetaError,
  }

  const canTransact = selectCanTransact(txExecutionReadyInput)
  const txExecutionReady = selectTxExecutionReady(txExecutionReadyInput)

  const awaitingSigner = selectAwaitingSigner({
    executionConnected: planes.executionConnected,
    isTronPassiveRuntime: runtimeCtx.isTronPassiveRuntime,
    isEthereumNetwork: planes.isEthereumNetwork,
    isWrongNetwork,
    executionAddress: planes.executionAddress,
    provider: planes.provider,
    tokenAddress: tokenReads.tokenAddress,
    signer: planes.signer,
  })

  // --- Diagnostics plane (mount) + lifecycle mirrors ---
  useStakingVaultDiagnosticsMount()

  useStakingVaultComposerLifecycleEffects({ lifecycleRefs: lifecycle })

  useStakingVaultNetworkChainMirrors({
    chainId: planes.executionChainId,
    tokenMetaError: tokenReads.tokenMetaError,
    lifecycleRefs: lifecycle,
    networkRefs,
  })

  // --- Refresh plane (sequencing-sensitive) ---
  const refreshPlane = useStakingVaultRefreshPlane({
    transition,
    runtimeCtx,
    planes,
    tokenReads,
    balance,
    txState,
    composerRefs,
    networkRefs,
    isWrongNetwork,
    walletOrchestration,
  })

  // --- History plane ---
  const historyPlane = useStakingVaultHistoryPlane({
    runtimeCtx,
    planes,
    tokenReads,
    balance,
    historyGlueRefs: historyGlue,
    isWrongNetwork,
    vaultDataReady: refreshPlane.vaultDataReady,
    refetchTronPassiveBalances: refreshPlane.refetchTronPassiveBalances,
  })

  // --- Presentation memos ---
  const presentation = useStakingVaultPresentationPlane({
    balance,
    tokenReads,
    stakingNetPrincipalWei,
    historyPlane,
  })

  // --- Tx execution plane ---
  const txExecution = useStakingVaultTxExecution({
    stakingRuntime,
    canTransact,
    signer: planes.signer,
    executionAddress: planes.executionAddress,
    tokenAddress: tokenReads.tokenAddress,
    tokenDecimals: tokenReads.tokenDecimals,
    acquireVaultTxExecutionLoading,
    releaseVaultTxExecutionLoading,
    setRefreshKey,
    refreshBalances: refreshPlane.refreshBalances,
    refreshStakingHistory: historyPlane.refreshStakingHistory,
    refetchAffiliateStats: affiliate.refetch,
  })

  useEffect(() => {
    registerStakingVaultTxExecutionAbandon(abandonVaultTxExecutionLoading)
    return () => registerStakingVaultTxExecutionAbandon(null)
  }, [abandonVaultTxExecutionLoading])

  const runtimeExecutionRef = useRef({
    runtimeKey: stakingRuntime.runtimeKey,
    generation: stakingRuntime.generation,
  })
  useEffect(() => {
    const prev = runtimeExecutionRef.current
    const runtimeChanged =
      prev.runtimeKey !== stakingRuntime.runtimeKey ||
      prev.generation !== stakingRuntime.generation
    if (runtimeChanged && vaultTxLoading) {
      abandonVaultTxExecutionLoading("runtime_execution_invalidated")
    }
    runtimeExecutionRef.current = {
      runtimeKey: stakingRuntime.runtimeKey,
      generation: stakingRuntime.generation,
    }
  }, [
    stakingRuntime.runtimeKey,
    stakingRuntime.generation,
    vaultTxLoading,
    abandonVaultTxExecutionLoading,
  ])

  useEffect(() => {
    if (vaultTxLoading && !planes.executionConnected) {
      abandonVaultTxExecutionLoading("wallet_disconnected_during_execution")
    }
  }, [vaultTxLoading, planes.executionConnected, abandonVaultTxExecutionLoading])

  /** Orphaned `loading` after signer resume / stale lease release — ownership is source of truth. */
  useEffect(() => {
    if (!vaultTxLoading || awaitingSigner) return
    if (!planes.signer) return
    reconcileVaultTxExecutionLoading()
  }, [
    vaultTxLoading,
    awaitingSigner,
    planes.signer,
    reconcileVaultTxExecutionLoading,
  ])

  const openWallet = useCallback(() => {
    markStakingConnectIntent("useStakingVault.openWallet")
    stakingSentryBreadcrumb("connect_clicked", {
      source: "useStakingVault.openWallet",
      namespace: runtimeCtx.isTronPassiveRuntime ? "tron" : "eip155",
    })
    walletOrchestration.openWallet()
  }, [walletOrchestration, runtimeCtx.isTronPassiveRuntime])

  useStakingTrustWalletConnectDebug({
    stakingRuntime,
    planes,
    isTronPassiveRuntime: runtimeCtx.isTronPassiveRuntime,
    vaultDataReady: refreshPlane.vaultDataReady,
    awaitingSigner,
    canTransact,
    isWrongNetwork,
    loading: vaultTxLoading,
    isAttemptingNetworkSwitch,
    assetResolved: tokenReads.assetResolved,
    tokenAddress: tokenReads.tokenAddress,
    tokenMetaFetched: tokenReads.tokenMetaFetched,
    balancesFetched: balance.balancesFetched,
  })

  useStakingRuntimeFamilyParticipationCheck({
    deploymentId: stakingRuntime.deployment.id,
    runtimeKey: stakingRuntime.runtimeKey,
    chainFamily: stakingRuntime.deployment.chainFamily,
  })

  useStakingConnectStallWatchdog({
    stakingRuntime,
    planes,
    isTronPassiveRuntime: runtimeCtx.isTronPassiveRuntime,
    vaultDataReady: refreshPlane.vaultDataReady,
    awaitingSigner,
    canTransact,
    isWrongNetwork,
    loading: vaultTxLoading,
    isAttemptingNetworkSwitch,
    balancesFetched: balance.balancesFetched,
    tokenMetaFetched: tokenReads.tokenMetaFetched,
    tokenMetaError: tokenReads.tokenMetaError,
    runtimeHydrationEnabled: isStakingVaultRuntimeHydrationEnabled(
      stakingRuntime.deployment
    ),
    transitionLifecycle: transition.coordinatorSnapshot.lifecycle,
    refreshPaused: transition.coordinatorSnapshot.refreshPaused,
  })

  useStakingVaultTxLoadingStallWatchdog({
    loading: vaultTxLoading,
    awaitingSigner,
    activeDeploymentId: stakingRuntime.deployment.id,
    runtimeKey: stakingRuntime.runtimeKey,
    chainFamily: stakingRuntime.deployment.chainFamily,
    canTransact,
    vaultDataReady: refreshPlane.vaultDataReady,
    executionConnected: planes.executionConnected,
    hasSigner: Boolean(planes.signer),
    transitionLifecycle: transition.coordinatorSnapshot.lifecycle,
    refreshPaused: transition.coordinatorSnapshot.refreshPaused,
  })

  // --- Diagnostics plane (runtime assertions) ---
  useStakingVaultDiagnostics({
    stakingRuntime,
    transitionSequenceStage: transition.sequenceStage,
    transitionLifecycle: transition.coordinatorSnapshot.lifecycle,
    vaultDataReady: refreshPlane.vaultDataReady,
    executionChainId: planes.executionChainId,
    executionNetworkOk: planes.executionNetworkOk,
    canTransact,
    runtimeWalletConnected: planes.runtimeWalletConnected,
    runtimeWalletAddress: planes.runtimeWalletAddress ?? undefined,
    executionAddress: planes.executionAddress,
    executionConnected: planes.executionConnected,
    isWrongNetwork,
    runtimeWalletNetworkOk: planes.runtimeWallet.networkOk,
  })

  return     assembleStakingVaultPublicValue({
      planes,
      isWrongNetwork,
    canTransact,
    txExecutionReady,
    awaitingSigner,
    vaultDataReady: refreshPlane.vaultDataReady,
    stakingPnlBasisReady,
    affiliate,
    stakingNetPrincipalWei,
    tokenReads,
    balance,
    txState,
    refreshPlane,
    historyPlane,
    presentation,
    txExecution,
    openWallet,
  })
}
