import { useStakingAmbientTxPresentationState } from "@/hooks/useStakingAmbientTxPresentation"
import { StakingAmbientTxPresentationContext } from "@/components/pages/staking/stakingAmbientTxPresentationContext"
import type { ReactNode } from "react"

/** Single presentation source for all ambient surfaces (avoids duplicate linger timers). */
export function StakingAmbientTxPresentationProvider({
  children,
}: {
  children: ReactNode
}) {
  const presentation = useStakingAmbientTxPresentationState()
  return (
    <StakingAmbientTxPresentationContext.Provider value={presentation}>
      {children}
    </StakingAmbientTxPresentationContext.Provider>
  )
}
