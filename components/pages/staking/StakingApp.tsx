"use client"

import { RuntimePickerDevPanel } from "@/components/dev/RuntimePickerDevPanel"
import {
  isRuntimePickerDevPanelVisible,
  isStakingReferralEnabled,
} from "@/staking/config"
import useStakingReferral from "@/hooks/useStakingReferral"
import { cn } from "@/lib/utils"
import { useCallback, useState } from "react"
import StakingAppBalance from "./StakingAppBalance"
import StakingAppForm from "./StakingAppForm"
import StakingAppReferral from "./StakingAppReferral"
import {
  STAKING_COLUMN_LIQUID_PANEL,
  STAKING_FORM_LIQUID_PANEL,
} from "./stakingGlassPanel"
import { StakingTermsConsentProvider } from "./StakingTermsConsentProvider"
import { useStakingTermsConsent } from "./useStakingTermsConsent"
import { StakingTermsConsentSurface } from "./StakingTermsConsentSurface"
import { StakingVaultProvider } from "./StakingVaultProvider"
import StakingAppTransactionHistory from "./StakingAppTransactionHistory"

function StakingAppLayout() {
  const referralsEnabled = isStakingReferralEnabled()
  const stakingReferral = useStakingReferral()
  const { ensureAcceptedOrPrompt } = useStakingTermsConsent()
  const [depositAmountFocusRequest, setDepositAmountFocusRequest] = useState(0)

  const requestDepositAmountFocus = useCallback(() => {
    if (!ensureAcceptedOrPrompt()) return
    setDepositAmountFocusRequest((n) => n + 1)
  }, [ensureAcceptedOrPrompt])

  return (
    <div className="relative mx-auto w-full max-w-6xl px-4 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] pt-4 sm:px-6 sm:pt-6 lg:pb-8">
      <div className="flex min-w-0 flex-col justify-center">
        <div className="grid min-w-0 grid-cols-1 items-stretch gap-4 md:gap-5 lg:grid-cols-3 lg:grid-rows-[auto_minmax(0,1fr)] lg:gap-5">
          {referralsEnabled ? (
            <div
              className={cn(
                STAKING_COLUMN_LIQUID_PANEL,
                "order-1 min-w-0 opacity-100! lg:col-span-2 lg:row-start-1"
              )}
            >
              <div className="flex h-full min-h-0 min-w-0 flex-col gap-4 p-3.5 sm:gap-5 sm:p-5">
                <div className="min-w-0 shrink-0 flex-1">
                  <StakingAppBalance
                    onDepositNowClick={requestDepositAmountFocus}
                    fillHeight={!referralsEnabled}
                  />
                </div>
                <div className="min-w-0 shrink-0">
                  <StakingAppReferral stakingReferral={stakingReferral} />
                </div>
              </div>
            </div>
          ) : (
            <StakingAppBalance
              onDepositNowClick={requestDepositAmountFocus}
              className="order-1 min-w-0 lg:col-span-2 lg:row-start-1"
              standalone
            />
          )}
          <div
            className={cn(
              STAKING_FORM_LIQUID_PANEL,
              "order-2 min-w-0 opacity-100! lg:col-span-1 lg:row-span-2 lg:row-start-1 lg:self-stretch"
            )}
          >
            <StakingAppForm
              depositAmountFocusRequest={depositAmountFocusRequest}
            />
          </div>
          <div
            className={cn(
              STAKING_COLUMN_LIQUID_PANEL,
              "order-3 mb-6 flex min-h-0 min-w-0 flex-col overflow-hidden md:mb-8 lg:col-span-2 lg:row-start-2 lg:mb-0"
            )}
          >
            <StakingAppTransactionHistory />
          </div>
        </div>
      </div>
    </div>
  )
}

function StakingApp() {
  const showRuntimePickerDev = isRuntimePickerDevPanelVisible()
  return (
    <StakingVaultProvider>
      <StakingTermsConsentProvider>
        <StakingTermsConsentSurface />
        <StakingAppLayout />
      </StakingTermsConsentProvider>
      {showRuntimePickerDev ? <RuntimePickerDevPanel /> : null}
    </StakingVaultProvider>
  )
}

export default StakingApp
