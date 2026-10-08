/**
 * DEV-only canonical boundary enforcement.
 * Production: no-op.
 */

const warnedCanonicalViolations = new Set<string>()

export type StakingCanonicalBoundaryViolation =
  | "lib_staking_inside_staking_tree"
  | "deprecated_core_shim_inside_staking_tree"
  | "retired_composer_network_shim"

const VIOLATION_MESSAGES: Record<StakingCanonicalBoundaryViolation, string> = {
  lib_staking_inside_staking_tree:
    "src/staking/* must not import @/lib/staking/* — use @/staking/<plane> canonical paths",
  deprecated_core_shim_inside_staking_tree:
    "src/staking/* must not import deprecated @/staking/core/* shims — use @/staking/orchestration (or execution/diagnostics)",
  retired_composer_network_shim:
    "useStakingVaultEvmNetworkGlue removed in G4d — import useStakingVaultNetworkGlue from @/staking/runtime/network only",
}

/** Call from module init when a canonical package detects a forbidden import surface. */
export function devWarnStakingCanonicalBoundaryViolation(
  violation: StakingCanonicalBoundaryViolation,
  detail: string
): void {
  if (!(process.env.NODE_ENV !== 'production')) return
  const key = `${violation}|${detail}`
  if (warnedCanonicalViolations.has(key)) return
  warnedCanonicalViolations.add(key)
  console.warn(`[staking-canonical] ${VIOLATION_MESSAGES[violation]}`, { detail })
}

/** Patterns forbidden under src/staking/** (excluding lib/). */
export const STAKING_DEPRECATED_CORE_SHIM_PREFIXES = [
  "@/staking/core/runtimeTransitionCoordinator",
  "@/staking/core/runtimeTransitionSequence",
  "@/staking/core/runtimeSwapPolicy",
  "@/staking/core/runtimeSwapEngine",
  "@/staking/core/createTronReceiptResolver",
  "@/staking/core/runtimeCoreLayerBoundaryDev",
] as const
