/**
 * DEV-only architecture smoke validation (Phase S1).
 */
import { STAKING_BOUNDARY_RULES, devGetRegisteredStakingPackageOwners } from "@/staking/diagnostics/stakingBoundaryRules"
import { STAKING_DEPRECATED_CORE_SHIM_PREFIXES } from "@/staking/diagnostics/stakingCanonicalBoundaryDev"
import {
  isDevConsoleLoggingEnabled,
  stakingDevConsoleInfo,
  stakingDevConsoleWarn,
} from "@/staking/diagnostics/stakingDevConsole"
import { STAKING_G4D_RETIRED_VAULT_COMPOSER_MODULES } from "@/staking/diagnostics/stakingG4dFrozenTopologyDev"
import {
  STAKING_RUNTIME_PLANES_DEPRECATED_ALIAS_KEYS,
} from "@/staking/diagnostics/stakingInvariantAssertionsDev"
import { getStakingRefreshOrchestratorDevSnapshot } from "@/staking/refresh"
import { getProfitManagerStatusSnapshot } from "@/staking/profit"
import { STAKING_VAULT_DEPRECATED_BRIDGE_KEYS } from "@/staking/vault/composer/stakingVaultPublicTopology"

export type StakingArchitectureSmokeResult = Readonly<{
  ok: boolean
  checks: readonly Readonly<{ id: string; ok: boolean; detail?: string }>[]
}>

let lastSmokeAt = 0
const SMOKE_DEBOUNCE_MS = 5_000

const STALE_BRIDGE_EXPORT_PREFIXES = [
  "@/lib/staking/",
  "@/lib/tron/",
  "@/hooks/useUnifiedWalletOrchestration",
  "@/services/gasEstimator",
  "@/lib/stakingEtherscanHistory",
  "@/lib/wallet/openUnifiedWallet",
  ...STAKING_DEPRECATED_CORE_SHIM_PREFIXES,
] as const

export function runStakingArchitectureSmokeDev(
  reason = "vault-mount"
): StakingArchitectureSmokeResult {
  if (!(process.env.NODE_ENV !== 'production') || !isDevConsoleLoggingEnabled()) {
    return { ok: true, checks: [] }
  }
  const now = Date.now()
  if (now - lastSmokeAt < SMOKE_DEBOUNCE_MS) {
    return { ok: true, checks: [{ id: "debounced", ok: true }] }
  }
  lastSmokeAt = now

  const checks: { id: string; ok: boolean; detail?: string }[] = []

  const orch = getStakingRefreshOrchestratorDevSnapshot()
  checks.push({
    id: "single-orchestrator-session",
    ok: !orch.hasSession || orch.tortureEpoch >= 0,
    detail: orch.hasSession
      ? `active session ${orch.tortureSessionId ?? "?"} epoch ${orch.tortureEpoch}`
      : "no session (pre-orchestrator mount ok)",
  })

  const profit = getProfitManagerStatusSnapshot()
  checks.push({
    id: "profit-singleton-readable",
    ok: typeof profit.data.apy_percentage === "number",
    detail: `loading=${profit.loading}`,
  })

  const owners = devGetRegisteredStakingPackageOwners()
  checks.push({
    id: "package-owners-registered",
    ok: owners.length >= 5,
    detail: owners.join(", "),
  })

  checks.push({
    id: "boundary-rules-defined",
    ok: STAKING_BOUNDARY_RULES.length >= 8,
    detail: `${STAKING_BOUNDARY_RULES.length} rules`,
  })

  checks.push({
    id: "stale-bridge-prefix-catalog",
    ok: STALE_BRIDGE_EXPORT_PREFIXES.length > 0,
    detail: "grep CI should assert zero non-shim imports of these prefixes",
  })

  checks.push({
    id: "g4c-deprecated-vault-bridge-catalog",
    ok: STAKING_VAULT_DEPRECATED_BRIDGE_KEYS.length === 4,
    detail: STAKING_VAULT_DEPRECATED_BRIDGE_KEYS.join(", "),
  })

  checks.push({
    id: "g4c-deprecated-runtime-planes-catalog",
    ok: STAKING_RUNTIME_PLANES_DEPRECATED_ALIAS_KEYS.length === 3,
    detail: STAKING_RUNTIME_PLANES_DEPRECATED_ALIAS_KEYS.join(", "),
  })

  checks.push({
    id: "g4d-retired-composer-network-shim-catalog",
    ok: STAKING_G4D_RETIRED_VAULT_COMPOSER_MODULES.length >= 1,
    detail: `retired: ${STAKING_G4D_RETIRED_VAULT_COMPOSER_MODULES.join(", ")}; canonical: @/staking/runtime/network`,
  })

  const ok = checks.every(c => c.ok)
  if (!ok) {
    stakingDevConsoleWarn("[staking-architecture-smoke] failed", { reason, checks })
  } else {
    stakingDevConsoleInfo("[staking-architecture-smoke] ok", {
      reason,
      checks: checks.map(c => c.id),
    })
  }
  return { ok, checks }
}

declare global {
  interface Window {
    __STAKING_ARCHITECTURE_SMOKE__?: typeof runStakingArchitectureSmokeDev
  }
}

export function installStakingArchitectureSmokeDevGlobal(): void {
  if (!(process.env.NODE_ENV !== 'production') || typeof window === "undefined") return
  window.__STAKING_ARCHITECTURE_SMOKE__ = runStakingArchitectureSmokeDev
}
