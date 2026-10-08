import type { BalanceSnapshot } from "@/staking/reads/types"
import type { StakingTokenMetaError } from "@/staking/reads/types"
import type { RuntimeOperationContext } from "@/staking/core/runtimeOperationContext"
import type { AddressCodec } from "@/staking/core/address"
import type { useRuntimeTransitionSnapshot } from "@/staking/core/runtimeSelectionHooks"

export type { BalanceSnapshot }

export type StakingVaultBalanceRefBag = Readonly<{
  balanceSnapshotRef: React.MutableRefObject<BalanceSnapshot>
  lastDisplayBalancesRef: React.MutableRefObject<BalanceSnapshot>
  observedBalanceRef: React.MutableRefObject<{ balance: bigint; anchorMs: number } | null>
  tronPassiveRefetchRef: React.MutableRefObject<(() => void) | null>
  tronPassiveFetchGenRef: React.MutableRefObject<number>
  tronPassiveReadFailStreakRef: React.MutableRefObject<number>
}>

export type StakingVaultBalanceRefreshSetters = Readonly<{
  setWalletBalance: React.Dispatch<React.SetStateAction<bigint>>
  setAllowance: React.Dispatch<React.SetStateAction<bigint>>
  setVaultShares: React.Dispatch<React.SetStateAction<bigint>>
  setStakedAssets: React.Dispatch<React.SetStateAction<bigint>>
  setVaultMaxDepositWei: React.Dispatch<React.SetStateAction<bigint>>
  setVaultMaxWithdrawWei: React.Dispatch<React.SetStateAction<bigint>>
  setMinWithdrawalFeeWei: React.Dispatch<React.SetStateAction<bigint>>
  setBalancesFetched: React.Dispatch<React.SetStateAction<boolean>>
  setObservedBalanceAnchorMs: React.Dispatch<React.SetStateAction<number | null>>
  setTokenMetaFetched: React.Dispatch<React.SetStateAction<boolean>>
  setTokenDecimals: React.Dispatch<React.SetStateAction<number | null>>
  setTokenMetaError: React.Dispatch<React.SetStateAction<StakingTokenMetaError | null>>
}>

export type StakingVaultBalanceRefreshCallbacksInput = Readonly<{
  isMountedRef: React.MutableRefObject<boolean>
  transition: ReturnType<typeof useRuntimeTransitionSnapshot>
  stakingRuntime: RuntimeOperationContext
  tronAddressCodec: AddressCodec
  isTronPassiveRuntime: boolean
  refs: StakingVaultBalanceRefBag
  setters: StakingVaultBalanceRefreshSetters
  runtimeWalletAddress: string | null
}>

export type StakingVaultBalanceRefreshTronRefetchWiringInput = Readonly<{
  isTronPassiveRuntime: boolean
  refs: Pick<StakingVaultBalanceRefBag, "tronPassiveRefetchRef">
  refetchTronPassiveBalances: () => Promise<void>
}>

export type StakingVaultBalanceRefreshResetAndContinuityInput = Readonly<{
  isTronPassiveRuntime: boolean
  stakingRuntime: RuntimeOperationContext
  runtimeWallet: Readonly<{ identityOrigin?: string }>
  runtimeWalletAddress: string | null
  address: string | undefined
  numericChainId: number | null
  isConnected: boolean
  isEthereumNetwork: boolean
  isWrongNetwork: boolean
  tokenAddress: string | null
  tronAddressCodec: AddressCodec
  refs: Pick<StakingVaultBalanceRefBag, "balanceSnapshotRef" | "lastDisplayBalancesRef">
  setters: Pick<
    StakingVaultBalanceRefreshSetters,
    "setTokenMetaFetched" | "setBalancesFetched" | "setTokenDecimals" | "setTokenMetaError"
  >
}>

export type StakingVaultBalanceRefreshOrchestratorInput = Readonly<{
  isMountedRef: React.MutableRefObject<boolean>
  transition: ReturnType<typeof useRuntimeTransitionSnapshot>
  /** CFG6 — false when runtime session is sentinel or family build-disabled (no EVM orchestrator). */
  runtimeHydrationEnabled: boolean
  isTronPassiveRuntime: boolean
  isConnected: boolean
  address: string | undefined
  tokenAddress: string | null
  isEthereumNetwork: boolean
  isWrongNetwork: boolean
  assetResolved: boolean
  chainId: number | null
  expectedChainId: number
  refs: StakingVaultBalanceRefBag
  setters: StakingVaultBalanceRefreshSetters
}>

export type StakingVaultBalanceRefreshTronPollingInput = Readonly<{
  /** CFG6 — false when Tron family off or sentinel session (no passive polling). */
  runtimeHydrationEnabled: boolean
  isTronPassiveRuntime: boolean
  tokenAddress: string | null
  runtimeWalletAddress: string | null
  stakingRuntime: RuntimeOperationContext
  tronAddressCodec: AddressCodec
  refs: StakingVaultBalanceRefBag
  setters: StakingVaultBalanceRefreshSetters
  refetchTronPassiveBalances: () => Promise<void>
}>

export type StakingVaultBalanceRefreshCallbacks = Readonly<{
  refreshBalances: () => void
  refetchTronPassiveBalances: () => Promise<void>
}>
