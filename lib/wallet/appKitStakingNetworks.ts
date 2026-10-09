import { STAKING_APPKIT_NETWORK } from "@/constants/stakingVaultConfig"
import {
  STAKING_CHAIN_ID,
  STAKING_EXPLORER_BASE_URL,
  STAKING_RPC_HTTP_URL,
} from "@/staking/config"
import { LEGACY_EVM_NATIVE_CURRENCY } from "@/staking/config/stakingEthConfig"
import {
  getStakingDeploymentRegistry,
  resolveStakingDeploymentForReconcile,
} from "@/staking/core/getStakingDeploymentRegistry"
import { tryParseCaip2Parts, tryParseEvmChainIdFromCaip2 } from "@/staking/core/providerRuntime"
import type {
  StakingDeploymentConfig,
  StakingDeploymentRegistry,
} from "@/staking/core/types"
import { isRuntimeFamilyEnabled } from "@/staking/runtime/capabilities/stakingRuntimeFamilyRollout"
import type { CaipNetwork } from "@reown/appkit-common"
import {
  defineChain,
  tronMainnet,
  tronNileTestnet,
  tronShastaTestnet,
} from "@reown/appkit/networks"

/** Known Tron CAIP-2 keys from deployment env / registry (reference-style). */
const TRON_CAIP2_TO_APPKIT_NETWORK: Readonly<Record<string, CaipNetwork>> = {
  "tron:mainnet": tronMainnet,
  "tron:nile": tronNileTestnet,
  "tron:shasta": tronShastaTestnet,
}

const TRON_REFERENCE_ALIAS_TO_NETWORK: Readonly<Record<string, CaipNetwork>> = {
  mainnet: tronMainnet,
  nile: tronNileTestnet,
  shasta: tronShastaTestnet,
}

function normalizeHttpUrl(u: string): string {
  return u.trim().replace(/\/$/, "")
}

function caipNetworkDedupeKey(n: CaipNetwork): string {
  const rawId = n.caipNetworkId
  if (typeof rawId === "string" && rawId.trim()) {
    return rawId.trim().toLowerCase()
  }
  const ns = n.chainNamespace ?? "eip155"
  return `${ns}:${String(n.id)}`.toLowerCase()
}

function dedupeCaipNetworks(networks: readonly CaipNetwork[]): CaipNetwork[] {
  const seen = new Set<string>()
  const out: CaipNetwork[] = []
  for (const n of networks) {
    const k = caipNetworkDedupeKey(n)
    if (seen.has(k)) continue
    seen.add(k)
    out.push(n)
  }
  return out
}

/**
 * Resolve a Tron AppKit network from CAIP-2 alone (switch-network path).
 * Returns undefined when unmapped — caller may fall back to passive TronLink switch.
 */
export function resolveTronAppKitNetworkFromCaip2(caip2: string): CaipNetwork | undefined {
  const key = caip2.trim().toLowerCase()
  const direct = TRON_CAIP2_TO_APPKIT_NETWORK[key]
  if (direct) return direct
  const byCaipId = Object.values(TRON_CAIP2_TO_APPKIT_NETWORK).find(
    n => n.caipNetworkId?.toLowerCase() === key,
  )
  if (byCaipId) return byCaipId
  const parts = tryParseCaip2Parts(caip2)
  if (parts?.namespace === "tron") {
    const alias = TRON_REFERENCE_ALIAS_TO_NETWORK[parts.reference.trim().toLowerCase()]
    if (alias) return alias
  }
  return undefined
}

export function evmAppKitNetworkFromDeployment(d: StakingDeploymentConfig): CaipNetwork {
  const chainId = tryParseEvmChainIdFromCaip2(d.caip2)
  if (chainId === null) {
    return STAKING_APPKIT_NETWORK as unknown as CaipNetwork
  }
  if (
    chainId === STAKING_CHAIN_ID &&
    normalizeHttpUrl(d.rpc.http) === normalizeHttpUrl(STAKING_RPC_HTTP_URL) &&
    normalizeHttpUrl(d.explorer.baseUrl) === normalizeHttpUrl(STAKING_EXPLORER_BASE_URL)
  ) {
    return STAKING_APPKIT_NETWORK as unknown as CaipNetwork
  }
  return defineChain({
    id: chainId,
    name: d.labels.network,
    nativeCurrency: { ...LEGACY_EVM_NATIVE_CURRENCY },
    rpcUrls: { default: { http: [d.rpc.http] } },
    blockExplorers: {
      default: { name: d.explorer.label, url: d.explorer.baseUrl },
    },
  } as never) as unknown as CaipNetwork
}

export function tronAppKitNetworkFromDeployment(d: StakingDeploymentConfig): CaipNetwork {
  const fromCaip2 = resolveTronAppKitNetworkFromCaip2(d.caip2)
  if (fromCaip2) return fromCaip2

  const parts = tryParseCaip2Parts(d.caip2)
  if (!parts || parts.namespace !== "tron") {
    return defineChain({
      id: "0x0",
      name: d.labels.network,
      network: "tron-deployment",
      nativeCurrency: { name: "TRX", symbol: "TRX", decimals: 6 },
      rpcUrls: { default: { http: [d.rpc.http] } },
      blockExplorers: { default: { name: d.explorer.label, url: d.explorer.baseUrl } },
      testnet: true,
      chainNamespace: "tron",
      caipNetworkId: (d.caip2.trim() || "tron:unknown") as CaipNetwork["caipNetworkId"],
    }) as unknown as CaipNetwork
  }
  const ref = parts.reference.trim().toLowerCase()
  const idHex = ref.startsWith("0x") ? ref : `0x${ref}`
  const slug = ref.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "custom"
  const mainHex = String(tronMainnet.id).toLowerCase()
  return defineChain({
    id: idHex,
    name: d.labels.network,
    network: `tron-${slug}`,
    nativeCurrency: { name: "TRX", symbol: "TRX", decimals: 6 },
    rpcUrls: { default: { http: [d.rpc.http] } },
    blockExplorers: { default: { name: d.explorer.label, url: d.explorer.baseUrl } },
    testnet: idHex.toLowerCase() !== mainHex,
    chainNamespace: "tron",
    caipNetworkId: d.caip2.trim() as CaipNetwork["caipNetworkId"],
  }) as unknown as CaipNetwork
}

/** EVM or Tron only — never Solana (staking wallet connect scope). */
function stakingWalletConnectFallbackNetwork(tronEnabled: boolean): CaipNetwork {
  if (tronEnabled) return tronMainnet
  return STAKING_APPKIT_NETWORK as unknown as CaipNetwork
}

function pickStakingDeploymentForAppKitDefault(
  reg: StakingDeploymentRegistry,
  ethEnabled: boolean,
  tronEnabled: boolean
): StakingDeploymentConfig {
  if (ethEnabled && tronEnabled) {
    const firstEvm = reg.deployments.find(deployment => deployment.chainFamily === "evm")
    if (firstEvm) return firstEvm
  }
  return resolveStakingDeploymentForReconcile(reg, reg.defaultDeploymentId)
}

/**
 * AppKit `defaultNetwork` for staking: follows the enabled staking deployment registry,
 * not family-level hardcoding (e.g. always `tronMainnet` when Tron is on).
 */
export function resolveAppKitDefaultStakingNetwork(): CaipNetwork {
  const ethEnabled = isRuntimeFamilyEnabled("evm")
  const tronEnabled = isRuntimeFamilyEnabled("tron")
  if (!ethEnabled && !tronEnabled) {
    return STAKING_APPKIT_NETWORK as unknown as CaipNetwork
  }

  const reg = getStakingDeploymentRegistry()
  if (reg.deployments.length === 0) {
    return stakingWalletConnectFallbackNetwork(tronEnabled)
  }

  const d = pickStakingDeploymentForAppKitDefault(reg, ethEnabled, tronEnabled)
  if (d.chainFamily === "evm") {
    if (!ethEnabled) {
      return stakingWalletConnectFallbackNetwork(tronEnabled)
    }
    return evmAppKitNetworkFromDeployment(d)
  }
  if (d.chainFamily === "tron") {
    if (!tronEnabled) {
      return stakingWalletConnectFallbackNetwork(tronEnabled)
    }
    return tronAppKitNetworkFromDeployment(d)
  }
  return stakingWalletConnectFallbackNetwork(tronEnabled)
}

export function buildReownAppKitNetworksAndDefault(): Readonly<{
  networks: CaipNetwork[]
  defaultNetwork: CaipNetwork
}> {
  const ethEnabled = isRuntimeFamilyEnabled("evm")
  const tronEnabled = isRuntimeFamilyEnabled("tron")
  const defaultNetwork = resolveAppKitDefaultStakingNetwork()
  const reg = getStakingDeploymentRegistry()
  const evmNets = ethEnabled
    ? reg.deployments.filter(d => d.chainFamily === "evm").map(evmAppKitNetworkFromDeployment)
    : []
  const tronNets = tronEnabled
    ? ([tronMainnet, tronNileTestnet, tronShastaTestnet] as const)
    : []
  const networks = dedupeCaipNetworks([defaultNetwork, ...evmNets, ...tronNets])
  return { networks, defaultNetwork }
}
