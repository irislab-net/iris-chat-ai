import { useEffect } from "react"
import {
  buildStakingTrustWalletConnectSnapshot,
  traceStakingTrustWalletConnectSnapshot,
} from "@/staking/diagnostics/stakingTrustWalletConnectDebug"
import type { RuntimeOperationContext } from "@/staking/core/runtimeOperationContext"
import type { useStakingVaultRuntimePlanes } from "@/staking/runtime/useStakingVaultRuntimePlanes"

type RuntimePlanes = ReturnType<typeof useStakingVaultRuntimePlanes>

export function useStakingTrustWalletConnectDebug(input: Readonly<{
  stakingRuntime: RuntimeOperationContext
  planes: RuntimePlanes
  isTronPassiveRuntime: boolean
  vaultDataReady: boolean
  awaitingSigner: boolean
  canTransact: boolean
  isWrongNetwork: boolean
  loading: boolean
  isAttemptingNetworkSwitch: boolean
  assetResolved: boolean
  tokenAddress: string | null | undefined
  tokenMetaFetched: boolean
  balancesFetched: boolean
}>): void {
  useEffect(() => {
    if (!(process.env.NODE_ENV !== 'production')) return
    traceStakingTrustWalletConnectSnapshot(
      buildStakingTrustWalletConnectSnapshot({
        hasWalletProvider: input.planes.executionConnected,
        hasSigner: Boolean(input.planes.signer),
        isWrongNetwork: input.isWrongNetwork,
        canTransact: input.canTransact,
        awaitingSigner: input.awaitingSigner,
      })
    )
  }, [
    input.planes.executionConnected,
    input.planes.signer,
    input.isWrongNetwork,
    input.canTransact,
    input.awaitingSigner,
    input.vaultDataReady,
    input.loading,
    input.isAttemptingNetworkSwitch,
    input.assetResolved,
    input.tokenAddress,
    input.tokenMetaFetched,
    input.balancesFetched,
    input.isTronPassiveRuntime,
    input.stakingRuntime.runtimeKey,
  ])
}
