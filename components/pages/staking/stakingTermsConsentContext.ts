import { createContext } from "react"

export type StakingTermsConsentContextValue = {
  ready: boolean
  accepted: boolean
  dialogOpen: boolean
  termsUrl: string
  acceptTerms: () => void
  onDialogOpenChange: (open: boolean) => void
  ensureAcceptedOrPrompt: () => boolean
}

export const StakingTermsConsentContext =
  createContext<StakingTermsConsentContextValue | null>(null)
