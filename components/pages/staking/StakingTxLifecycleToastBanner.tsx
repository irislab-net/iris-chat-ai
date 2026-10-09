import { cn } from "@/lib/utils"
import { getStakingTxLifecycleToastActions } from "@/staking/notifications/stakingTxLifecycleToastActions"
import type { StakingTxLifecycleToastPresentation } from "@/staking/notifications/stakingTxLifecycleToastPresentation"
import { traceTxVisualOwnership } from "@/staking/diagnostics/txVisualOwnershipTrace"
import { dismissStakingTxLifecycleToast } from "@/staking/notifications/stakingDetachedTxProgressToast"
import { createIdleTransactionStatusSnapshot } from "@/staking/tx/transactionStatusSnapshotHelpers"
import { CheckCircle2, Loader2, X, XCircle } from "lucide-react"
import type { KeyboardEvent, MouseEvent } from "react"

type StakingTxLifecycleToastBannerProps = {
  presentation: StakingTxLifecycleToastPresentation
}

function StatusIcon({
  phase,
  className,
}: {
  phase: StakingTxLifecycleToastPresentation["phase"]
  className?: string
}) {
  if (phase === "success") {
    return (
      <CheckCircle2
        className={cn("size-4 shrink-0 text-emerald-700", className)}
        aria-hidden
      />
    )
  }
  if (phase === "failed") {
    return (
      <XCircle
        className={cn("size-4 shrink-0 text-red-600", className)}
        aria-hidden
      />
    )
  }
  return (
    <Loader2
      className={cn(
        "size-4 shrink-0 text-neutral-700 motion-reduce:animate-none animate-spin",
        className
      )}
      aria-hidden
    />
  )
}

function reopenModalFromToast(
  scenario: StakingTxLifecycleToastPresentation["scenario"],
  txHash: string,
  action: "view" | "card"
) {
  traceTxVisualOwnership(
    "tx_progress_toast_clicked",
    createIdleTransactionStatusSnapshot(),
    { scenario, txHash, action }
  )
  traceTxVisualOwnership(
    "tx_progress_toast_reopen_modal",
    createIdleTransactionStatusSnapshot(),
    { scenario, txHash }
  )
  getStakingTxLifecycleToastActions()?.reopenModal()
}

export function StakingTxLifecycleToastBanner({
  presentation,
}: StakingTxLifecycleToastBannerProps) {
  const { scenario, txHash, phase, title, amountLabel, showView } = presentation

  const inFlightProgress =
    phase === "wallet_wait" || phase === "submitted" || phase === "confirming"

  const handleReopen = () => {
    if (!showView) return
    reopenModalFromToast(scenario, txHash, "card")
  }

  const handleViewClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    reopenModalFromToast(scenario, txHash, "view")
  }

  const handleCardKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!showView) return
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      handleReopen()
    }
  }

  return (
    <div
      className={cn(
        "staking-tx-lifecycle-banner pointer-events-auto w-full min-w-0",
        showView && "cursor-pointer"
      )}
      role={showView ? "button" : "status"}
      tabIndex={showView ? 0 : undefined}
      aria-live="polite"
      onClick={showView ? handleReopen : undefined}
      onKeyDown={showView ? handleCardKeyDown : undefined}
    >
      <div className="flex items-start gap-2">
        <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="flex min-w-0 items-center gap-1.5 text-[0.8125rem] font-semibold leading-tight tracking-[-0.012em] text-neutral-900">
              <span className="flex items-center justify-center rounded-full bg-[#2563EB]/88 p-1">
                <StatusIcon phase={phase} className="size-4 shrink-0 text-white" />
              </span>
              <span className="min-w-0 truncate">{title}</span>
            </p>
            {amountLabel ? (
              <p className="truncate text-[0.71875rem] leading-tight tabular-nums text-neutral-500 ps-1 mt-2">
                {amountLabel}
              </p>
            ) : null}
          </div>

          {showView ? (
            <button
              type="button"
              onClick={handleViewClick}
              className="h-7 shrink-0 rounded-full bg-black px-3.5 text-xs font-medium text-white hover:bg-black/90"
            >
              View
            </button>
          ) : null}
        </div>

        {!inFlightProgress ? (
          <button
            type="button"
            onClick={event => {
              event.stopPropagation()
              traceTxVisualOwnership(
                "tx_progress_toast_clicked",
                createIdleTransactionStatusSnapshot(),
                { scenario, txHash, action: "dismiss" }
              )
              dismissStakingTxLifecycleToast(scenario, txHash, presentation.submissionId)
            }}
            className="inline-flex size-5.5 shrink-0 items-center justify-center rounded-full border border-neutral-300/55 bg-white/72 text-neutral-600 hover:bg-white/88"
            aria-label="Dismiss notification"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        ) : null}
      </div>
    </div>
  )
}
