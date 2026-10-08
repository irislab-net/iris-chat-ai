export type {
  StakingContractReadOptions,
  FieldResult,
  StakingFastReadResult,
  StakingSlowReadResult,
} from "@/staking/execution/stakingReadFactory"
export {
  stakingLastHealthyRpcAtRef,
  getStakingErc20Read,
  getStakingVaultRead,
  executeStakingErc20BalanceOf,
  executeStakingFastRead,
  executeStakingSlowRead,
} from "@/staking/execution/stakingReadFactory"

export type { StakingRpcCapabilities } from "@/staking/execution/stakingReadProviders"
export {
  getStakingLegacyReadJsonRpcProvider,
  getStakingJsonRpcProvider,
  stakingLatestBlockNumberRef,
  stakingLastObservedBlockAtRef,
  getStakingRpcCapabilities,
  probeStakingRpcCapabilities,
  acquireStakingWsBlockSignal,
  disposeStakingWebSocketOnly,
} from "@/staking/execution/stakingReadProviders"

export {
  refreshStakingEthUsdPrice,
  subscribeStakingEthUsdPresentation,
  getStakingEthUsdPresentation,
  getStakingEthUsdRevision,
} from "@/staking/execution/ethUsdPriceCache"

export type {
  StakingTxType,
  StakingTxStatus,
  StakingHistoryRow,
  StakingHistoryTotals,
  StakingHistoryCacheEntry,
  LoadStakingHistoryParams,
  LoadStakingHistoryResult,
} from "@/staking/execution/stakingEtherscanHistory"
export {
  stakingTransactionHistoryCache,
  logStakingHistoryConsoleError,
  stakingHistoryCacheKey,
  mergeStakingHistoryByHash,
  STAKING_TX_TAGS,
  isNegligibleStakingAmountWei,
  formatStakingTxAmountDisplay,
  shouldDisplayStakingHistoryAmount,
  extractTxHistoryArrayFromJson,
  extractTxHistoryTopLevelBaseBalance,
  normalizeTxHistoryTimestampSeconds,
  normalizeStakingHistoryTxHashWire,
  stakingHistoryRowsFingerprint,
  aggregateStakingHistoryRows,
  loadStakingTransactionHistoryRows,
  stakingHistoryRowTransactionExplorerUrl,
} from "@/staking/execution/stakingEtherscanHistory"

export type {
  RpcRoute,
  StakingGasMethod,
  GasEstimateResult,
  EstimateGasParams,
  NativeBalanceParams,
} from "@/staking/execution/stakingGasEstimator"
export {
  stakingDepositMethodForGas,
  buildGasCacheKey,
  clearGasCaches,
  estimateStakingGasFee,
  getCachedNativeBalanceWei,
  NEAR_ZERO_ETH_WEI,
  isNearZeroNativeBalance,
} from "@/staking/execution/stakingGasEstimator"

export type { StakingGasToastInput } from "@/staking/execution/stakingGasToastDedupe"
export { useStakingGasToastDedupe } from "@/staking/execution/stakingGasToastDedupe"

export type {
  TronPassiveReadBalances,
  TronPassiveTokenMeta,
} from "@/staking/execution/tronPassiveReads"
export {
  tronAbiAddressWordFromBase58,
  fetchTronPassiveReadBalances,
  fetchTronPassiveTokenMeta,
} from "@/staking/execution/tronPassiveReads"

export { createTronReceiptResolver } from "@/staking/execution/createTronReceiptResolver"

export { stakingTxExplorerUrlForFrozenRuntime } from "@/staking/execution/stakingTxExplorerFromDeployment"

export type {
  BuildNetworkFeeDisplayLineInput,
  EthUsdFeedPresentation,
  NetworkFeePresentationHints,
} from "@/staking/execution/buildNetworkFeePresentation"
export {
  buildNetworkFeeDisplayLine,
  computeEthFeeMicroUsd,
  ethUsdPresentationKey,
  formatMicroUsdParen,
  stakingGasFeeZeroDisplayLine,
} from "@/staking/execution/buildNetworkFeePresentation"

import { devRegisterStakingPackageOwner } from "@/staking/diagnostics/stakingBoundaryRules"
devRegisterStakingPackageOwner("execution")
