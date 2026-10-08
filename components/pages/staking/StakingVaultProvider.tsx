import { useOptionalBootstrapReadiness } from "@/contexts/BootstrapReadinessContext"
import { StakingAppErrorSurface } from "@/components/pages/staking/StakingAppErrorSurface"
import { TransactionStatusProvider } from "@/components/pages/staking/TransactionStatusProvider"
import { AppKitEvmIsolationOnPassiveTron } from "@/hooks/useAppKitEvmIsolationOnPassiveTron"
import { AppKitTronIdentityDiagnosticsGate } from "@/components/pages/staking/AppKitTronIdentityDiagnosticsMount"
import { useStakingVaultState } from "@/hooks/useStakingVault"
import { RuntimeSelectionProvider } from "@/staking/core/runtimeSelectionContext"
import { useEffect, type ReactNode } from "react"
import { StakingVaultContext } from "./stakingVaultContext"

/**
 * Phase 23: **`RuntimeSelectionProvider`** wraps vault state so hooks use **`useActiveRuntimeSelection`**
 * (derived legacy-primary today — no UI switching).
 */
export function StakingVaultProvider({ children }: { children: ReactNode }) {
  return (
    <RuntimeSelectionProvider>
      <StakingVaultProviderInner>{children}</StakingVaultProviderInner>
    </RuntimeSelectionProvider>
  )
}

function StakingVaultProviderInner({ children }: { children: ReactNode }) {
  const value = useStakingVaultState()
  const bootstrap = useOptionalBootstrapReadiness()

  useEffect(() => {
    bootstrap?.reportStakingVaultHydrated(value.vaultDataReady)
  }, [bootstrap, value.vaultDataReady])

  return (
    <StakingVaultContext.Provider value={value}>
      <AppKitEvmIsolationOnPassiveTron />
      <TransactionStatusProvider>
        <AppKitTronIdentityDiagnosticsGate />
        <StakingAppErrorSurface />
        {children}
      </TransactionStatusProvider>
    </StakingVaultContext.Provider>
  )
}
