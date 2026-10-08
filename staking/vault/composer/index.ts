export {
  STAKING_VAULT_EVM_SWITCH_VERIFY_MAX_MS,
  STAKING_VAULT_EVM_SWITCH_VERIFY_POLL_MS,
  STAKING_VAULT_EMPTY_BALANCE_SNAPSHOT,
} from "@/staking/vault/composer/stakingVaultComposerContracts"
export {
  buildStakingVaultBalanceRefBag,
  buildStakingVaultBalanceRefreshSetters,
  buildStakingVaultBalanceResetSetters,
} from "@/staking/vault/composer/stakingVaultComposerDtos"
export {
  assertStakingVaultPublicTopology,
  STAKING_VAULT_PUBLIC_TOPOLOGY_KEYS,
} from "@/staking/vault/composer/stakingVaultPublicTopology"
export { assembleStakingVaultPublicValue } from "@/staking/vault/composer/stakingVaultPublicAssembly"
export type { AssembleStakingVaultPublicValueInput } from "@/staking/vault/composer/stakingVaultPublicAssembly"
export { useStakingVaultComposerBalanceState } from "@/staking/vault/composer/useStakingVaultComposerBalanceState"
export type { StakingVaultComposerBalanceState } from "@/staking/vault/composer/useStakingVaultComposerBalanceState"
export { useStakingVaultComposerLifecycleEffects } from "@/staking/vault/composer/useStakingVaultComposerLifecycleEffects"
export { useStakingVaultComposerRefs } from "@/staking/vault/composer/useStakingVaultComposerRefs"
export type { StakingVaultComposerRefs } from "@/staking/vault/composer/useStakingVaultComposerRefs"
export { useStakingVaultComposerTxState } from "@/staking/vault/composer/useStakingVaultComposerTxState"
export type { StakingVaultComposerTxState } from "@/staking/vault/composer/useStakingVaultComposerTxState"
export { useStakingVaultHistoryPlane } from "@/staking/vault/composer/useStakingVaultHistoryPlane"
export type { StakingVaultHistoryPlane } from "@/staking/vault/composer/useStakingVaultHistoryPlane"
export { useStakingVaultPresentationPlane } from "@/staking/vault/composer/useStakingVaultPresentationPlane"
export { useStakingVaultRefreshPlane } from "@/staking/vault/composer/useStakingVaultRefreshPlane"
export type { StakingVaultRefreshPlane } from "@/staking/vault/composer/useStakingVaultRefreshPlane"
export { useStakingVaultRuntimeContext } from "@/staking/vault/composer/useStakingVaultRuntimeContext"
export type { StakingVaultRuntimeContext } from "@/staking/vault/composer/useStakingVaultRuntimeContext"

import { devRegisterStakingPackageOwner } from "@/staking/diagnostics/stakingBoundaryRules"
devRegisterStakingPackageOwner("vault")
