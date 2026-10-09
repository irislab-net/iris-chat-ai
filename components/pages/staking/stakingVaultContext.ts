import { useStakingVaultState } from "@/hooks/useStakingVault"
import { createContext, useContext } from "react"

export type StakingVaultValue = ReturnType<typeof useStakingVaultState>

export const StakingVaultContext = createContext<StakingVaultValue | null>(null)

export function useStakingVault(): StakingVaultValue {
  const ctx = useContext(StakingVaultContext)
  if (!ctx) {
    throw new Error("useStakingVault must be used within StakingVaultProvider")
  }
  return ctx
}

/** Outside `StakingVaultProvider` returns `null` (e.g. optional consumers). */
export function useOptionalStakingVault(): StakingVaultValue | null {
  return useContext(StakingVaultContext)
}
