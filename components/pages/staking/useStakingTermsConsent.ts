import { useContext } from "react"
import {
  StakingTermsConsentContext,
  type StakingTermsConsentContextValue,
} from "@/components/pages/staking/stakingTermsConsentContext"

export function useStakingTermsConsent(): StakingTermsConsentContextValue {
  const ctx = useContext(StakingTermsConsentContext)
  if (!ctx) {
    throw new Error(
      "useStakingTermsConsent must be used within StakingTermsConsentProvider"
    )
  }
  return ctx
}
