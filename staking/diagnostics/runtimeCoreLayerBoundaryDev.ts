/**
 * DEV-only static import boundary check for `staking/core` and `staking/dev`.
 * Vite `import.meta.glob` is unavailable under Next.js — no-op stub.
 */

function runRuntimeCoreLayerBoundaryCheckDev(): void {
  if (process.env.NODE_ENV === "production") return
  // Boundary scan requires Vite raw globs; skipped in the Next.js port.
}

runRuntimeCoreLayerBoundaryCheckDev()
