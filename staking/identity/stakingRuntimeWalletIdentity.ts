import type { ResolveUnifiedTronIdentityInput } from "@/staking/identity/tron/resolveUnifiedTronIdentity"
import { resolveUnifiedTronIdentity } from "@/staking/identity/tron/resolveUnifiedTronIdentity"
import type { ChainFamily } from "@/staking/core/types"

export type StakingRuntimeWalletSource = "evm" | "tron" | "none"

/** Phase 2 — which layer supplied the active TRON address (when unified identity is enabled). */
export type StakingRuntimeWalletIdentityOrigin = "appkit" | "passive" | "none"

/** Active-runtime wallet identity for UI + passive reads (not EVM execution signing). */
export type StakingRuntimeWalletIdentity = Readonly<{
  chainFamily: ChainFamily
  address: string | null
  /** Account authorized and on expected Tron network (Tron) or EVM connected (EVM). */
  connected: boolean
  /** Tron: base58 present. EVM: same as `connected` when address present. */
  hasAccount: boolean
  /** Tron: TronLink chain matches deployment. EVM: always true when evaluated. */
  networkOk: boolean
  source: StakingRuntimeWalletSource
  /** Tron TIP-3326 chain id (hex) when known — unified or passive path. */
  tronChainId?: string | null
  /** Populated when TRON unified identity is active (`VITE_APPKIT_TRON_IDENTITY`). */
  identityOrigin?: StakingRuntimeWalletIdentityOrigin
}>

export function resolveStakingRuntimeWalletIdentity(input: Readonly<{
  chainFamily: ChainFamily
  evmAddress: string | null | undefined
  evmConnected: boolean
  passiveTronBase58: string | null | undefined
  passiveTronNetworkOk?: boolean
  /** When set on Tron runtime, AppKit namespace is primary and passive is fallback. */
  unifiedTron?: ResolveUnifiedTronIdentityInput
}>): StakingRuntimeWalletIdentity {
  if (input.chainFamily === "tron") {
    if (input.unifiedTron) {
      const u = resolveUnifiedTronIdentity(input.unifiedTron)
      return {
        chainFamily: "tron",
        address: u.address,
        connected: u.connected,
        hasAccount: u.hasAccount,
        networkOk: u.networkOk,
        source: u.hasAccount ? "tron" : "none",
        tronChainId: u.chainId,
        identityOrigin: u.source,
      }
    }
    const address = input.passiveTronBase58?.trim() || null
    const hasAccount = Boolean(address)
    const networkOk = input.passiveTronNetworkOk === true
    const connected = hasAccount && networkOk
    return {
      chainFamily: "tron",
      address,
      connected,
      hasAccount,
      networkOk,
      source: hasAccount ? "tron" : "none",
    }
  }
  const address = input.evmAddress?.trim() || null
  const hasAccount = Boolean(address)
  const connected = Boolean(input.evmConnected && address)
  return {
    chainFamily: input.chainFamily,
    address,
    connected,
    hasAccount,
    networkOk: true,
    source: connected ? "evm" : "none",
  }
}

/** Short label for toolbar / chips — never surfaces a stale cross-runtime address. */
export function formatStakingRuntimeWalletShort(
  address: string | null | undefined
): string {
  const t = address?.trim() ?? ""
  if (!t) return ""
  if (t.length < 11) return t
  return `${t.slice(0, 6)}…${t.slice(-4)}`
}
