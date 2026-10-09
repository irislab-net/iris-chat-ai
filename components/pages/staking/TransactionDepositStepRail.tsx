import type { TransactionStepVisualState } from "@/components/pages/staking/transactionDepositStepModel"
import { STAKING_STABLECOIN_LABEL } from "@/constants/stakingVaultConfig"
import {
  STAKING_TX_UX_STEP_APPROVAL_FAILED,
  STAKING_TX_UX_STEP_APPROVE,
  STAKING_TX_UX_STEP_APPROVED,
  STAKING_TX_UX_STEP_APPROVING,
  STAKING_TX_UX_STEP_REVIEW,
  STAKING_TX_UX_STEP_STAKE,
  STAKING_TX_UX_STEP_STAKE_FAILED,
  STAKING_TX_UX_STEP_STAKED,
  STAKING_TX_UX_STEP_STAKING,
} from "@/constants/stakingTransactionUxCopy"
import { cn } from "@/lib/utils"
import { AlertCircle, Check, Circle, Loader2 } from "lucide-react"

const RAIL_MIN_HEIGHT = "min-h-[4.75rem]"
const RAIL_MIN_HEIGHT_WITH_REVIEW = "min-h-[7rem]"

function approveLabel(
  state: TransactionStepVisualState,
  tokenSymbol: string,
): string {
  switch (state) {
    case "failed":
      return STAKING_TX_UX_STEP_APPROVAL_FAILED
    case "done":
      return STAKING_TX_UX_STEP_APPROVED
    case "active":
      return STAKING_TX_UX_STEP_APPROVING
    default:
      return STAKING_TX_UX_STEP_APPROVE.replace("{token}", tokenSymbol)
  }
}

function stakeLabel(state: TransactionStepVisualState): string {
  switch (state) {
    case "failed":
      return STAKING_TX_UX_STEP_STAKE_FAILED
    case "done":
      return STAKING_TX_UX_STEP_STAKED
    case "active":
      return STAKING_TX_UX_STEP_STAKING
    default:
      return STAKING_TX_UX_STEP_STAKE
  }
}

function StepRailIcon({
  state,
  previewMode = false,
}: {
  state: TransactionStepVisualState
  previewMode?: boolean
}) {
  const ic = "size-3.5 shrink-0"
  if (state === "done") {
    return (
      <Check
        className={cn(ic, "text-emerald-600")}
        aria-hidden
        strokeWidth={2.5}
      />
    )
  }
  if (state === "failed") {
    return (
      <AlertCircle
        className={cn(ic, "text-red-600")}
        aria-hidden
        strokeWidth={2.25}
      />
    )
  }
  if (state === "active") {
    if (previewMode) {
      return (
        <span
          className="size-2.5 shrink-0 rounded-full bg-foreground"
          aria-hidden
        />
      )
    }
    return (
      <Loader2
        className={cn(
          ic,
          "text-foreground motion-safe:animate-spin motion-reduce:animate-none",
        )}
        aria-hidden
        strokeWidth={2.25}
      />
    )
  }
  return (
    <Circle
      className={cn(ic, "text-muted-foreground/35")}
      aria-hidden
      strokeWidth={1.75}
    />
  )
}

function StepRailRow({
  label,
  state,
  stepNumber,
  showConnector,
  previewMode = false,
}: {
  label: string
  state: TransactionStepVisualState
  stepNumber?: number
  showConnector?: boolean
  previewMode?: boolean
}) {
  const isMuted = state === "locked" || state === "idle"
  const isActive = state === "active"

  return (
    <li className="relative flex gap-2.5">
      <div className="flex w-3.5 shrink-0 flex-col items-center">
        <StepRailIcon state={state} previewMode={previewMode} />
        {showConnector ? (
          <span
            className="mt-1 w-px flex-1 min-h-3 bg-neutral-200/90"
            aria-hidden
          />
        ) : null}
      </div>
      <div className={cn("min-w-0 flex-1 pb-2.5", !showConnector && "pb-0")}>
        <div className="flex min-w-0 items-baseline gap-1.5">
          {stepNumber != null ? (
            <span
              className={cn(
                "shrink-0 text-[10px] font-medium tabular-nums",
                isMuted ? "text-muted-foreground/45" : "text-muted-foreground/70",
              )}
              aria-hidden
            >
              {stepNumber}
            </span>
          ) : null}
          <span
            className={cn(
              "min-w-0 truncate text-[13px] leading-tight tracking-tight",
              isActive && "font-semibold text-foreground",
              state === "done" && "font-medium text-foreground",
              state === "failed" && "font-medium text-red-700",
              isMuted && "font-normal text-muted-foreground/55",
              !isActive && !isMuted && state !== "failed" && state !== "done" &&
                "font-medium text-foreground",
            )}
          >
            {label}
          </span>
        </div>
      </div>
    </li>
  )
}

export function TransactionDepositPreviewStepRail({
  showApprove,
  approveState,
  stakeState,
  tokenSymbol = STAKING_STABLECOIN_LABEL,
}: {
  showApprove: boolean
  approveState: TransactionStepVisualState
  stakeState: TransactionStepVisualState
  tokenSymbol?: string
}) {
  return (
    <ol
      className={cn(
        "list-none space-y-0 p-0",
        showApprove ? RAIL_MIN_HEIGHT : "min-h-10",
      )}
      aria-label="Transaction steps"
    >
      {showApprove ? (
        <StepRailRow
          label={approveLabel(approveState, tokenSymbol)}
          state={approveState}
          stepNumber={1}
          showConnector
          previewMode
        />
      ) : null}
      <StepRailRow
        label={stakeLabel(stakeState)}
        state={stakeState}
        stepNumber={showApprove ? 2 : 1}
        previewMode
      />
    </ol>
  )
}

export function TransactionDepositProgressStepRail({
  showApprove,
  reviewState,
  approveState,
  stakeState,
  tokenSymbol = STAKING_STABLECOIN_LABEL,
}: {
  showApprove: boolean
  reviewState: TransactionStepVisualState
  approveState: TransactionStepVisualState
  stakeState: TransactionStepVisualState
  tokenSymbol?: string
}) {
  const rows: Array<{
    key: string
    label: string
    state: TransactionStepVisualState
  }> = [
    {
      key: "review",
      label: STAKING_TX_UX_STEP_REVIEW,
      state: reviewState,
    },
  ]
  if (showApprove) {
    rows.push({
      key: "approve",
      label: approveLabel(approveState, tokenSymbol),
      state: approveState,
    })
  }
  rows.push({
    key: "stake",
    label: stakeLabel(stakeState),
    state: stakeState,
  })

  return (
    <ol
      className={cn("list-none space-y-0 p-0", RAIL_MIN_HEIGHT_WITH_REVIEW)}
      aria-label="Transaction progress"
    >
      {rows.map((row, index) => (
        <StepRailRow
          key={row.key}
          label={row.label}
          state={row.state}
          showConnector={index < rows.length - 1}
        />
      ))}
    </ol>
  )
}
