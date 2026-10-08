import type { StakingAmbientPresentation } from "@/hooks/useStakingAmbientTxPresentation"
import { createContext, useContext } from "react"

export const StakingAmbientTxPresentationContext =
  createContext<StakingAmbientPresentation | null>(null)

export function useStakingAmbientTxPresentation(): StakingAmbientPresentation {
  const ctx = useContext(StakingAmbientTxPresentationContext)
  if (!ctx) {
    throw new Error(
      "useStakingAmbientTxPresentation must be used within StakingAmbientTxPresentationProvider"
    )
  }
  return ctx
}
