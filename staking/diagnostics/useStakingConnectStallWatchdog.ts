import { useEffect, useRef } from "react"
import { useAppKitAccount } from "@reown/appkit/react"
import {
  captureStakingConnectStall,
  stakingSentryRuntimeReadyOnce,
} from "@/lib/stakingSentryObservability"
import {
  buildStakingConnectStallDedupeKey,
  inferStakingWalletVendor,
  isStakingConnectStallCandidate,
  isStakingPartialWalletConnect,
  readStakingConnectStallEnvironment,
  resolveStakingConnectBlockingGateDetailed,
  STAKING_CONNECT_STALL_THRESHOLD_MS,
  type StakingConnectGateResolveInput,
} from "@/staking/diagnostics/stakingConnectStallLogic"
import {
  getLastStakingConnectIntent,
  getLastStakingSignerHydrationPhase,
} from "@/staking/diagnostics/stakingTrustWalletConnectDebug"
import type { RuntimeOperationContext } from "@/staking/core/runtimeOperationContext"
import type { useStakingVaultRuntimePlanes } from "@/staking/runtime/useStakingVaultRuntimePlanes"

type RuntimePlanes = ReturnType<typeof useStakingVaultRuntimePlanes>

export type StakingConnectStallWatchdogInput = Readonly<{
  stakingRuntime: RuntimeOperationContext
  planes: RuntimePlanes
  isTronPassiveRuntime: boolean
  vaultDataReady: boolean
  awaitingSigner: boolean
  canTransact: boolean
  isWrongNetwork: boolean
  loading: boolean
  isAttemptingNetworkSwitch: boolean
  balancesFetched: boolean
  tokenMetaFetched: boolean
  tokenMetaError: string | null
  runtimeHydrationEnabled: boolean
  transitionLifecycle: string
  refreshPaused: boolean
}>

function buildGateInput(
  input: StakingConnectStallWatchdogInput
): StakingConnectGateResolveInput {
  return {
    isTronPassiveRuntime: input.isTronPassiveRuntime,
    executionConnected: input.planes.executionConnected,
    walletConnected: input.planes.runtimeWalletConnected,
    executionAddress: input.planes.executionAddress ?? null,
    isWrongNetwork: input.isWrongNetwork,
    isAttemptingNetworkSwitch: input.isAttemptingNetworkSwitch,
    awaitingSigner: input.awaitingSigner,
    canTransact: input.canTransact,
    vaultDataReady: input.vaultDataReady,
    runtimeHydrationEnabled: input.runtimeHydrationEnabled,
    transitionLifecycle: input.transitionLifecycle,
    refreshPaused: input.refreshPaused,
    tokenMetaError: input.tokenMetaError,
    loading: input.loading,
    hasProvider: Boolean(input.planes.provider),
    balancesFetched: input.balancesFetched,
  }
}

export function useStakingConnectStallWatchdog(
  input: StakingConnectStallWatchdogInput
): void {
  const { status: appKitAccountStatus } = useAppKitAccount({ namespace: "eip155" })

  const inputRef = useRef(input)
  inputRef.current = input

  const stallTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const armedGateRef = useRef<string | null>(null)

  const gateInput = buildGateInput(input)
  const gate = resolveStakingConnectBlockingGateDetailed(gateInput)
  const partialConnect = isStakingPartialWalletConnect(gateInput)
  const stallCandidate = isStakingConnectStallCandidate(gate)
  const stallArmKey =
    partialConnect && stallCandidate ? gate.reason : null

  useEffect(() => {
    if (input.canTransact && gate.reason === "ready") {
      stakingSentryRuntimeReadyOnce({
        deployment_id: input.stakingRuntime.deployment.id,
        runtime_key: input.stakingRuntime.runtimeKey,
      })
    }
  }, [
    input.canTransact,
    gate.reason,
    input.stakingRuntime.deployment.id,
    input.stakingRuntime.runtimeKey,
  ])

  useEffect(() => {
    const disarm = () => {
      if (stallTimerRef.current != null) {
        clearTimeout(stallTimerRef.current)
        stallTimerRef.current = null
      }
      armedGateRef.current = null
    }

    if (stallArmKey == null) {
      disarm()
      return disarm
    }

    if (armedGateRef.current === stallArmKey && stallTimerRef.current != null) {
      return disarm
    }

    disarm()
    armedGateRef.current = stallArmKey

    stallTimerRef.current = setTimeout(() => {
      stallTimerRef.current = null
      armedGateRef.current = null

      const cur = inputRef.current
      const curGateInput = buildGateInput(cur)
      const latestGate = resolveStakingConnectBlockingGateDetailed(curGateInput)

      if (!isStakingConnectStallCandidate(latestGate)) return
      if (!isStakingPartialWalletConnect(curGateInput)) return

      const env = readStakingConnectStallEnvironment()
      const dedupeKey = buildStakingConnectStallDedupeKey({
        blockingGate: latestGate.reason,
        deploymentId: cur.stakingRuntime.deployment.id,
        runtimeKey: cur.stakingRuntime.runtimeKey,
      })

      captureStakingConnectStall(
        {
          blockingGate: latestGate.reason,
          executionConnected: cur.planes.executionConnected,
          walletConnected: cur.planes.runtimeWalletConnected,
          executionAddress: cur.planes.executionAddress ?? null,
          hasProvider: Boolean(cur.planes.provider),
          hasSigner: Boolean(cur.planes.signer),
          signerResolved: Boolean(cur.planes.signer),
          activeDeploymentId: cur.stakingRuntime.deployment.id,
          runtimeKey: cur.stakingRuntime.runtimeKey,
          runtimeHydrationEnabled: cur.runtimeHydrationEnabled,
          vaultDataReady: cur.vaultDataReady,
          wrongNetwork: cur.isWrongNetwork,
          reconnecting: appKitAccountStatus === "connecting",
          chainFamily: cur.stakingRuntime.deployment.chainFamily,
          walletVendor: inferStakingWalletVendor(),
          visibilityState: env.visibilityState,
          userAgent: env.userAgent,
          isMobileUa: env.isMobileUa,
          appKitAccountStatus: appKitAccountStatus ?? null,
          appKitCaipNetwork: cur.planes.caipNetwork?.name ?? null,
          appKitChainId: cur.planes.appKitNetworkChainId ?? null,
          uiLoadingReason: latestGate.reason,
          transitionLifecycle: cur.transitionLifecycle,
          refreshPaused: cur.refreshPaused,
          balancesFetched: cur.balancesFetched,
          tokenMetaFetched: cur.tokenMetaFetched,
          canTransact: cur.canTransact,
          awaitingSigner: cur.awaitingSigner,
          evmSignerPhase: getLastStakingSignerHydrationPhase(),
          connectIntent: getLastStakingConnectIntent(),
        },
        dedupeKey
      )
    }, STAKING_CONNECT_STALL_THRESHOLD_MS)

    return disarm
  }, [stallArmKey, appKitAccountStatus])
}
