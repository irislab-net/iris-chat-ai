import { stakingLifecycleTrace } from "@/staking/diagnostics/stakingLifecycleInstrumentation"
import { beginAppKitHydrationGracePeriod } from "@/lib/wallet/appKitSessionHydrationObserve"

export type StakingConnectGateCategory =
  | "wallet"
  | "network"
  | "runtime"
  | "data"
  | "tx"

export type StakingConnectBlockingGate = Readonly<{
  blocked: boolean
  category: StakingConnectGateCategory | null
  reason: string | null
}>

export type StakingTrustWalletConnectSnapshot = Readonly<{
  atMs: number
  connectIntent: string | null
  evmSignerPhase: string | null
  hasWalletProvider: boolean
  hasSigner: boolean
  isWrongNetwork: boolean
  canTransact: boolean
  awaitingSigner: boolean
}>

let lastConnectIntent: string | null = null
let lastSignerPhase: string | null = null

export function markStakingConnectIntent(source: string): void {
  lastConnectIntent = source
  beginAppKitHydrationGracePeriod()
  stakingLifecycleTrace("wallet", "connect_intent", { source })
}

export function traceStakingEvmSignerHydration(detail: Readonly<{
  phase: string
  evmRuntimeActive?: boolean
  isEthereumNetwork?: boolean
  hasWalletProvider?: boolean
  address?: string | null
  hasSigner?: boolean
}>): void {
  lastSignerPhase = detail.phase
  stakingLifecycleTrace("wallet", "evm_signer_hydration", detail)
}

export function traceStakingTrustWalletConnectSnapshot(
  detail: Record<string, unknown>
): void {
  stakingLifecycleTrace("wallet", "trust_wallet_snapshot", detail)
}

export function buildStakingTrustWalletConnectSnapshot(
  input: Readonly<{
    hasWalletProvider?: boolean
    hasSigner?: boolean
    isWrongNetwork?: boolean
    canTransact?: boolean
    awaitingSigner?: boolean
  }>
): StakingTrustWalletConnectSnapshot {
  return {
    atMs: Date.now(),
    connectIntent: lastConnectIntent,
    evmSignerPhase: lastSignerPhase,
    hasWalletProvider: input.hasWalletProvider ?? false,
    hasSigner: input.hasSigner ?? false,
    isWrongNetwork: input.isWrongNetwork ?? false,
    canTransact: input.canTransact ?? false,
    awaitingSigner: input.awaitingSigner ?? false,
  }
}

export {
  resolveStakingConnectBlockingGateDetailed as resolveStakingConnectBlockingGate,
} from "@/staking/diagnostics/stakingConnectStallLogic"

export function getLastStakingConnectIntent(): string | null {
  return lastConnectIntent
}

export function getLastStakingSignerHydrationPhase(): string | null {
  return lastSignerPhase
}

export function dumpStakingTrustWalletConnectDebug(): StakingTrustWalletConnectSnapshot {
  const snap = buildStakingTrustWalletConnectSnapshot({})
  stakingLifecycleTrace("wallet", "trust_wallet_dump", snap)
  return snap
}

export function installStakingTrustWalletConnectDebugGlobal(): void {
  if (!(process.env.NODE_ENV !== 'production') || typeof window === "undefined") return
  const w = window as typeof window & {
    __dumpStakingTrustWalletConnectDebug?: () => StakingTrustWalletConnectSnapshot
  }
  w.__dumpStakingTrustWalletConnectDebug = dumpStakingTrustWalletConnectDebug
}

export function installStakingTrustWalletMobileTrace(): void {
  if (!(process.env.NODE_ENV !== 'production')) return
  stakingLifecycleTrace("wallet", "trust_wallet_mobile_trace_installed", {})
}
