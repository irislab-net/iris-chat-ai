import { createContext, useContext } from "react"

/**
 * Unified bootstrap readiness for the shell splash (AppKit, staking vault, cosmetic min).
 * StakingVaultProvider reports vault hydration so `/staking/app` does not dismiss splash early.
 */
export type BootstrapReadinessContextValue = {
  appKitReady: boolean
  /** True when current route is not `/staking/app` OR vault reported ready */
  stakingVaultHydratedForSplash: boolean
  /** Called from `StakingVaultProvider` when `vaultDataReady` changes */
  reportStakingVaultHydrated: (ready: boolean) => void
}

export const BootstrapReadinessContext =
  createContext<BootstrapReadinessContextValue | null>(null)

export function useBootstrapReadiness(): BootstrapReadinessContextValue {
  const ctx = useContext(BootstrapReadinessContext)
  if (!ctx) {
    throw new Error("useBootstrapReadiness must be used within BootstrapOrchestrationProvider")
  }
  return ctx
}

export function useOptionalBootstrapReadiness(): BootstrapReadinessContextValue | null {
  return useContext(BootstrapReadinessContext)
}
