import { MaxUint256 } from "ethers"

/**
 * Staking vault composer — hook-order contracts (Phase D4).
 *
 * ## Registration order (do not reorder without topology audit)
 *
 * 1. **Runtime plane** — `useRuntimeTransitionSnapshot`, read JSON-RPC memo, `useStakingVaultRuntimePlanes`
 * 2. **Composer refs** — `useStakingVaultComposerRefs` (lifecycle, refresh, history glue)
 * 2b. **Network refs** — `useStakingVaultNetworkRefs` + `useStakingVaultNetworkChainMirrors` (`@/staking/runtime/network`)
 * 3. **Reads plane** — `useStakingVaultTokenReads`
 * 4. **Affiliate plane** — `useAffiliateFirestoreStats`
 * 5. **Balance + tx state** — `useStakingVaultComposerBalanceState`, `useStakingVaultComposerTxState`
 * 6. **Identity derivations** — `isWrongNetwork`, `walletOrchestration`, early history wrong-network clear
 * 7. **Affiliate / capability selectors** — PnL basis, `canTransact`, `awaitingSigner`
 * 8. **Lifecycle + network mirrors** — mount ref, diagnostics mount; chain mirrors in network plane
 * 9. **Refresh plane** (`useStakingVaultRefreshPlane`) — sequencing-sensitive; see refresh module
 * 10. **History plane** (`useStakingVaultHistoryPlane`) — core → Tron rehydrate glue → history effects
 * 11. **Presentation memos** — formatted balances, caps, PnL wei, balance anchor
 * 12. **Tx execution plane** — `useStakingVaultTxExecution` (after `refreshStakingHistory` exists)
 * 13. **Diagnostics plane** — `useStakingVaultDiagnostics`
 * 14. **Public assembly** — `assembleStakingVaultPublicValue`
 *
 * ## Forbidden reorder zones
 *
 * - **Refresh bundle**: asset lifecycle → balance callbacks → Tron ref wiring → reset/continuity →
 *   network glue (`useStakingVaultNetworkGlue`) → `loadMeta` mount → `refreshKey` tx-notify → orchestrator → Tron polling
 * - **History bundle**: `useStakingVaultHistoryCore` before Tron rehydrate; rehydrate before stall/invalidate/hydrate/mount effects
 * - **Early history clear**: wrong-network abort registration must stay before refresh plane (vault glue ref)
 *
 * ## Refresh ordering (post-tx, unchanged)
 *
 * - Deposit/withdraw: `setRefreshKey` → tx-notify orchestrator → `refreshStakingHistory` → `refetchAffiliateStats`
 * - Approve-only: `refreshBalances()` (no `refreshKey` bump)
 *
 * ## Ownership
 *
 * - **Modal / persistence**: `TransactionStatusProvider` + `src/staking/tx/*` — not composed here
 * - **Network glue**: `@/staking/runtime/network` only (`useStakingVaultNetworkGlue`) — switch UX + EVM chain reconciliation; composer wires it inside the refresh plane, no composer-local shim (G4d)
 * - **Frozen topology**: see `docs/staking-domain-boundaries.md` § “Frozen topology (G4d)”
 */

export {
  STAKING_VAULT_EVM_SWITCH_VERIFY_MAX_MS,
  STAKING_VAULT_EVM_SWITCH_VERIFY_POLL_MS,
} from "@/staking/runtime/network/stakingNetworkContracts"

/** Empty balance snapshot seeds for refresh ref bag (orchestrator + reset). */
export const STAKING_VAULT_EMPTY_BALANCE_SNAPSHOT = {
  walletBalance: 0n,
  allowance: 0n,
  vaultShares: 0n,
  stakedAssets: 0n,
  vaultMaxDepositWei: MaxUint256,
  vaultMaxWithdrawWei: MaxUint256,
  minWithdrawalFeeWei: 0n,
} as const
