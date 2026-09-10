import type { EntitlementSnapshot } from "@/lib/entitlements/types"
import { canExecuteMainnet, canExecuteTestnet } from "@/lib/entitlements/capabilities"

export type HyperliquidNetwork = "mainnet" | "testnet"

/** Active execution network for this build — testnet only. */
export const HYPERLIQUID_EXECUTION_NETWORK: HyperliquidNetwork = "testnet"

export const HYPERLIQUID_TESTNET_EXECUTION_ENABLED =
  process.env.NEXT_PUBLIC_HYPERLIQUID_TESTNET_EXECUTION === "true"

/** Separate gate — never enabled by default. Mainnet remains impossible without explicit ops action. */
export const HYPERLIQUID_MAINNET_EXECUTION_ENABLED =
  process.env.NEXT_PUBLIC_HYPERLIQUID_MAINNET_EXECUTION === "true"

const ENDPOINTS: Record<
  HyperliquidNetwork,
  { infoUrl: string; wsUrl: string; label: string }
> = {
  mainnet: {
    infoUrl: "https://api.hyperliquid.xyz/info",
    wsUrl: "wss://api.hyperliquid.xyz/ws",
    label: "Hyperliquid Mainnet",
  },
  testnet: {
    infoUrl: "https://api.hyperliquid-testnet.xyz/info",
    wsUrl: "wss://api.hyperliquid-testnet.xyz/ws",
    label: "Hyperliquid Testnet",
  },
}

export function hyperliquidEndpoints(network: HyperliquidNetwork) {
  return ENDPOINTS[network]
}

/** Resolves which network may execute — testnet and mainnet require separate entitlements and env flags. */
export function resolveExecutionNetwork(input: {
  entitlements: EntitlementSnapshot
  testnetEnvEnabled?: boolean
  mainnetEnvEnabled?: boolean
}): HyperliquidNetwork | null {
  const testnetEnv = input.testnetEnvEnabled ?? HYPERLIQUID_TESTNET_EXECUTION_ENABLED
  const mainnetEnv = input.mainnetEnvEnabled ?? HYPERLIQUID_MAINNET_EXECUTION_ENABLED
  if (testnetEnv && canExecuteTestnet(input.entitlements)) return "testnet"
  if (mainnetEnv && canExecuteMainnet(input.entitlements)) return "mainnet"
  return null
}

export function assertExecutionNetwork(network: HyperliquidNetwork): void {
  if (network === "mainnet") {
    throw new Error("Mainnet execution is disabled in this build.")
  }
  if (network !== "testnet") {
    throw new Error(`Unsupported execution network: ${network}`)
  }
}

export function isTestnetExecutionEnabled(input: {
  accessResolved: boolean
  canExecuteTestnet: boolean
  testnetEnvEnabled?: boolean
}): boolean {
  return (
    (input.testnetEnvEnabled ?? HYPERLIQUID_TESTNET_EXECUTION_ENABLED) &&
    input.accessResolved &&
    input.canExecuteTestnet
  )
}
