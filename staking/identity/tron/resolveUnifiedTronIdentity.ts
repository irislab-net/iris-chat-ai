import type { UseAppKitTronAccountResult } from "@/hooks/useAppKitTronAccount"
import { createTronAddressCodec } from "@/staking/core/address"
import { passiveTronCaip2ToChainId } from "@/staking/identity/tron/tronWalletIdentity"

const tronCodec = createTronAddressCodec()

export type UnifiedTronIdentitySource = "appkit" | "passive" | "none"

/** Pure read-only TRON identity: AppKit namespace first, passive TronLink second. */
export type UnifiedTronIdentity = Readonly<{
  address: string | null
  connected: boolean
  hasAccount: boolean
  networkOk: boolean
  chainId: string | null
  source: UnifiedTronIdentitySource
}>

function normalizeTronBase58(address: string | null | undefined): string | null {
  const t = address?.trim()
  if (!t || !tronCodec.isValid(t)) return null
  return t
}

function normalizeChainIdHex(raw: string | null | undefined): string | null {
  if (raw == null) return null
  const t = raw.trim().toLowerCase()
  if (!/^0x[0-9a-f]+$/.test(t)) return null
  return t
}

function networkOkForDeployment(
  deploymentCaip2: string,
  chainIdHex: string | null
): boolean {
  const expected = passiveTronCaip2ToChainId(deploymentCaip2)
  if (!expected || !chainIdHex) return false
  return expected.toLowerCase() === chainIdHex
}

/** Parse TIP-3326 chain id from AppKit `tron:{reference}:…` CAIP address (namespace-safe). */
function chainIdHexFromTronCaipAddress(
  caipAddress: string | undefined
): string | null {
  const t = caipAddress?.trim()
  if (!t) return null
  const parts = t.split(":")
  if (parts.length < 2 || parts[0].toLowerCase() !== "tron") return null
  return passiveTronCaip2ToChainId(`${parts[0]}:${parts[1]}`.toLowerCase())
}

export type ResolveUnifiedTronIdentityInput = Readonly<{
  deploymentCaip2: string
  appKit: Pick<
    UseAppKitTronAccountResult,
    "address" | "isConnected" | "caipAddress" | "network"
  >
  passive: Readonly<{
    base58: string | null | undefined
    chainId: string | null | undefined
    networkOk: boolean
  }>
}>

/**
 * Priority: (1) AppKit TRON namespace when connected with valid base58,
 * (2) passive TronLink, (3) empty. Never mutates external state.
 */
export function resolveUnifiedTronIdentity(
  input: ResolveUnifiedTronIdentityInput
): UnifiedTronIdentity {
  const passiveAddr = normalizeTronBase58(input.passive.base58)
  const passiveChainId = normalizeChainIdHex(input.passive.chainId)

  const appKitAddr = normalizeTronBase58(input.appKit.address)
  const appKitChainIdFromNamespace =
    normalizeChainIdHex(
      input.appKit.network?.id != null ? String(input.appKit.network.id) : undefined,
    ) ??
    chainIdHexFromTronCaipAddress(input.appKit.caipAddress)
  /** AppKit tron network id, then CAIP address, then passive inject (avoids global `caipNetwork` desync). */
  const walletChainIdHex =
    appKitChainIdFromNamespace ?? (appKitAddr ? passiveChainId : null)
  const appKitNetworkOk = networkOkForDeployment(
    input.deploymentCaip2,
    walletChainIdHex
  )

  if (input.appKit.isConnected && appKitAddr) {
    return {
      address: appKitAddr,
      hasAccount: true,
      networkOk: appKitNetworkOk,
      connected: appKitNetworkOk,
      chainId: walletChainIdHex ?? passiveChainId,
      source: "appkit",
    }
  }

  if (passiveAddr) {
    return {
      address: passiveAddr,
      hasAccount: true,
      networkOk: input.passive.networkOk,
      connected: input.passive.networkOk,
      chainId: passiveChainId,
      source: "passive",
    }
  }

  return {
    address: null,
    connected: false,
    hasAccount: false,
    networkOk: false,
    chainId: passiveChainId ?? appKitChainIdFromNamespace,
    source: "none",
  }
}
