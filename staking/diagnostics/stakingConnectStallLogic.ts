import type { StakingConnectBlockingGate } from "@/staking/diagnostics/stakingTrustWalletConnectDebug"

/** Canonical reasons for connect-flow readiness gates (Sentry + stall watchdog). */
export type StakingConnectBlockingReason =
  | "not_connected"
  | "wrong_network"
  | "network_switch_in_progress"
  | "awaiting_signer"
  | "cannot_transact"
  | "vault_data_loading"
  | "runtime_hydration_disabled"
  | "runtime_transition_paused"
  | "token_meta_error"
  | "vault_tx_loading"
  | "ready"

export const STAKING_CONNECT_STALL_THRESHOLD_MS = 10_000

/** Gates that represent unresolved runtime readiness (not user-actionable network switch). */
export const STAKING_CONNECT_STALL_GATE_REASONS: ReadonlySet<StakingConnectBlockingReason> =
  new Set([
    "awaiting_signer",
    "cannot_transact",
    "vault_data_loading",
    "runtime_hydration_disabled",
    "runtime_transition_paused",
    "token_meta_error",
    "vault_tx_loading",
  ])

export type StakingConnectGateResolveInput = Readonly<{
  isTronPassiveRuntime?: boolean
  executionConnected?: boolean
  walletConnected?: boolean
  executionAddress?: string | null
  isWrongNetwork?: boolean
  isAttemptingNetworkSwitch?: boolean
  awaitingSigner?: boolean
  canTransact?: boolean
  vaultDataReady?: boolean
  runtimeHydrationEnabled?: boolean
  transitionLifecycle?: string | null
  refreshPaused?: boolean
  tokenMetaError?: string | null
  loading?: boolean
  hasProvider?: boolean
  balancesFetched?: boolean
}>

export function resolveStakingConnectBlockingGateDetailed(
  input: StakingConnectGateResolveInput
): StakingConnectBlockingGate & { reason: StakingConnectBlockingReason } {
  if (input.isTronPassiveRuntime) {
    return { blocked: false, category: null, reason: "ready" }
  }

  const connected = Boolean(
    input.executionConnected || input.walletConnected
  )
  const hasAddress = Boolean(input.executionAddress?.trim())

  if (!connected || !hasAddress) {
    return { blocked: true, category: "wallet", reason: "not_connected" }
  }

  if (input.isAttemptingNetworkSwitch) {
    return {
      blocked: true,
      category: "network",
      reason: "network_switch_in_progress",
    }
  }

  if (input.isWrongNetwork) {
    return { blocked: true, category: "network", reason: "wrong_network" }
  }

  if (input.runtimeHydrationEnabled === false) {
    return {
      blocked: true,
      category: "runtime",
      reason: "runtime_hydration_disabled",
    }
  }

  const lifecycle = input.transitionLifecycle ?? "stable"
  if (
    input.refreshPaused ||
    lifecycle === "pausing" ||
    lifecycle === "switching"
  ) {
    return {
      blocked: true,
      category: "runtime",
      reason: "runtime_transition_paused",
    }
  }

  if (input.tokenMetaError) {
    return { blocked: true, category: "data", reason: "token_meta_error" }
  }

  if (input.awaitingSigner) {
    return { blocked: true, category: "wallet", reason: "awaiting_signer" }
  }

  if (input.loading && !input.awaitingSigner) {
    return { blocked: true, category: "tx", reason: "vault_tx_loading" }
  }

  if (!input.vaultDataReady) {
    return { blocked: true, category: "data", reason: "vault_data_loading" }
  }

  if (!input.canTransact) {
    return { blocked: true, category: "wallet", reason: "cannot_transact" }
  }

  return { blocked: false, category: null, reason: "ready" }
}

/** Wallet connected with address and enough hydration signal to expect readiness soon. */
export function isStakingPartialWalletConnect(
  input: StakingConnectGateResolveInput
): boolean {
  if (input.isTronPassiveRuntime) return false
  const hasAddress = Boolean(input.executionAddress?.trim())
  const walletOk = Boolean(input.executionConnected || input.walletConnected)
  const hydrationSignal = Boolean(
    input.balancesFetched || input.hasProvider
  )
  return walletOk && hasAddress && hydrationSignal
}

export function isStakingConnectStallCandidate(
  gate: StakingConnectBlockingGate & { reason: StakingConnectBlockingReason }
): boolean {
  if (!gate.blocked) return false
  return STAKING_CONNECT_STALL_GATE_REASONS.has(gate.reason)
}

export function buildStakingConnectStallDedupeKey(input: Readonly<{
  blockingGate: StakingConnectBlockingReason
  deploymentId: string
  runtimeKey: string
}>): string {
  return `${input.blockingGate}:${input.deploymentId}:${input.runtimeKey}`
}

export function inferStakingWalletVendor(): string {
  if (typeof window === "undefined") return "unknown"
  const eth = (window as Window & { ethereum?: { isTrust?: boolean; isMetaMask?: boolean } })
    .ethereum
  if (eth?.isTrust) return "trust"
  if (eth?.isMetaMask) return "metamask"
  return "unknown"
}

export function readStakingConnectStallEnvironment(): Readonly<{
  visibilityState: string
  userAgent: string
  isMobileUa: boolean
}> {
  if (typeof document === "undefined" || typeof navigator === "undefined") {
    return { visibilityState: "unknown", userAgent: "", isMobileUa: false }
  }
  const ua = navigator.userAgent
  return {
    visibilityState: document.visibilityState,
    userAgent: ua.slice(0, 160),
    isMobileUa: /android|iphone|ipad|mobile/i.test(ua),
  }
}
