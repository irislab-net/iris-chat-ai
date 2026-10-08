import type {
  StakingHistoryRow,
  StakingHistoryTotals,
} from "@/staking/execution/stakingEtherscanHistory"
import type { RuntimeOperationContext } from "@/staking/core/runtimeOperationContext"
import type { AddressCodec } from "@/staking/core/address"
import type { StakingDeploymentConfig } from "@/staking/core/types"

export type { StakingHistoryRow, StakingHistoryTotals }

export const EMPTY_STAKING_HISTORY_TOTALS: StakingHistoryTotals = {
  totalDepositsWei: 0n,
  totalWithdrawalsWei: 0n,
  totalFeesWei: 0n,
  netDepositsWei: 0n,
  lastBalanceChangeTimestamp: null,
}

export type StakingHistoryRefreshOptions = Readonly<{
  shallow?: boolean
  skipIfInFlight?: boolean
}>

export type StakingVaultHistoryRefBag = Readonly<{
  stakingHistoryAbortRef: React.MutableRefObject<AbortController | null>
  stakingHistoryFetchGenRef: React.MutableRefObject<number>
  stakingHistoryInFlightRef: React.MutableRefObject<boolean>
  historyLoadWallStartedMsRef: React.MutableRefObject<number | null>
}>

export type UseStakingVaultHistoryCoreInput = Readonly<{
  stakingRuntime: RuntimeOperationContext
  stakingOwnerAddress: string | null | undefined
  address: string | undefined
  tokenAddress: string | null
  tokenDecimals: number | null
  tokenSymbol: string
  tokenName: string
  isTronPassiveRuntime: boolean
  isEthereumNetwork: boolean
  isWrongNetwork: boolean
  tronAddressCodec: AddressCodec
  registerClearOnWrongNetwork?: (clear: () => void) => void
}>

export type StakingVaultHistoryCore = Readonly<{
  refs: StakingVaultHistoryRefBag
  stakingHistoryKey: string | null
  stakingHistoryRows: StakingHistoryRow[]
  stakingHistoryTotals: StakingHistoryTotals
  stakingHistoryLoading: boolean
  stakingHistoryFetched: boolean
  stakingHistoryIndexerError: string | null
  stakingHistoryIndexerPartialWarning: string | null
  stakingPnlHistoryIncomplete: boolean
  stakingPnlHistoryReady: boolean
  setStakingPnlHistoryIncomplete: React.Dispatch<React.SetStateAction<boolean>>
  setStakingPnlHistoryReady: React.Dispatch<React.SetStateAction<boolean>>
  setStakingHistoryRows: React.Dispatch<React.SetStateAction<StakingHistoryRow[]>>
  setStakingHistoryTotals: React.Dispatch<
    React.SetStateAction<StakingHistoryTotals>
  >
  setStakingHistoryLoading: React.Dispatch<React.SetStateAction<boolean>>
  setStakingHistoryFetched: React.Dispatch<React.SetStateAction<boolean>>
  setStakingHistoryIndexerError: React.Dispatch<
    React.SetStateAction<string | null>
  >
  setStakingHistoryIndexerPartialWarning: React.Dispatch<
    React.SetStateAction<string | null>
  >
  refreshStakingHistory: (
    opts?: StakingHistoryRefreshOptions
  ) => Promise<StakingHistoryRow[]>
  refreshStakingHistoryRef: React.MutableRefObject<
    (opts?: StakingHistoryRefreshOptions) => Promise<StakingHistoryRow[]>
  >
}>

export type UseStakingVaultHistoryEffectsInput = StakingVaultHistoryCore &
  Readonly<{
    stakingRuntime: RuntimeOperationContext
    vaultDataReady: boolean
    stakingOwnerAddress: string | null | undefined
    address: string | undefined
    tokenAddress: string | null
    isTronPassiveRuntime: boolean
    isEthereumNetwork: boolean
    isWrongNetwork: boolean
    tronAddressCodec: AddressCodec
  }>

export type BuildStakingHistoryKeyInput = Readonly<{
  stakingOwnerAddress: string | null | undefined
  tokenAddress: string | null
  deployment: StakingDeploymentConfig
}>
