import { useEffect } from "react"
import { isMobileStakingLanLogEnabled } from "@/config/mobileStakingLogEnv"
import { installMobileStakingWcSessionTrace } from "@/staking/diagnostics/installMobileStakingWcSessionTrace"
import {
  installMobileStakingLanLogGlobals,
  markMobileStakingWalletReturn,
  noteMobileStakingPageHidden,
  noteMobileStakingPageVisible,
  traceMobileStakingFlow,
  updateMobileStakingLanContext,
} from "@/staking/diagnostics/mobileStakingLanLog"
import type { TransactionStatusSnapshot } from "@/staking/tx/types/transactionStatusSnapshot"

export type MobileStakingLanLogBootstrapInput = Readonly<{
  walletAddress: string | null | undefined
  chainId: number | null | undefined
  appKitAccountStatus: string | null | undefined
  connectorName?: string | null
  snapshot: TransactionStatusSnapshot
}>

/** Syncs wallet/tx context into the LAN logger and installs WC observers (DEV + flag only). */
export function useMobileStakingLanLogBootstrap(
  input: MobileStakingLanLogBootstrapInput
): void {
  useEffect(() => {
    if (!isMobileStakingLanLogEnabled()) return
    installMobileStakingLanLogGlobals()
    return installMobileStakingWcSessionTrace()
  }, [])

  useEffect(() => {
    if (!isMobileStakingLanLogEnabled()) return
    updateMobileStakingLanContext({
      walletAddress: input.walletAddress?.trim() || null,
      chainId: input.chainId ?? null,
      appKitAccountStatus: input.appKitAccountStatus ?? null,
      connectorName: input.connectorName?.trim() || null,
      snapshot: input.snapshot,
      submissionId: input.snapshot.submissionId,
      flowRunId: input.snapshot.runId,
      approvalTxHash: input.snapshot.approveTxHash?.trim() || null,
      stakeTxHash:
        input.snapshot.depositTxHash?.trim() ||
        input.snapshot.withdrawTxHash?.trim() ||
        null,
    })
  }, [
    input.walletAddress,
    input.chainId,
    input.appKitAccountStatus,
    input.connectorName,
    input.snapshot,
  ])

  useEffect(() => {
    if (!isMobileStakingLanLogEnabled()) return
    const onVis = () => {
      if (document.visibilityState === "hidden") {
        noteMobileStakingPageHidden()
        traceMobileStakingFlow("page_visibility_hidden", {
          uiPhase: input.snapshot.uiPhase,
        })
      } else {
        noteMobileStakingPageVisible()
        traceMobileStakingFlow("page_visibility_visible", {
          uiPhase: input.snapshot.uiPhase,
        })
        markMobileStakingWalletReturn("visibility_visible")
      }
    }
    const onFocus = () => {
      traceMobileStakingFlow("app_focus_restored", {
        uiPhase: input.snapshot.uiPhase,
      })
      markMobileStakingWalletReturn("window_focus")
    }
    document.addEventListener("visibilitychange", onVis)
    window.addEventListener("focus", onFocus)
    return () => {
      document.removeEventListener("visibilitychange", onVis)
      window.removeEventListener("focus", onFocus)
    }
  }, [input.snapshot.uiPhase])
}
