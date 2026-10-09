/**
 * ARCH-FREEZE — static markers only (safe to import from `src/staking/diagnostics/index.ts`).
 * Heavier scans live in `stakingArchFreezeDev.ts` (DEV dynamic import from vault mount).
 */
export const STAKING_ARCHITECTURE_FREEZE_TOKEN = "ARCH-FREEZE-2026-05-staking" as const

/** Must stay aligned with `stakingVaultComposerContracts.ts` + `stakingNetworkContracts.ts`. */
export const STAKING_HOOK_ORDER_FREEZE_MARK =
  "composer:D4+refresh:S1+network:E1+CFG6-sentinel+G4d-network-glue" as const
