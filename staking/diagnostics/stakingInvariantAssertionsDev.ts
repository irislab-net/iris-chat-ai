/**
 * DEV-only staking invariants (Phase S1). No production overhead.
 */
import { isDevConsoleLoggingEnabled } from "@/staking/diagnostics/stakingDevConsole"
import type { RuntimeOperationContext } from "@/staking/core/runtimeOperationContext"
import type { ChainFamily } from "@/staking/core/types"
import { getStakingRefreshOrchestratorDevSnapshot } from "@/staking/refresh"
import {
  STAKING_VAULT_DEPRECATED_BRIDGE_KEYS,
  STAKING_VAULT_PUBLIC_TOPOLOGY_KEYS,
  type StakingVaultPublicTopologyKey,
} from "@/staking/vault/composer/stakingVaultPublicTopology"

/** Removed from `StakingVaultRuntimePlanes` in G4c. */
export const STAKING_RUNTIME_PLANES_DEPRECATED_ALIAS_KEYS = [
  "isConnected",
  "address",
  "chainId",
] as const

const warnedInvariantKeys = new Set<string>()

function devInvariantOnce(key: string, message: string, detail?: unknown): void {
  if (!(process.env.NODE_ENV !== 'production') || !isDevConsoleLoggingEnabled()) return
  if (warnedInvariantKeys.has(key)) return
  warnedInvariantKeys.add(key)
  console.warn(`[staking-invariant] ${message}`, detail ?? {})
}

/** Refresh plane hook bundle phases — must match `stakingVaultComposerContracts.ts`. */
export type StakingRefreshPlanePhase =
  | "asset_lifecycle"
  | "balance_callbacks"
  | "tron_ref_wiring"
  | "reset_continuity"
  | "network_glue"
  | "load_meta_mount"
  | "tx_notify"
  | "orchestrator"
  | "tron_polling"

let lastRefreshPlanePhase: StakingRefreshPlanePhase | null = null

const REFRESH_PLANE_ORDER: readonly StakingRefreshPlanePhase[] = [
  "asset_lifecycle",
  "balance_callbacks",
  "tron_ref_wiring",
  "reset_continuity",
  "network_glue",
  "load_meta_mount",
  "tx_notify",
  "orchestrator",
  "tron_polling",
]

export function devAssertRefreshPlaneRegistrationOrder(
  phase: StakingRefreshPlanePhase
): void {
  if (!(process.env.NODE_ENV !== 'production')) return
  const expectedIndex = REFRESH_PLANE_ORDER.indexOf(phase)
  if (expectedIndex < 0) return
  if (lastRefreshPlanePhase === null) {
    lastRefreshPlanePhase = phase
    return
  }
  const lastIndex = REFRESH_PLANE_ORDER.indexOf(lastRefreshPlanePhase)
  if (expectedIndex < lastIndex) {
    devInvariantOnce(
      `refresh-order-${phase}`,
      "refresh plane hook registered out of contract order",
      { expectedAfter: lastRefreshPlanePhase, got: phase }
    )
  }
  lastRefreshPlanePhase = phase
}

export function devResetRefreshPlaneRegistrationOrderForTests(): void {
  lastRefreshPlanePhase = null
}

export function devAssertSingleRefreshOrchestratorOwner(context: string): void {
  if (!(process.env.NODE_ENV !== 'production')) return
  const snap = getStakingRefreshOrchestratorDevSnapshot()
  if (!snap.hasSession) {
    devInvariantOnce(
      `orch-missing-${context}`,
      "refresh orchestrator expected active session but none registered",
      { context }
    )
  }
}

export function devAssertHistoryRuntimeFamilyMatch(input: Readonly<{
  historyDeploymentId: string
  activeDeploymentId: string
  activeChainFamily: ChainFamily
  context: string
}>): void {
  if (!(process.env.NODE_ENV !== 'production')) return
  const hist = input.historyDeploymentId.trim()
  const active = input.activeDeploymentId.trim()
  if (hist && active && hist !== active) {
    devInvariantOnce(
      `history-deploy-mismatch-${input.context}`,
      "history load key does not match active runtime deployment",
      input
    )
  }
  if (input.activeChainFamily !== "evm" && input.activeChainFamily !== "tron") {
    devInvariantOnce(
      `history-family-${input.context}`,
      "unexpected chain family for history plane",
      input
    )
  }
}

/** Passive Tron must not expose EVM execution signing surface on the vault return. */
export function devAssertTronPassiveNonTransactingInvariant(input: Readonly<{
  isTronPassiveRuntime: boolean
  executionConnected: boolean
  canTransact: boolean
  context: string
}>): void {
  if (!(process.env.NODE_ENV !== 'production') || !input.isTronPassiveRuntime) return
  if (input.executionConnected && input.canTransact) {
    devInvariantOnce(
      `tron-evm-transact-${input.context}`,
      "passive Tron runtime should not present EVM executionConnected+canTransact",
      input
    )
  }
}

const INTERNAL_PUBLIC_KEY_DENYLIST = [
  "composerRefs",
  "networkRefs",
  "refreshPlane",
  "historyPlane",
  "tokenReads",
  "txExecution",
  "planes",
  "__orchestrator",
  "__session",
] as const

export function devAssertNoDeprecatedVaultBridgeFields(
  value: Record<string, unknown>
): void {
  if (!(process.env.NODE_ENV !== 'production')) return
  for (const key of STAKING_VAULT_DEPRECATED_BRIDGE_KEYS) {
    if (key in value) {
      devInvariantOnce(
        `deprecated-vault-bridge-${key}`,
        "public vault assembly must not expose deprecated G4c bridge fields",
        { key }
      )
    }
  }
}

export function devAssertNoDeprecatedRuntimePlaneAliases(
  planes: Record<string, unknown>
): void {
  if (!(process.env.NODE_ENV !== 'production')) return
  for (const key of STAKING_RUNTIME_PLANES_DEPRECATED_ALIAS_KEYS) {
    if (key in planes) {
      devInvariantOnce(
        `deprecated-runtime-planes-${key}`,
        "runtime planes must not expose deprecated alias fields",
        { key }
      )
    }
  }
}

export function devAssertPublicAssemblyNoInternalLeakage(
  value: Record<string, unknown>
): void {
  if (!(process.env.NODE_ENV !== 'production')) return
  devAssertNoDeprecatedVaultBridgeFields(value)
  for (const key of Object.keys(value)) {
    if (INTERNAL_PUBLIC_KEY_DENYLIST.some(d => key === d || key.startsWith("__"))) {
      devInvariantOnce(
        `public-leak-${key}`,
        "public vault assembly must not expose internal plane keys",
        { key }
      )
    }
  }
  const topology = new Set<string>(STAKING_VAULT_PUBLIC_TOPOLOGY_KEYS)
  for (const key of Object.keys(value)) {
    if (!topology.has(key as StakingVaultPublicTopologyKey) && key.startsWith("_")) {
      devInvariantOnce(
        `public-underscore-${key}`,
        "public vault assembly contains underscored non-topology key",
        { key }
      )
    }
  }
}

export function devAssertRuntimeContextStable(input: Readonly<{
  stakingRuntime: RuntimeOperationContext
  label: string
}>): void {
  if (!(process.env.NODE_ENV !== 'production')) return
  const id = input.stakingRuntime.deployment.id.trim()
  if (!id) {
    devInvariantOnce(
      `runtime-empty-deploy-${input.label}`,
      "runtime operation context has empty deployment id",
      input
    )
  }
}
