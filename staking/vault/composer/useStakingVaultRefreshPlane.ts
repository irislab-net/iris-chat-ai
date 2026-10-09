import type { useRuntimeTransitionSnapshot } from "@/staking/core/runtimeSelectionHooks"
import type { RuntimeOperationContext } from "@/staking/core/runtimeOperationContext"
import type { AddressCodec } from "@/staking/core/address"
import {
  useStakingVaultBalanceRefreshCallbacks,
  useStakingVaultBalanceRefreshOrchestrator,
  useStakingVaultBalanceRefreshResetAndContinuity,
  useStakingVaultBalanceRefreshTronPolling,
  useStakingVaultBalanceRefreshTronRefetchWiring,
  useStakingVaultBalanceRefreshTxNotify,
} from "@/staking/refresh"
import {
  useStakingVaultTokenReadsAssetLifecycle,
  useStakingVaultTokenReadsMountLoadMeta,
} from "@/staking/reads"
import type { StakingVaultTokenReads } from "@/staking/reads/useStakingVaultTokenReads"
import { selectVaultDataReady } from "@/staking/selectors"
import {
  buildStakingVaultBalanceRefBag,
  buildStakingVaultBalanceRefreshSetters,
  buildStakingVaultBalanceResetSetters,
} from "@/staking/vault/composer/stakingVaultComposerDtos"
import {
  buildStakingVaultNetworkGlueInput,
  useStakingVaultNetworkGlue,
} from "@/staking/runtime/network"
import type { StakingNetworkGlueRefs } from "@/staking/runtime/network"
import type { StakingVaultComposerRefs } from "@/staking/vault/composer/useStakingVaultComposerRefs"
import type { StakingVaultComposerBalanceState } from "@/staking/vault/composer/useStakingVaultComposerBalanceState"
import type { StakingVaultComposerTxState } from "@/staking/vault/composer/useStakingVaultComposerTxState"
import type { useStakingVaultRuntimePlanes } from "@/staking/runtime/useStakingVaultRuntimePlanes"
import type { useUnifiedWalletOrchestration } from "@/staking/orchestration"
import { devAssertRefreshPlaneRegistrationOrder } from "@/staking/diagnostics/stakingInvariantAssertionsDev"
import { isStakingVaultRuntimeHydrationEnabled } from "@/staking/runtime/capabilities/stakingRuntimeHydration"
import { useMemo } from "react"

export type UseStakingVaultRefreshPlaneInput = Readonly<{
  transition: ReturnType<typeof useRuntimeTransitionSnapshot>
  runtimeCtx: Readonly<{
    stakingRuntime: RuntimeOperationContext
    stakingReadOptions: Readonly<{ runtime: RuntimeOperationContext }>
    isTronPassiveRuntime: boolean
    tronAddressCodec: AddressCodec
    stakingReadJsonRpc: ReturnType<
      typeof import("@/staking/core/runtimeFamilyDispatch").getJsonRpcProviderForDeployment
    > | null
  }>
  planes: ReturnType<typeof useStakingVaultRuntimePlanes>
  tokenReads: StakingVaultTokenReads
  balance: StakingVaultComposerBalanceState
  txState: StakingVaultComposerTxState
  composerRefs: StakingVaultComposerRefs
  networkRefs: StakingNetworkGlueRefs
  isWrongNetwork: boolean
  walletOrchestration: ReturnType<typeof useUnifiedWalletOrchestration>
}>

export type StakingVaultRefreshPlane = Readonly<{
  refreshBalances: () => void
  refetchTronPassiveBalances: () => Promise<void>
  requestNetworkSwitch: () => Promise<void>
  vaultDataReady: boolean
}>

/**
 * Refresh plane — fixed hook registration order (see `stakingVaultComposerContracts.ts`).
 */
export function useStakingVaultRefreshPlane(
  input: UseStakingVaultRefreshPlaneInput
): StakingVaultRefreshPlane {
  const {
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
  } = input

  const { stakingRuntime, stakingReadOptions, isTronPassiveRuntime, tronAddressCodec, stakingReadJsonRpc } =
    runtimeCtx
  const runtimeHydrationEnabled = useMemo(
    () => isStakingVaultRuntimeHydrationEnabled(stakingRuntime.deployment),
    [stakingRuntime.deployment]
  )
  const {
    executionConnected,
    executionAddress,
    executionChainId,
    expectedChainId,
    isEthereumNetwork,
    runtimeWallet,
    runtimeWalletAddress,
    runtimeWalletConnected,
    numericChainId,
  } = planes
  const walletIdentityConnected = isTronPassiveRuntime
    ? runtimeWalletConnected
    : executionConnected
  const {
    tokenAddress,
    assetResolved,
    tokenMetaFetched,
    setTokenAddress,
    setAssetResolved,
    loadMeta,
    tokenMetaError,
    setTokenMetaFetched,
    setTokenMetaError,
  } = tokenReads
  const { refreshKey } = txState
  const { lifecycle, refresh: refreshRefs } = composerRefs
  const { isMountedRef } = lifecycle

  const balanceRefBag = buildStakingVaultBalanceRefBag(refreshRefs)
  const balanceRefreshSetters = buildStakingVaultBalanceRefreshSetters(balance, tokenReads)
  const balanceResetSetters = buildStakingVaultBalanceResetSetters(balance, tokenReads)

  devAssertRefreshPlaneRegistrationOrder("asset_lifecycle")
  useStakingVaultTokenReadsAssetLifecycle({
    isMountedRef,
    transition,
    stakingRuntime,
    stakingReadOptions,
    stakingReadJsonRpc,
    tronAddressCodec,
    isTronPassiveRuntime,
    isEthereumNetwork,
    chainId: executionChainId,
    expectedChainId,
    runtimeWalletAddress,
    setTokenAddress,
    setAssetResolved,
  })

  devAssertRefreshPlaneRegistrationOrder("balance_callbacks")
  const { refreshBalances, refetchTronPassiveBalances } =
    useStakingVaultBalanceRefreshCallbacks({
      isMountedRef,
      transition,
      stakingRuntime,
      tronAddressCodec,
      isTronPassiveRuntime,
      runtimeWalletAddress,
      refs: balanceRefBag,
      setters: balanceRefreshSetters,
    })

  devAssertRefreshPlaneRegistrationOrder("tron_ref_wiring")
  useStakingVaultBalanceRefreshTronRefetchWiring({
    isTronPassiveRuntime,
    refs: { tronPassiveRefetchRef: refreshRefs.tronPassiveRefetchRef },
    refetchTronPassiveBalances,
  })

  devAssertRefreshPlaneRegistrationOrder("reset_continuity")
  useStakingVaultBalanceRefreshResetAndContinuity({
    isTronPassiveRuntime,
    stakingRuntime,
    runtimeWallet,
    runtimeWalletAddress,
    address: executionAddress,
    numericChainId,
    isConnected: executionConnected,
    isEthereumNetwork,
    isWrongNetwork,
    tokenAddress,
    tronAddressCodec,
    refs: {
      balanceSnapshotRef: refreshRefs.balanceSnapshotRef,
      lastDisplayBalancesRef: refreshRefs.lastDisplayBalancesRef,
    },
    setters: balanceResetSetters,
  })

  devAssertRefreshPlaneRegistrationOrder("network_glue")
  const { requestNetworkSwitch } = useStakingVaultNetworkGlue(
    buildStakingVaultNetworkGlueInput({
      stakingRuntime,
      isTronPassiveRuntime,
      planes,
      tokenReads: {
        tokenMetaError,
        setTokenMetaError,
        setTokenMetaFetched,
        loadMeta,
      },
      balance: { setBalancesFetched: balance.setBalancesFetched },
      refetchTronPassiveBalances,
      walletOrchestration,
      lifecycleRefs: lifecycle,
      networkRefs,
      txState,
    })
  )

  devAssertRefreshPlaneRegistrationOrder("load_meta_mount")
  useStakingVaultTokenReadsMountLoadMeta(loadMeta)

  devAssertRefreshPlaneRegistrationOrder("tx_notify")
  useStakingVaultBalanceRefreshTxNotify(refreshKey)

  devAssertRefreshPlaneRegistrationOrder("orchestrator")
  useStakingVaultBalanceRefreshOrchestrator({
    isMountedRef,
    transition,
    runtimeHydrationEnabled,
    isTronPassiveRuntime,
    isConnected: executionConnected,
    address: executionAddress,
    tokenAddress,
    isEthereumNetwork,
    isWrongNetwork,
    assetResolved,
    chainId: executionChainId,
    expectedChainId,
    refs: balanceRefBag,
    setters: balanceRefreshSetters,
  })

  devAssertRefreshPlaneRegistrationOrder("tron_polling")
  useStakingVaultBalanceRefreshTronPolling({
    runtimeHydrationEnabled,
    isTronPassiveRuntime,
    tokenAddress,
    runtimeWalletAddress,
    stakingRuntime,
    tronAddressCodec,
    refs: balanceRefBag,
    setters: balanceRefreshSetters,
    refetchTronPassiveBalances,
  })

  const vaultDataReady = useMemo(
    () =>
      selectVaultDataReady({
        isTronPassiveRuntime,
        walletIdentityConnected,
        isEthereumNetwork,
        isWrongNetwork,
        assetResolved,
        tokenAddress,
        tokenMetaFetched,
        balancesFetched: balance.balancesFetched,
      }),
    [
      isTronPassiveRuntime,
      walletIdentityConnected,
      isEthereumNetwork,
      isWrongNetwork,
      assetResolved,
      tokenAddress,
      tokenMetaFetched,
      balance.balancesFetched,
    ]
  )

  return {
    refreshBalances,
    refetchTronPassiveBalances,
    requestNetworkSwitch,
    vaultDataReady,
  }
}
