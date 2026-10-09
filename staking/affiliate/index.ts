// Phase D2b extracted affiliate/pnl derivations

export type {
  StakingAffiliatePrincipalInput,
  StakingAffiliatePrincipalSnapshot,
} from "@/staking/affiliate/stakingAffiliatePrincipal"
export {
  affiliateBaseBalanceToVaultTokenWei,
  buildStakingAffiliatePrincipalInput,
  selectStakingNetPrincipalWei,
  selectStakingAffiliatePrincipalSnapshot,
} from "@/staking/affiliate/stakingAffiliatePrincipal"

export type {
  SelectStakingPnlWeiInput,
  SelectStakingPnlBasisReadyInput,
  SelectStakingAffiliatePnlSnapshotInput,
  StakingAffiliatePnlSnapshot,
} from "@/staking/affiliate/stakingAffiliatePnlSelectors"
export {
  selectStakingPnlWei,
  selectStakingPnlBasisReady,
  selectStakingAffiliatePnlSnapshot,
} from "@/staking/affiliate/stakingAffiliatePnlSelectors"

export type {
  StakingPnlDirection,
  SelectPnlTokenFloatInput,
  SelectCostBasisTokenFloatInput,
  SelectStakingRoiPercentInput,
} from "@/staking/affiliate/stakingAffiliatePresentation"
export {
  signedWeiToTokenFloat,
  selectPnlTokenFloat,
  selectCostBasisTokenFloat,
  getStakingPnlDirectionFromWei,
  normalizeSignedZeroDisplay,
  formatRoiPercentDisplay,
  formatAffiliateRewardSummaryDisplay,
  selectStakingRoiPercent,
  isResidualDustStakingPosition,
  isSettledResidualPosition,
} from "@/staking/affiliate/stakingAffiliatePresentation"
