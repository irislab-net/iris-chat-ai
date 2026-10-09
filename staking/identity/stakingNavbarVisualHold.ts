import type { StakingRuntimeWalletIdentitySnapshot } from "@/staking/identity/stakingRuntimeWalletIdentityBridge"
import type { ChainFamily } from "@/staking/core/types"

/** Brief hold of last connected chip during runtime identity settle (not cross-family). */
export const STAKING_NAV_VISUAL_HOLD_MS = 1_200

export type NavbarVisualHoldSnapshot = Readonly<{
  shortAddress: string
  chainFamily: ChainFamily
  atMs: number
}>

export type NavbarDisconnectReason =
  | "runtime_wallet_empty"
  | "evm_execution_disconnected"
  | "tron_passive_accounts_empty"
  | "tron_namespace_disconnected"
  | "publish_cleared"

export type NavbarVisualCacheKey =
  | "displayShortAddress"
  | "lastStableVisualRef"
  | "showAsConnected"

/** Confirmed disconnect — no account and not operationally connected on active runtime. */
export function isConfirmedStakingRuntimeDisconnect(
  runtime: Pick<
    StakingRuntimeWalletIdentitySnapshot,
    "hasAccount" | "connected"
  >
): boolean {
  return !runtime.hasAccount && !runtime.connected
}

/**
 * Transient visual gap (anti-flicker only): hydration, namespace settle, or brief publish lag.
 * Never true on a confirmed disconnect.
 */
export function isTransientNavbarVisualGap(
  runtime: Pick<
    StakingRuntimeWalletIdentitySnapshot,
    "chainFamily" | "hasAccount" | "connected"
  >,
  rawShowAsConnected: boolean,
  rawAddress: string
): boolean {
  if (isConfirmedStakingRuntimeDisconnect(runtime)) return false
  if (rawShowAsConnected) return false
  if (runtime.chainFamily === "evm" && runtime.hasAccount && !runtime.connected) {
    return true
  }
  if (runtime.hasAccount && !rawAddress.trim()) return true
  return false
}

export function inferNavbarDisconnectReason(
  runtime: Pick<
    StakingRuntimeWalletIdentitySnapshot,
    "chainFamily" | "hasAccount" | "connected" | "identityOrigin" | "source"
  >,
  hadVisualAccount: boolean
): NavbarDisconnectReason | null {
  if (!hadVisualAccount) return null
  if (!isConfirmedStakingRuntimeDisconnect(runtime)) return null
  if (runtime.source === "none") return "publish_cleared"
  if (runtime.chainFamily === "tron") {
    if (runtime.identityOrigin === "appkit") return "tron_namespace_disconnected"
    return "tron_passive_accounts_empty"
  }
  return "evm_execution_disconnected"
}

export function traceNavbarWalletDisconnectDev(input: Readonly<{
  disconnectDetected: boolean
  reason: NavbarDisconnectReason | null
  clearedVisualCaches: readonly NavbarVisualCacheKey[]
  runtimeKey: string | null
  chainFamily: ChainFamily
}>): void {
  if (!(process.env.NODE_ENV !== 'production')) return
  if (!input.disconnectDetected) return
  console.debug("[navbar-wallet-disconnect]", {
    disconnectDetected: input.disconnectDetected,
    reason: input.reason,
    clearedVisualCaches: input.clearedVisualCaches,
    runtimeKey: input.runtimeKey,
    chainFamily: input.chainFamily,
  })
}
