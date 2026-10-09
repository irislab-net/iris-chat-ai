import { useEffect, useRef } from "react"
import { isDevConsoleLoggingEnabled } from "@/staking/diagnostics/stakingDevConsole"
import { isRuntimeChaosSuiteEnabled } from "@/staking/config"
import {
  notifyStakingRefresh,
} from "@/staking/refresh"
import {
  detectRuntimeExecutionPlaneTelemetryReason,
  logRuntimeExecutionPlaneSnapshot,
  type RuntimeExecutionPlaneTelemetryCursor,
} from "@/staking/diagnostics/stakingRuntimeExecutionPlaneTelemetry"
import { tickStakingRuntimeSoakMonitor } from "@/staking/diagnostics/stakingRuntimeSoakMonitor"
import {
  installStakingArchitectureSmokeDevGlobal,
  runStakingArchitectureSmokeDev,
} from "@/staking/diagnostics/stakingArchitectureSmokeDev"
import {
  devAssertTronPassiveNonTransactingInvariant,
} from "@/staking/diagnostics/stakingInvariantAssertionsDev"
import { runStakingVaultSemanticAssertionsDev } from "@/staking/diagnostics/stakingVaultSemanticAssertionsDev"
import {
  installStakingTrustWalletConnectDebugGlobal,
  installStakingTrustWalletMobileTrace,
} from "@/staking/diagnostics/stakingTrustWalletConnectDebug"
import { installTxMobilePipelineTraceGlobal } from "@/staking/diagnostics/stakingTxMobileDeepLinkTrace"
import { isMobileStakingLanLogEnabled } from "@/config/mobileStakingLogEnv"
import { installMobileStakingLanLogGlobals } from "@/staking/diagnostics/mobileStakingLanLog"
import { installMobileStakingWcSessionTrace } from "@/staking/diagnostics/installMobileStakingWcSessionTrace"
import type { RuntimeOperationContext } from "@/staking/core/runtimeOperationContext"
import type { RuntimeTransitionCoordinatorSnapshot } from "@/staking/orchestration"
import type { RuntimeTransitionSequenceStage } from "@/staking/orchestration"
import {
  devNotifyRuntimeStressVaultUnmountForStress,
  isRuntimeStakingDevObservabilityEnabled,
  recordRuntimeTortureVaultMount,
  recordRuntimeTortureVaultUnmount,
  STAKING_RUNTIME_CHAOS_WALLET_SURGE_EVENT,
} from "@/staking/core/runtimeTransitionTelemetry"

/** Inputs for runtime-plane DEV observation (semantic, telemetry, soak). Side-effect only. */
export type StakingVaultDiagnosticsInput = Readonly<{
  stakingRuntime: RuntimeOperationContext
  transitionSequenceStage: RuntimeTransitionSequenceStage
  transitionLifecycle: RuntimeTransitionCoordinatorSnapshot["lifecycle"]
  vaultDataReady: boolean
  executionChainId: number | null
  executionNetworkOk: boolean
  canTransact: boolean
  runtimeWalletConnected: boolean
  runtimeWalletAddress: string | undefined
  executionAddress: string | undefined
  executionConnected: boolean
  isWrongNetwork: boolean
  runtimeWalletNetworkOk: boolean
}>

/** Torture mount/unmount + chaos wallet-surge listener. Preserves vault effect registration order at mount. */
export function useStakingVaultDiagnosticsMount(): void {
  useEffect(() => {
    if (!(process.env.NODE_ENV !== 'production') || !isDevConsoleLoggingEnabled()) return
    installStakingTrustWalletMobileTrace()
    installStakingTrustWalletConnectDebugGlobal()
    installTxMobilePipelineTraceGlobal()
    if (isMobileStakingLanLogEnabled()) {
      installMobileStakingLanLogGlobals()
      installMobileStakingWcSessionTrace()
    }
    installStakingArchitectureSmokeDevGlobal()
    runStakingArchitectureSmokeDev("vault-diagnostics-mount")
    void import("@/staking/diagnostics/stakingArchFreezeDev").then(m => {
      m.installStakingArchFreezeDevGlobal()
      void m.runStakingArchitectureFreezeChecksDev("vault-diagnostics-mount")
    })
  }, [])

  useEffect(() => {
    if (!isRuntimeStakingDevObservabilityEnabled()) return
    recordRuntimeTortureVaultMount()
    return () => {
      recordRuntimeTortureVaultUnmount()
      devNotifyRuntimeStressVaultUnmountForStress()
    }
  }, [])

  useEffect(() => {
    if (!(process.env.NODE_ENV !== 'production') || !isRuntimeChaosSuiteEnabled()) return
    const onSurge = () => {
      notifyStakingRefresh("chaos-simulated-wallet-reconnect")
    }
    window.addEventListener(STAKING_RUNTIME_CHAOS_WALLET_SURGE_EVENT, onSurge)
    return () => {
      window.removeEventListener(STAKING_RUNTIME_CHAOS_WALLET_SURGE_EVENT, onSurge)
    }
  }, [])
}

/**
 * DEV diagnostics for staking vault runtime planes. Side-effect only — no state ownership.
 * Call after `vaultDataReady` is defined (same registration order as pre-D1 vault tail).
 */
export function useStakingVaultDiagnostics(input: StakingVaultDiagnosticsInput): void {
  const {
    stakingRuntime,
    transitionSequenceStage,
    transitionLifecycle,
    vaultDataReady,
    executionChainId,
    executionNetworkOk,
    canTransact,
    runtimeWalletConnected,
    runtimeWalletAddress,
    executionAddress,
    executionConnected,
    isWrongNetwork,
    runtimeWalletNetworkOk,
  } = input

  const executionPlaneTelemetryRef = useRef<RuntimeExecutionPlaneTelemetryCursor>({
    runtimeKey: "",
    generation: 0,
    runtimeWalletConnected: false,
    executionConnected: false,
    executionChainId: null,
    runtimeWalletNetworkOk: true,
    isWrongNetwork: false,
  })

  useEffect(() => {
    if (!(process.env.NODE_ENV !== 'production') || !isDevConsoleLoggingEnabled()) return
    devAssertTronPassiveNonTransactingInvariant({
      isTronPassiveRuntime: stakingRuntime.deployment.chainFamily === "tron",
      executionConnected,
      canTransact,
      context: "useStakingVaultDiagnostics",
    })
  }, [
    stakingRuntime.deployment.chainFamily,
    executionConnected,
    canTransact,
  ])

  useEffect(() => {
    if (!isDevConsoleLoggingEnabled()) return
    runStakingVaultSemanticAssertionsDev({
      runtimeKey: stakingRuntime.runtimeKey,
      chainFamily: stakingRuntime.deployment.chainFamily,
      executionChainId,
      executionNetworkOk,
      canTransact,
      runtimeWalletConnected,
      runtimeWalletAddress,
      executionAddress,
      runtimeWalletNetworkOk,
    })
  }, [
    stakingRuntime.runtimeKey,
    stakingRuntime.deployment.chainFamily,
    executionChainId,
    executionNetworkOk,
    canTransact,
    runtimeWalletConnected,
    runtimeWalletAddress,
    executionAddress,
    runtimeWalletNetworkOk,
  ])

  useEffect(() => {
    if (!(process.env.NODE_ENV !== 'production') || !isDevConsoleLoggingEnabled()) return
    const cur: RuntimeExecutionPlaneTelemetryCursor = {
      runtimeKey: stakingRuntime.runtimeKey,
      generation: stakingRuntime.generation,
      runtimeWalletConnected,
      executionConnected,
      executionChainId,
      runtimeWalletNetworkOk,
      isWrongNetwork,
    }
    const prev = executionPlaneTelemetryRef.current
    const reason = detectRuntimeExecutionPlaneTelemetryReason(prev, cur)
    executionPlaneTelemetryRef.current = cur
    if (!reason) return
    logRuntimeExecutionPlaneSnapshot({
      reason,
      runtimeKey: stakingRuntime.runtimeKey,
      chainFamily: stakingRuntime.deployment.chainFamily,
      runtimeWalletConnected,
      executionConnected,
      executionChainId,
      executionNetworkOk,
      runtimeWalletAddress: runtimeWalletAddress ?? null,
      executionAddress: executionAddress ?? null,
      canTransact,
      supportsStakingExecution:
        stakingRuntime.capabilities.supportsStakingExecution,
    })
  }, [
    stakingRuntime.runtimeKey,
    stakingRuntime.generation,
    stakingRuntime.deployment.chainFamily,
    stakingRuntime.capabilities.supportsStakingExecution,
    runtimeWalletConnected,
    executionConnected,
    executionChainId,
    executionNetworkOk,
    runtimeWalletNetworkOk,
    isWrongNetwork,
    runtimeWalletAddress,
    executionAddress,
    canTransact,
  ])

  useEffect(() => {
    if (!isDevConsoleLoggingEnabled()) return
    tickStakingRuntimeSoakMonitor({
      runtimeKey: stakingRuntime.runtimeKey,
      generation: stakingRuntime.generation,
      chainFamily: stakingRuntime.deployment.chainFamily,
      sequenceStage: transitionSequenceStage,
      lifecycle: transitionLifecycle,
      vaultDataReady,
      runtimeWalletConnected,
      executionConnected,
      isWrongNetwork,
      canTransact,
      runtimeWalletAddress,
      executionAddress,
    })
  }, [
    stakingRuntime.runtimeKey,
    stakingRuntime.generation,
    stakingRuntime.deployment.chainFamily,
    transitionSequenceStage,
    transitionLifecycle,
    vaultDataReady,
    runtimeWalletConnected,
    executionConnected,
    isWrongNetwork,
    canTransact,
    runtimeWalletAddress,
    executionAddress,
  ])
}
