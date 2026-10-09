/**
 * Staking network / chain plane — ownership and sequencing contracts (Phase E1).
 *
 * ## Chain ownership
 *
 * | Concern | Owner | Notes |
 * | ------- | ----- | ----- |
 * | Runtime deployment identity | `stakingRuntime.deployment` | CAIP-2, chain family, labels |
 * | Execution plane (EVM tx) | `useStakingVaultRuntimePlanes` | AppKit eip155 account, `executionChainId`, signer |
 * | Runtime wallet (passive Tron) | `runtimeWallet` identity | TronLink networkOk, not AppKit execution |
 * | Wrong-network truth | `selectIsWrongNetwork` | Tron: `!runtimeWallet.networkOk`; EVM: chainId !== expected |
 * | Execution network OK | `selectExecutionNetworkOk` | EVM-only; requires connected + matching executionChainId |
 * | Switch UX + reconciliation | `useStakingVaultNetworkGlue` | Auto-switch, manual switch, pre-loadMeta reconcile |
 *
 * ## Registration order (forbidden to violate)
 *
 * 1. `useStakingVaultNetworkChainMirrors` — sync `numericChainIdRef` / `tokenMetaErrorRef` (before refresh)
 * 2. Balance reset / continuity
 * 3. `useStakingVaultNetworkGlue` — EVM reconciliation + switch callbacks (before `loadMeta`)
 * 4. `useStakingVaultTokenReadsMountLoadMeta`
 * 5. Tx-notify, orchestrator, Tron polling
 *
 * ## EVM-only vs Tron-only paths
 *
 * - **EVM**: chain reconciliation effect, auto-switch poll, `executionChainId`, `switchNetwork(STAKING_APPKIT_NETWORK)`
 * - **Tron**: `requestNetworkSwitch` via wallet orchestration only; invalidates meta + passive balance refetch; no EVM reconcile effect body
 *
 * ## Wrong-network truth table (simplified)
 *
 * | Family | Condition | `isWrongNetwork` |
 * | ------ | --------- | ---------------- |
 * | Tron | no account | false |
 * | Tron | account + networkOk | false |
 * | Tron | account + !networkOk | true |
 * | EVM | !connected or !ethereum network | false |
 * | EVM | connected + chainId !== expected | true |
 */

export const STAKING_NETWORK_EVM_SWITCH_VERIFY_POLL_MS = 150
export const STAKING_NETWORK_EVM_SWITCH_VERIFY_MAX_MS = 1500

/** @deprecated Use `STAKING_NETWORK_EVM_SWITCH_VERIFY_POLL_MS` — composer shim */
export const STAKING_VAULT_EVM_SWITCH_VERIFY_POLL_MS = STAKING_NETWORK_EVM_SWITCH_VERIFY_POLL_MS

/** @deprecated Use `STAKING_NETWORK_EVM_SWITCH_VERIFY_MAX_MS` — composer shim */
export const STAKING_VAULT_EVM_SWITCH_VERIFY_MAX_MS = STAKING_NETWORK_EVM_SWITCH_VERIFY_MAX_MS
