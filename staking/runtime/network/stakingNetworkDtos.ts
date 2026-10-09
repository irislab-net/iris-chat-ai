import type { RuntimeOperationContext } from "@/staking/core/runtimeOperationContext"
import type { StakingTokenMetaError } from "@/staking/reads/types"
import type { StakingVaultComposerLifecycleRefs } from "@/staking/vault/composer/useStakingVaultComposerRefs"
import type { StakingVaultComposerTxState } from "@/staking/vault/composer/useStakingVaultComposerTxState"
import type { StakingVaultRuntimePlanes } from "@/staking/runtime/useStakingVaultRuntimePlanes"
import type { StakingNetworkGlueRefs } from "@/staking/runtime/network/useStakingVaultNetworkGlue"
import type { useUnifiedWalletOrchestration } from "@/staking/orchestration"
import { STAKING_APPKIT_NETWORK } from "@/constants/stakingVaultConfig"

export type { StakingNetworkGlueRefs }

export type UseStakingVaultNetworkGlueInput = Readonly<{
  stakingRuntime: RuntimeOperationContext
  isTronPassiveRuntime: boolean
  isConnected: boolean
  numericChainId: number | null
  tokenMetaError: StakingTokenMetaError | null
  setTokenMetaError: React.Dispatch<React.SetStateAction<StakingTokenMetaError | null>>
  setTokenMetaFetched: React.Dispatch<React.SetStateAction<boolean>>
  setBalancesFetched: React.Dispatch<React.SetStateAction<boolean>>
  loadMeta: () => Promise<void>
  refetchTronPassiveBalances: () => Promise<void>
  switchNetwork: (network: typeof STAKING_APPKIT_NETWORK) => Promise<void>
  walletOrchestration: ReturnType<typeof useUnifiedWalletOrchestration>
  lifecycleRefs: StakingVaultComposerLifecycleRefs
  networkRefs: StakingNetworkGlueRefs
  txState: StakingVaultComposerTxState
}>

export type BuildStakingVaultNetworkGlueInputParams = Readonly<{
  stakingRuntime: RuntimeOperationContext
  isTronPassiveRuntime: boolean
  planes: StakingVaultRuntimePlanes
  tokenReads: Readonly<{
    tokenMetaError: StakingTokenMetaError | null
    setTokenMetaError: React.Dispatch<React.SetStateAction<StakingTokenMetaError | null>>
    setTokenMetaFetched: React.Dispatch<React.SetStateAction<boolean>>
    loadMeta: () => Promise<void>
  }>
  balance: Readonly<{
    setBalancesFetched: React.Dispatch<React.SetStateAction<boolean>>
  }>
  refetchTronPassiveBalances: () => Promise<void>
  walletOrchestration: ReturnType<typeof useUnifiedWalletOrchestration>
  lifecycleRefs: StakingVaultComposerLifecycleRefs
  networkRefs: StakingNetworkGlueRefs
  txState: StakingVaultComposerTxState
}>

export function buildStakingVaultNetworkGlueInput(
  params: BuildStakingVaultNetworkGlueInputParams
): UseStakingVaultNetworkGlueInput {
  const {
    stakingRuntime,
    isTronPassiveRuntime,
    planes,
    tokenReads,
    balance,
    refetchTronPassiveBalances,
    walletOrchestration,
    lifecycleRefs,
    networkRefs,
    txState,
  } = params
  return {
    stakingRuntime,
    isTronPassiveRuntime,
    isConnected: isTronPassiveRuntime
      ? planes.runtimeWalletConnected
      : planes.executionConnected,
    numericChainId: planes.numericChainId,
    tokenMetaError: tokenReads.tokenMetaError,
    setTokenMetaError: tokenReads.setTokenMetaError,
    setTokenMetaFetched: tokenReads.setTokenMetaFetched,
    setBalancesFetched: balance.setBalancesFetched,
    loadMeta: tokenReads.loadMeta,
    refetchTronPassiveBalances,
    switchNetwork: planes.switchNetwork,
    walletOrchestration,
    lifecycleRefs,
    networkRefs,
    txState,
  }
}
