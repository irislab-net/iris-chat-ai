import type { RuntimeOperationContext } from "@/staking/core/runtimeOperationContext"
import type { StakingVaultRuntimePlanes } from "@/staking/runtime/useStakingVaultRuntimePlanes"
import { useEffect, useRef } from "react"

let reconciliationEffectRegistered = false
let loadMetaEffectRegistered = false

/** DEV-only: call when `useStakingVaultNetworkGlue` is invoked (composer hook order, not effect timing). */
export function stakingNetworkTopologyMarkReconciliationRegistered(): void {
  if (!(process.env.NODE_ENV !== 'production')) return
  if (reconciliationEffectRegistered) return
  if (loadMetaEffectRegistered) {
    console.error(
      "[staking-network-topology] invariant violated: EVM reconciliation registered after loadMeta mount"
    )
  }
  reconciliationEffectRegistered = true
}

/** DEV-only: call when `useStakingVaultTokenReadsMountLoadMeta` is invoked (after network glue in refresh plane). */
export function stakingNetworkTopologyMarkLoadMetaRegistered(): void {
  if (!(process.env.NODE_ENV !== 'production')) return
  if (loadMetaEffectRegistered) return
  if (!reconciliationEffectRegistered) {
    console.error(
      "[staking-network-topology] invariant violated: loadMeta registered before EVM reconciliation"
    )
  }
  loadMetaEffectRegistered = true
}

/** DEV-only: reset registration flags on full page reload / HMR boundary (best-effort). */
export function stakingNetworkTopologyResetRegistrationFlags(): void {
  reconciliationEffectRegistered = false
  loadMetaEffectRegistered = false
}

export type UseStakingVaultNetworkTopologyDevInput = Readonly<{
  stakingRuntime: RuntimeOperationContext
  planes: StakingVaultRuntimePlanes
  isWrongNetwork: boolean
}>

/**
 * DEV topology assertions for runtime vs execution chain separation.
 * Register after identity derivations (`isWrongNetwork`) are available.
 */
export function useStakingVaultNetworkTopologyDev(
  input: UseStakingVaultNetworkTopologyDevInput
): void {
  const { stakingRuntime, planes, isWrongNetwork } = input
  const isTron = stakingRuntime.deployment.chainFamily === "tron"
  const prevWrongByRuntimeKeyRef = useRef<Map<string, boolean>>(new Map())

  useEffect(() => {
    if (!(process.env.NODE_ENV !== 'production')) return

    if (isTron) {
      if (planes.executionChainId !== null && planes.executionConnected) {
        console.warn(
          "[staking-network-topology] Tron runtime session exposes execution chainId while executionConnected — execution plane should be inert",
          {
            runtimeKey: stakingRuntime.runtimeKey,
            executionChainId: planes.executionChainId,
          }
        )
      }
      if (planes.isEthereumNetwork && planes.numericChainId !== null) {
        console.warn(
          "[staking-network-topology] Tron runtime publishes EVM numericChainId — check AppKit isolation",
          { runtimeKey: stakingRuntime.runtimeKey, numericChainId: planes.numericChainId }
        )
      }
    } else {
      if (planes.runtimeWallet.networkOk && !planes.runtimeWallet.hasAccount) {
        console.warn(
          "[staking-network-topology] EVM runtime publishes Tron runtimeWallet.networkOk without account",
          { runtimeKey: stakingRuntime.runtimeKey }
        )
      }
    }

    const key = stakingRuntime.runtimeKey
    const prev = prevWrongByRuntimeKeyRef.current.get(key)
    if (prev === true && !isWrongNetwork) {
      // allowed: recovery from wrong network
    } else if (prev === false && isWrongNetwork) {
      // allowed: newly wrong
    }
    prevWrongByRuntimeKeyRef.current.set(key, isWrongNetwork)
  }, [
    isTron,
    stakingRuntime.runtimeKey,
    planes.executionChainId,
    planes.executionConnected,
    planes.isEthereumNetwork,
    planes.numericChainId,
    planes.runtimeWallet.networkOk,
    planes.runtimeWallet.hasAccount,
    isWrongNetwork,
  ])
}
