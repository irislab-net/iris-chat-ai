/**
 * ARCH-FREEZE — DEV-only diagnostics (no production behavior).
 * Loaded via dynamic `import()` from `useStakingVaultDiagnosticsMount` so raw source scans
 * stay out of the default production graph.
 */
import { getStakingDeploymentRegistry } from "@/staking/core/getStakingDeploymentRegistry"
import { deriveProviderRuntimeKey } from "@/staking/core/providerRuntime"
import type { StakingDeploymentConfig } from "@/staking/core/types"
import {
  isCfg6StakingRuntimeDisabledSentinel,
  resolveStakingDeploymentForActiveSelection,
} from "@/staking/runtime/capabilities/stakingRuntimeDisabledSentinel"
import { isRuntimeFamilyEnabled } from "@/staking/runtime/capabilities/stakingRuntimeFamilyRollout"
import { isStakingVaultRuntimeHydrationEnabled } from "@/staking/runtime/capabilities/stakingRuntimeHydration"
import { getStakingProviderRegistryDevSnapshot } from "@/staking/core/providerRegistry"
import { getStakingRefreshOrchestratorDevSnapshot } from "@/staking/refresh"
import {
  STAKING_ARCHITECTURE_FREEZE_TOKEN,
  STAKING_HOOK_ORDER_FREEZE_MARK,
} from "@/staking/diagnostics/stakingArchitectureFreezeMark"
import {
  isDevConsoleLoggingEnabled,
  stakingDevConsoleInfo,
  stakingDevConsoleWarn,
} from "@/staking/diagnostics/stakingDevConsole"
import { STAKING_G4D_RETIRED_VAULT_COMPOSER_MODULES } from "@/staking/diagnostics/stakingG4dFrozenTopologyDev"

export type StakingArchFreezeCheck = Readonly<{
  id: string
  ok: boolean
  detail?: string
}>

export type StakingArchFreezeResult = Readonly<{
  ok: boolean
  checks: readonly StakingArchFreezeCheck[]
}>

let lastFreezeRunAt = 0
const FREEZE_DEBOUNCE_MS = 6_000
let freezeMarkerLogged = false

const SOURCE_SCAN_SKIP_PATH_PARTS = [
  "/staking/diagnostics/stakingArchFreezeDev.ts",
  "/staking/diagnostics/stakingArchitectureSmokeDev.ts",
  "/staking/diagnostics/stakingG4dFrozenTopologyDev.ts",
  "/staking/diagnostics/stakingCanonicalBoundaryDev.ts",
] as const

/** Substrings that must not appear in production staking sources (allow-listed paths skipped). */
const RETIRED_SUBSTRINGS = [
  "useStakingVaultEvmNetworkGlue",
  'from "@/lib/staking/',
  "from '@/lib/staking/",
] as const

/** AppKit owns provider/session lifecycle; staking UI/tx may only use approved orchestration/recovery bridges. */
const APPKIT_BOUNDARY_FORBIDDEN_SUBSTRINGS = [
  "hardResetWalletConnectSession",
  "clearWalletConnectBrowserStorage",
  "appKit.disconnect",
  "createAppKit(",
] as const

function shouldSkipSourcePath(path: string): boolean {
  const p = path.replace(/\\/g, "/")
  return SOURCE_SCAN_SKIP_PATH_PARTS.some(s => p.includes(s))
}

function checkRegistryRuntimeKeysUnique(
  deployments: readonly StakingDeploymentConfig[]
): StakingArchFreezeCheck {
  const keys = deployments.map(d => deriveProviderRuntimeKey(d))
  const uniq = new Set(keys)
  const ok = uniq.size === keys.length
  return {
    id: "registry-runtime-keys-unique",
    ok,
    detail: ok ? `${keys.length} rows` : `duplicate keys (${keys.length} rows, ${uniq.size} unique)`,
  }
}

function checkDeploymentsMatchRollout(
  deployments: readonly StakingDeploymentConfig[]
): StakingArchFreezeCheck {
  let ok = true
  const bad: string[] = []
  for (const d of deployments) {
    if (isCfg6StakingRuntimeDisabledSentinel(d)) continue
    if (!isRuntimeFamilyEnabled(d.chainFamily)) {
      ok = false
      bad.push(`${d.id}:${d.chainFamily}`)
    }
  }
  return {
    id: "registry-rows-match-family-rollout",
    ok,
    detail: ok ? "all rows enabled by rollout" : `disabled family still present: ${bad.join(", ")}`,
  }
}

function checkSentinelHydrationClosed(): StakingArchFreezeCheck {
  const s = resolveStakingDeploymentForActiveSelection(getStakingDeploymentRegistry())
  const isSentinel = isCfg6StakingRuntimeDisabledSentinel(s)
  const hydrated = isStakingVaultRuntimeHydrationEnabled(s)
  const ok = !isSentinel || hydrated === false
  return {
    id: "cfg6-sentinel-hydration-closed",
    ok,
    detail: `${isSentinel ? "sentinel" : "normal"} hydration=${hydrated}`,
  }
}

function checkProviderRegistryPressure(): StakingArchFreezeCheck {
  const snap = getStakingProviderRegistryDevSnapshot()
  const n =
    snap.evmJsonRpcProviders +
    snap.tronHttpProviders +
    snap.receiptResolvers +
    snap.wsProviders
  const reg = getStakingDeploymentRegistry()
  const maxReasonable = Math.max(24, reg.deployments.length * 6)
  const ok = n <= maxReasonable
  return {
    id: "provider-registry-pressure",
    ok,
    detail: `maps total=${n} (cap~${maxReasonable}) evm=${snap.evmJsonRpcProviders} tron=${snap.tronHttpProviders}`,
  }
}

function checkRefreshOrchestratorSingletonHint(): StakingArchFreezeCheck {
  const o = getStakingRefreshOrchestratorDevSnapshot()
  return {
    id: "refresh-orchestrator-dev-snapshot",
    ok: true,
    detail: o.hasSession ? `session=${o.tortureSessionId ?? "?"}` : "no session (pre-mount ok)",
  }
}

async function scanStakingSourcesRetiredPatterns(): Promise<StakingArchFreezeCheck> {
  // Vite `import.meta.glob` raw scans are unavailable under Next.js.
  void shouldSkipSourcePath
  void RETIRED_SUBSTRINGS
  return {
    id: "retired-pattern-source-scan",
    ok: true,
    detail: "skipped (Next.js port — no Vite raw glob)",
  }
}

async function scanAppKitBoundaryOwnershipLeaks(): Promise<StakingArchFreezeCheck> {
  void APPKIT_BOUNDARY_FORBIDDEN_SUBSTRINGS
  return {
    id: "appkit-boundary-ownership-source-scan",
    ok: true,
    detail: "skipped (Next.js port — no Vite raw glob)",
  }
}

function logFreezeMarkersOnce(): void {
  if (!isDevConsoleLoggingEnabled() || freezeMarkerLogged) return
  freezeMarkerLogged = true
  stakingDevConsoleInfo("[staking-arch-freeze]", STAKING_ARCHITECTURE_FREEZE_TOKEN, {
    hookOrder: STAKING_HOOK_ORDER_FREEZE_MARK,
    retiredComposer: STAKING_G4D_RETIRED_VAULT_COMPOSER_MODULES,
  })
}

/**
 * Run freeze diagnostics (debounced). Prefer `installStakingArchFreezeDevGlobal` for console access.
 */
export async function runStakingArchitectureFreezeChecksDev(
  reason = "manual"
): Promise<StakingArchFreezeResult> {
  if (!(process.env.NODE_ENV !== 'production') || !isDevConsoleLoggingEnabled()) {
    return { ok: true, checks: [] }
  }
  const now = Date.now()
  if (now - lastFreezeRunAt < FREEZE_DEBOUNCE_MS) {
    return { ok: true, checks: [{ id: "debounced", ok: true }] }
  }
  lastFreezeRunAt = now
  logFreezeMarkersOnce()

  const reg = getStakingDeploymentRegistry()
  const checks: StakingArchFreezeCheck[] = [
    checkRegistryRuntimeKeysUnique(reg.deployments),
    checkDeploymentsMatchRollout(reg.deployments),
    checkSentinelHydrationClosed(),
    checkProviderRegistryPressure(),
    checkRefreshOrchestratorSingletonHint(),
    await scanStakingSourcesRetiredPatterns(),
    await scanAppKitBoundaryOwnershipLeaks(),
  ]
  const ok = checks.every(c => c.ok)
  if (!ok) {
    stakingDevConsoleWarn("[staking-arch-freeze] failed", { reason, checks })
  } else {
    stakingDevConsoleInfo("[staking-arch-freeze] ok", {
      reason,
      checks: checks.map(c => c.id),
    })
  }
  return { ok, checks }
}

declare global {
  interface Window {
    __STAKING_ARCH_FREEZE__?: typeof runStakingArchitectureFreezeChecksDev
  }
}

export function installStakingArchFreezeDevGlobal(): void {
  if (!(process.env.NODE_ENV !== 'production') || typeof window === "undefined") return
  window.__STAKING_ARCH_FREEZE__ = runStakingArchitectureFreezeChecksDev
}
