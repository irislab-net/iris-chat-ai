import { useTransactionStatus } from "@/components/pages/staking/TransactionStatusContext"
import { useStakingTermsConsent } from "@/components/pages/staking/useStakingTermsConsent"
import { cn } from "@/lib/utils"
import { CircleArrowDown, CircleArrowUp } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import StakingAppDepositForm from "./StakingAppDepositForm"
import {
  STAKING_SEGMENT_LIQUID_ACTIVE,
  STAKING_SEGMENT_LIQUID_BASE,
  STAKING_SEGMENT_LIQUID_IDLE,
  STAKING_SEGMENT_LIQUID_TRACK,
} from "./stakingGlassPanel"
import StakingAppWithdrawForm from "./StakingAppWithdrawForm"

type Mode = "deposit" | "withdraw"

function StakingAppForm({
  depositAmountFocusRequest = 0,
}: {
  depositAmountFocusRequest?: number
}) {
  const [mode, setMode] = useState<Mode>("deposit")
  const [depositTabFocusRequest, setDepositTabFocusRequest] = useState(0)
  const { ensureAcceptedOrPrompt } = useStakingTermsConsent()
  const { snapshot, closeUser } = useTransactionStatus()
  const effectiveDepositAmountFocusRequest =
    depositAmountFocusRequest + depositTabFocusRequest

  /**
   * Deposit / withdraw forms unmount when switching tabs, but tx modal state lives in
   * `TransactionStatusProvider`. A mid-preview deposit sheet left open while on Unstake
   * loses its flow runner on remount → gas line stuck "pending". Dismiss preview-only
   * modals for the tab we are leaving behind.
   */
  const abandonPreviewForOtherScenario = useCallback(
    (targetMode: Mode) => {
      const s = snapshot
      if (!s.dialogOpen || s.uiPhase !== "preview" || s.scenario == null) return
      if (targetMode === "deposit" && s.scenario === "withdraw") closeUser()
      if (targetMode === "withdraw" && s.scenario === "deposit") closeUser()
    },
    [snapshot, closeUser]
  )

  useEffect(() => {
    if (depositAmountFocusRequest > 0) setMode("deposit")
  }, [depositAmountFocusRequest])

  return (
    <div
      className={cn(
        "flex min-h-0 w-full min-w-0 flex-col p-4 sm:p-6"
      )}
    >
      <div
        className={cn(
          "flex shrink-0 gap-0.5 p-2",
          STAKING_SEGMENT_LIQUID_TRACK
        )}
        role='tablist'
        aria-label='Staking action'
      >
        <button
          type='button'
          role='tab'
          aria-selected={mode === "deposit"}
          className={cn(
            STAKING_SEGMENT_LIQUID_BASE,
            "inline-flex min-h-10 items-center justify-center gap-1.5 py-2.5 sm:min-h-11 sm:py-3",
            mode === "deposit"
              ? STAKING_SEGMENT_LIQUID_ACTIVE
              : cn(
                  STAKING_SEGMENT_LIQUID_IDLE,
                  "font-mono text-muted-foreground hover:text-foreground"
                )
          )}
          onClick={() => {
            if (!ensureAcceptedOrPrompt()) return
            abandonPreviewForOtherScenario("deposit")
            setMode("deposit")
            setDepositTabFocusRequest(n => n + 1)
          }}
        >
          <CircleArrowDown className='size-4 shrink-0' aria-hidden />
          Stake
        </button>
        <button
          type='button'
          role='tab'
          aria-selected={mode === "withdraw"}
          className={cn(
            STAKING_SEGMENT_LIQUID_BASE,
            "inline-flex min-h-10 items-center justify-center gap-1.5 py-2.5 sm:min-h-11 sm:py-3",
            mode === "withdraw"
              ? STAKING_SEGMENT_LIQUID_ACTIVE
              : cn(
                  STAKING_SEGMENT_LIQUID_IDLE,
                  "font-mono text-muted-foreground hover:text-foreground"
                )
          )}
          onClick={() => {
            if (!ensureAcceptedOrPrompt()) return
            abandonPreviewForOtherScenario("withdraw")
            setMode("withdraw")
          }}
        >
          <CircleArrowUp className='size-4 shrink-0' aria-hidden />
          Unstake
        </button>
      </div>

      <div className='mt-4 flex w-full min-w-0 shrink-0 flex-col'>
        {mode === "deposit" ? (
          <StakingAppDepositForm focusAmountRequest={effectiveDepositAmountFocusRequest} />
        ) : (
          <StakingAppWithdrawForm />
        )}
      </div>
    </div>
  )
}

export default StakingAppForm
