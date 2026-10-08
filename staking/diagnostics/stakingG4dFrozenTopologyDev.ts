/**
 * G4d architecture freeze — DEV-only anchors for smoke and audits (no runtime behavior).
 */

/** Composer modules removed in G4d; must not be reintroduced under `staking/vault/composer`. */
export const STAKING_G4D_RETIRED_VAULT_COMPOSER_MODULES = [
  "useStakingVaultEvmNetworkGlue",
] as const

/** Canonical network implementation (chain reconciliation + switching). */
export const STAKING_G4D_CANONICAL_NETWORK_GLUE_MODULE = "useStakingVaultNetworkGlue" as const
