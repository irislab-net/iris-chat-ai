export type {
  BuildStakingHistoryKeyInput,
  StakingHistoryRefreshOptions,
  StakingHistoryRow,
  StakingHistoryTotals,
  StakingVaultHistoryCore,
  StakingVaultHistoryRefBag,
  UseStakingVaultHistoryCoreInput,
  UseStakingVaultHistoryEffectsInput,
} from "@/staking/history/stakingHistoryTypes"
export { EMPTY_STAKING_HISTORY_TOTALS } from "@/staking/history/stakingHistoryTypes"
export {
  buildStakingHistoryKey,
  chainSegmentForStakingHistoryCache,
  normalizeHistoryLatestScannedBlock,
} from "@/staking/history/stakingHistoryKeys"
export {
  aggregateStakingHistoryRows,
  mergeStakingHistoryByHash,
} from "@/staking/history/stakingHistoryMerge"
export {
  useStakingVaultHistory,
  useStakingVaultHistoryCacheHydrate,
  useStakingVaultHistoryCore,
  useStakingVaultHistoryEffects,
  useStakingVaultHistoryInvalidateOnKeyChange,
  useStakingVaultHistoryStallWatchdog,
  useStakingVaultHistoryVaultReadyLoad,
} from "@/staking/history/useStakingVaultHistory"

export type { LoadTronStakingHistoryParams } from "@/staking/history/tron/tronTransactionHistory"
export { loadTronStakingTransactionHistoryRows } from "@/staking/history/tron/tronTransactionHistory"

import { devRegisterStakingPackageOwner } from "@/staking/diagnostics/stakingBoundaryRules"
devRegisterStakingPackageOwner("history")
