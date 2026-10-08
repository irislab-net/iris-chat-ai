"use client"
import { BootstrapReadinessContext } from "@/contexts/BootstrapReadinessContext"
import { useAppKitReady } from "@/hooks/useAppKitReady"
import { installWalletResumeHardening } from "@/lib/mobile/walletResumeHardening"
import { stakingLifecycleTrace } from "@/staking/diagnostics"
import { stakingMobileResumeStore } from "@/staking/orchestration"
import { isStakingAppPathname } from "@/lib/staking/stakingRoute"
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { usePathname } from "next/navigation"

/**
 * Centralizes readiness bits that gate the initial branded splash so it tracks
 * real initialization instead of a blind wall-clock timer alone.
 */
export function BootstrapOrchestrationProvider({
  children,
}: {
  children: ReactNode
}) {
  const appKitReady = useAppKitReady()
  const pathname = usePathname() ?? "/"
  const onStakingAppRoute = isStakingAppPathname(pathname)

  const [stakingVaultHydratedForSplash, setStakingVaultHydratedForSplash] =
    useState(!onStakingAppRoute)

  useEffect(() => {
    stakingMobileResumeStore.install()
    installWalletResumeHardening()
  }, [])

  useEffect(() => {
    if (!onStakingAppRoute) {
      setStakingVaultHydratedForSplash(true)
      stakingLifecycleTrace("bootstrap", "route_not_staking_app", { pathname })
      return
    }
    setStakingVaultHydratedForSplash(false)
    stakingLifecycleTrace("bootstrap", "staking_route_enter", { pathname })
  }, [onStakingAppRoute, pathname, appKitReady])

  const reportStakingVaultHydrated = useCallback((ready: boolean) => {
    if (!onStakingAppRoute) return
    setStakingVaultHydratedForSplash(ready)
    stakingLifecycleTrace("bootstrap", "vault_hydration_report", { ready })
  }, [onStakingAppRoute])

  const value = useMemo(
    () => ({
      appKitReady,
      stakingVaultHydratedForSplash,
      reportStakingVaultHydrated,
    }),
    [appKitReady, stakingVaultHydratedForSplash, reportStakingVaultHydrated]
  )

  return (
    <BootstrapReadinessContext.Provider value={value}>
      {children}
    </BootstrapReadinessContext.Provider>
  )
}

