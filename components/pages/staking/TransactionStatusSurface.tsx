import GlowingButton from "@/components/common/glowingButton"
import { STAKING_BALANCE_LIQUID_CARD } from "@/components/pages/staking/stakingGlassPanel"
import { StakingTokenIcon } from "@/components/pages/staking/StakingTokenIcon"
import { useStakingVault } from "@/components/pages/staking/stakingVaultContext"
import {
  TransactionDepositPreviewStepRail,
  TransactionDepositProgressStepRail,
} from "@/components/pages/staking/TransactionDepositStepRail"
import {
  depositAwaitingWalletSignature,
  deriveDepositPreviewStepRail,
  deriveDepositProgressStepRail,
  depositShowsApproveStep,
  type DepositStepRailModel,
} from "@/components/pages/staking/transactionDepositStepModel"
import { useTransactionStatus } from "@/components/pages/staking/TransactionStatusContext"
import type {
  TransactionStatusSnapshot,
  TransactionStatusUiPhase,
  TransactionWireStepPhase,
} from "@/components/pages/staking/transactionStatusModel"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/staking-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/staking-switch"
import {
  STAKING_MODAL_PADDING_CONTENT_DENSE,
  STAKING_MODAL_TITLE_ICON_CLASS,
  STAKING_MODAL_TYPE_TX_TITLE,
} from "@/constants/stakingModalSpec"
import {
  STAKING_TX_UX_ACTION_APPROVE_AND_STAKE,
  STAKING_TX_UX_ACTION_RETRY_APPROVAL,
  STAKING_TX_UX_ACTION_RETRY_STAKE,
  STAKING_TX_UX_ACTION_STAKE,
  STAKING_TX_UX_ACTION_WITHDRAW,
  STAKING_TX_UX_APPROVAL_LIMITED,
  STAKING_TX_UX_APPROVAL_LIMITED_HINT,
  STAKING_TX_UX_APPROVAL_UNLIMITED,
  STAKING_TX_UX_APPROVAL_UNLIMITED_HINT,
  STAKING_TX_UX_FEE_APPROVE_AND_STAKE,
  STAKING_TX_UX_FOOTER_SUBMITTED_BODY,
  STAKING_TX_UX_FOOTNOTE_CANCELLED_RETRY,
  STAKING_TX_UX_FOOTNOTE_GENERIC_ERROR,
  STAKING_TX_UX_FOOTNOTE_SUCCESS_CONFIRMED,
  STAKING_TX_UX_FOOTNOTE_WALLET_REJECT_FALLBACK,
  STAKING_TX_UX_HEADER_APPROVAL_FAILED,
  STAKING_TX_UX_HEADER_APPROVE_IN_WALLET,
  STAKING_TX_UX_HEADER_AWAITING_SIGNATURE,
  STAKING_TX_UX_HEADER_CONFIRMING_TRANSACTION,
  STAKING_TX_UX_HEADER_STAKE_FAILED,
  STAKING_TX_UX_STAKE_CANCELLED_IN_WALLET,
  STAKING_TX_UX_STAKE_INSUFFICIENT_GAS,
  STAKING_TX_UX_HEADER_STAKE_IN_WALLET,
  STAKING_TX_UX_HEADER_STAKE_PREVIEW,
  STAKING_TX_UX_HEADER_TRANSACTION,
  STAKING_TX_UX_HEADER_TRANSACTION_CANCELLED,
  STAKING_TX_UX_HEADER_TRANSACTION_CONFIRMED,
  STAKING_TX_UX_HEADER_TRANSACTION_FAILED,
  STAKING_TX_UX_HEADER_TRANSACTION_SUBMITTED,
  STAKING_TX_UX_HEADER_WITHDRAW_PREVIEW,
  STAKING_TX_UX_PREPARING_FEE_HINT,
  STAKING_TX_UX_PREPARING_TRANSACTION,
  STAKING_TX_UX_RETRY_TRANSACTION,
  STAKING_TX_UX_STEP_APPROVING,
  STAKING_TX_UX_STEP_STAKING,
  STAKING_TX_UX_WALLET_MANUAL_OPEN_HINT,
} from "@/constants/stakingTransactionUxCopy"
import { STAKING_STABLECOIN_LABEL } from "@/constants/stakingVaultConfig"
import { deriveDepositApprovalExecution } from "@/lib/stakingDepositApprovalExecution"
import {
  STAKING_ETH_FEE_VALUE_SKELETON,
  STAKING_TOKEN_FEE_VALUE_SKELETON,
} from "@/lib/stakingFeeValueSkeleton"
import { networkFeeRowRightDisplayValue } from "@/lib/stakingNetworkFeeDisplay"
import { cn } from "@/lib/utils"
import { useActiveRuntimeSelection } from "@/staking/core/runtimeSelectionContext"
import {
  stakingLifecycleTrace, stakingTxLifecycleDev,
  traceTxMobilePipeline
} from "@/staking/diagnostics"
import { stakingMobileResumeStore } from "@/staking/orchestration"
import { traceTxModalCloseClicked } from "@/staking/diagnostics/txVisualOwnershipTrace"
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownCircleIcon,
  ArrowUpCircle,
  CheckCircle2,
  CircleSlash,
  ExternalLink,
  Loader2,
  Wallet,
  XIcon,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, type ReactNode } from "react"

/**
 * Shared pill height — skeleton slots, overlays, and buttons must match (no layout shift).
 * Taller on mobile for thumb reach; slightly compact from `sm`.
 */
const TX_SHEET_CTA_PILL_HEIGHT = "h-12 min-h-12 sm:h-11 sm:min-h-11"

/** Outer GlowingButton shell — same box as skeleton cell. */
const txSheetCtaOuterClass = cn(
  "w-full shrink-0 rounded-full sm:w-auto",
  TX_SHEET_CTA_PILL_HEIGHT,
)

/** Same tap target as terms / staking CTAs. */
const txGlowTallShell = cn(
  "w-full justify-center rounded-full px-5 py-0 font-mono text-[15px]",
  TX_SHEET_CTA_PILL_HEIGHT,
  "sm:text-sm sm:w-auto disabled:opacity-70",
)

const txGlowPrimaryClass = cn(
  txGlowTallShell,
  "border-0 bg-[#2563EB]/88 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.42),0_4px_16px_-4px_rgba(37,99,235,0.28)] hover:bg-[#2563EB]/96",
  "motion-safe:transition-transform motion-safe:duration-100 motion-safe:ease-out motion-safe:active:scale-[0.985]"
)

const txGlowOutlineClass = cn(
  txGlowTallShell,
  "border border-white/55 bg-white/70 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-md hover:bg-white/90 dark:border-white/16 dark:bg-white/10 dark:hover:bg-white/14",
  "motion-safe:transition-transform motion-safe:duration-100 motion-safe:ease-out motion-safe:active:scale-[0.985]"
)

/** Canonical transaction sheet layout tokens (preview is the reference rhythm). */
const TX_SHEET_GLASS_CARD = cn(
  STAKING_BALANCE_LIQUID_CARD,
  "rounded-2xl p-3 sm:p-3.5",
)

const TX_SHEET_HELPER_SLOT =
  "min-h-8 shrink-0 px-1 pt-2 text-left text-[11px] leading-snug text-muted-foreground/80"

/** Metadata card — compact withdraw step rail */
const TX_META_CARD = "min-w-0 rounded-2xl bg-gray-50 py-2.5 px-3 sm:px-3.5"

const TX_SHEET_CTA_ROW =
  "flex w-full flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-2"

/** Two stacked pills on mobile (2×h-12 + gap-2); single row from `sm`. */
const TX_SHEET_CTA_SLOT = cn(
  "mt-2 w-full shrink-0 min-h-[6.5rem] sm:min-h-11",
)

const TX_SHEET_CTA_SKELETON_BASE = cn(
  TX_SHEET_CTA_PILL_HEIGHT,
  "w-full shrink-0 rounded-full sm:flex-1",
  "animate-none motion-reduce:animate-none pointer-events-none select-none",
  "transition-opacity duration-200 ease-out",
)

/** Outline pill mirrors Close (white + hairline); must read on glass/white sheet. */
const TX_SHEET_CTA_SKELETON_OUTLINE = cn(
  TX_SHEET_CTA_SKELETON_BASE,
  "border border-neutral-200/80 bg-neutral-50/95 shadow-none",
)

/** Primary pill mirrors Retry/Done (filled dark). */
const TX_SHEET_CTA_SKELETON_PRIMARY = cn(
  TX_SHEET_CTA_SKELETON_BASE,
  "border-0 bg-neutral-900/16 shadow-none",
)

function TxSheetCtaSkeletonButton({
  variant,
  className,
}: {
  variant: "outline" | "primary"
  className?: string
}) {
  return (
    <Skeleton
      aria-hidden
      className={cn(
        variant === "outline" ? TX_SHEET_CTA_SKELETON_OUTLINE : TX_SHEET_CTA_SKELETON_PRIMARY,
        className,
      )}
    />
  )
}

/** Every footer slot keeps skeleton geometry; actions overlay when interactive. */
function TxSheetCtaSlotCell({
  variant,
  children,
}: {
  variant: "outline" | "primary"
  children?: ReactNode
}) {
  const skeletonOnly = children == null

  return (
    <div
      className={cn(
        "relative w-full sm:flex-1",
        TX_SHEET_CTA_PILL_HEIGHT,
        skeletonOnly && "pointer-events-none",
      )}
      aria-hidden={skeletonOnly ? true : undefined}
    >
      <TxSheetCtaSkeletonButton
        variant={variant}
        className={cn("absolute inset-0 z-0", !skeletonOnly && "opacity-0")}
      />
      {children ? (
        <div
          className={cn(
            "relative z-1 flex w-full items-stretch",
            TX_SHEET_CTA_PILL_HEIGHT,
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  )
}

function TxSheetCtaRow({
  secondary,
  primary,
}: {
  secondary?: ReactNode
  primary?: ReactNode
}) {
  return (
    <div className={TX_SHEET_CTA_ROW}>
      <TxSheetCtaSlotCell variant="outline">{secondary}</TxSheetCtaSlotCell>
      <TxSheetCtaSlotCell variant="primary">{primary}</TxSheetCtaSlotCell>
    </div>
  )
}

function canonicalStakingFeeLine(snapshot: TransactionStatusSnapshot): string {
  const c = snapshot.feeCanonical.displayLine.trim()
  return c !== "" ? snapshot.feeCanonical.displayLine : snapshot.feeLine
}

function isWireInFlight(phase: TransactionWireStepPhase): boolean {
  return (
    phase === "awaiting_signature" ||
    phase === "submitted" ||
    phase === "confirming"
  )
}

function withdrawStepLabel(wirePhase: TransactionWireStepPhase): string {
  if (wirePhase === "done") return "Withdrawn"
  if (wirePhase === "failed") return "Withdraw failed"
  if (isWireInFlight(wirePhase)) return "Withdrawing"
  return "Withdraw"
}

function depositHeaderTitle(
  phase: TransactionStatusUiPhase | null,
  rail: DepositStepRailModel | null,
  failedLike: boolean,
  errorMessage: string,
): string {
  if (phase === "preview") return STAKING_TX_UX_HEADER_STAKE_PREVIEW

  if (failedLike && rail) {
    if (rail.failedStep === "approve") return STAKING_TX_UX_HEADER_APPROVAL_FAILED
    if (rail.failedStep === "stake") {
      if (errorMessage.trim() === STAKING_TX_UX_STAKE_INSUFFICIENT_GAS) {
        return STAKING_TX_UX_STAKE_INSUFFICIENT_GAS
      }
      return STAKING_TX_UX_HEADER_STAKE_FAILED
    }
    return STAKING_TX_UX_HEADER_TRANSACTION_FAILED
  }

  if (phase === "cancelled") {
    if (errorMessage.trim() === STAKING_TX_UX_STAKE_CANCELLED_IN_WALLET) {
      return STAKING_TX_UX_STAKE_CANCELLED_IN_WALLET
    }
    return STAKING_TX_UX_HEADER_TRANSACTION_CANCELLED
  }

  if (phase === "awaiting_signature" || phase === "pending") {
    if (rail?.activeStep === "approve") return STAKING_TX_UX_HEADER_APPROVE_IN_WALLET
    if (rail?.activeStep === "stake") return STAKING_TX_UX_HEADER_STAKE_IN_WALLET
    return STAKING_TX_UX_HEADER_AWAITING_SIGNATURE
  }

  if (phase === "submitted" || phase === "confirming") {
    if (rail?.activeStep === "approve") return STAKING_TX_UX_STEP_APPROVING
    if (rail?.activeStep === "stake") return STAKING_TX_UX_STEP_STAKING
    return phase === "submitted"
      ? STAKING_TX_UX_HEADER_TRANSACTION_SUBMITTED
      : STAKING_TX_UX_HEADER_CONFIRMING_TRANSACTION
  }

  if (phase === "confirmed" || phase === "success") {
    return STAKING_TX_UX_HEADER_TRANSACTION_CONFIRMED
  }
  return STAKING_TX_UX_HEADER_TRANSACTION
}

function headerTitle(
  phase: TransactionStatusUiPhase | null,
  scenario: TransactionStatusSnapshot["scenario"],
  depositRail: DepositStepRailModel | null,
  failedLike: boolean,
  errorMessage: string,
): string {
  if (scenario === "deposit") {
    return depositHeaderTitle(phase, depositRail, failedLike, errorMessage)
  }
  if (phase === "preview") {
    return STAKING_TX_UX_HEADER_WITHDRAW_PREVIEW
  }
  if (phase === "awaiting_signature" || phase === "pending") {
    return STAKING_TX_UX_HEADER_AWAITING_SIGNATURE
  }
  if (phase === "submitted") return STAKING_TX_UX_HEADER_TRANSACTION_SUBMITTED
  if (phase === "confirming") return STAKING_TX_UX_HEADER_CONFIRMING_TRANSACTION
  if (phase === "confirmed" || phase === "success") {
    return STAKING_TX_UX_HEADER_TRANSACTION_CONFIRMED
  }
  if (phase === "cancelled") return STAKING_TX_UX_HEADER_TRANSACTION_CANCELLED
  if (phase === "failed" || phase === "error") {
    return STAKING_TX_UX_HEADER_TRANSACTION_FAILED
  }
  return STAKING_TX_UX_HEADER_TRANSACTION
}

function depositRetryLabel(rail: DepositStepRailModel | null): string {
  if (rail?.failedStep === "approve") return STAKING_TX_UX_ACTION_RETRY_APPROVAL
  if (rail?.failedStep === "stake") return STAKING_TX_UX_ACTION_RETRY_STAKE
  return STAKING_TX_UX_RETRY_TRANSACTION
}

function previewConfirmLabel(
  scenario: TransactionStatusSnapshot["scenario"],
  needsApproval: boolean,
  showApproveStep: boolean,
): string {
  if (scenario === "withdraw") return STAKING_TX_UX_ACTION_WITHDRAW
  return needsApproval && showApproveStep
    ? STAKING_TX_UX_ACTION_APPROVE_AND_STAKE
    : STAKING_TX_UX_ACTION_STAKE
}

/** Compact amount + fee block — stable height across in-flight phases. */
function TxAmountFeeBlock({
  amountLabel,
  feeLine,
  feeRowLabel = "Network fee: ",
  tokenSymbol,
  chainFamily,
  feeSkeleton = false,
  feeSkeletonClassName = STAKING_ETH_FEE_VALUE_SKELETON,
}: {
  amountLabel: string
  feeLine: string
  feeRowLabel?: string
  tokenSymbol: string
  chainFamily: "evm" | "tron"
  feeSkeleton?: boolean
  feeSkeletonClassName?: string
}) {
  const feeDisplay = networkFeeRowRightDisplayValue(feeLine)
  return (
    <div className="space-y-2">
      <div className="flex min-h-8 items-center justify-between">
        <span className="shrink-0 text-[11px] font-medium text-muted-foreground">Amount:</span>
        <div className="flex items-center gap-2">
          <StakingTokenIcon
            symbol={tokenSymbol}
            sizeClassName="size-6 shrink-0"
            chainFamily={chainFamily}
          />
          <p className="text-xl font-semibold tabular-nums tracking-tight text-foreground leading-none">
            {amountLabel}
          </p>
        </div>
      </div>
      <div className="flex h-[.5px] bg-gray-200 rounded-full mb-3"></div>
      <div className="flex min-h-5 items-baseline justify-between gap-3">
        <span className="shrink-0 text-[11px] font-medium text-muted-foreground">
          {feeRowLabel}
        </span>
        {feeSkeleton ? (
          <Skeleton
            className={feeSkeletonClassName}
            aria-busy
            aria-label={STAKING_TX_UX_PREPARING_FEE_HINT}
          />
        ) : (
          <span className="min-w-0 text-right text-[11px] font-medium tabular-nums leading-tight text-muted-foreground wrap-break-word">
            {feeDisplay}
          </span>
        )}
      </div>
    </div>
  )
}

/** Phase icon in modal header — one size + muted ink (shape only, no phase color). */
function PhaseHeaderIcon({
  phase,
  scenario,
}: {
  phase: TransactionStatusUiPhase | null
  scenario: TransactionStatusSnapshot["scenario"]
}) {
  const ic = STAKING_MODAL_TITLE_ICON_CLASS
  const stroke = { strokeWidth: 2 as const, "aria-hidden": true as const }

  if (phase === "preview" && scenario === "deposit") {
    return <ArrowDownCircleIcon className={ic} {...stroke} />
  }
  if (phase === "preview" && scenario === "withdraw") {
    return <ArrowUpCircle className={ic} {...stroke} />
  }
  if (phase === "awaiting_signature" || phase === "pending") {
    return <Wallet className={ic} {...stroke} />
  }
  if (phase === "submitted" || phase === "confirming") {
    return (
      <Loader2
        className={cn(
          ic,
          "motion-safe:animate-spin motion-reduce:animate-none animation-duration-[0.85s]",
        )}
        {...stroke}
      />
    )
  }
  if (phase === "confirmed" || phase === "success") {
    return <CheckCircle2 className={ic} {...stroke} />
  }
  if (phase === "cancelled") {
    return <CircleSlash className={ic} {...stroke} />
  }
  if (phase === "failed" || phase === "error") {
    return <AlertCircle className={ic} {...stroke} />
  }
  return null
}

function isCancelledMessage(message: string): boolean {
  const m = message.trimStart()
  return (
    m.startsWith("Transaction cancelled") ||
    m.startsWith("Cancelled") ||
    m.startsWith("Canceled")
  )
}

/** One short line under the timeline for terminal states (stable footer slot). */
function terminalProgressFootnote(
  snapshot: TransactionStatusSnapshot,
  kind: "dismissed" | "wallet_cancel" | "error" | "success",
): string {
  if (kind === "success") {
    return STAKING_TX_UX_FOOTNOTE_SUCCESS_CONFIRMED
  }
  if (kind === "dismissed") {
    return STAKING_TX_UX_FOOTNOTE_CANCELLED_RETRY
  }
  if (kind === "wallet_cancel") {
    const nl = snapshot.errorMessage.indexOf("\n")
    const hint =
      nl === -1 ? "" : snapshot.errorMessage.slice(nl + 1).trim()
    return hint || STAKING_TX_UX_FOOTNOTE_WALLET_REJECT_FALLBACK
  }
  const msg = snapshot.errorMessage.trim()
  if (!msg) return STAKING_TX_UX_FOOTNOTE_GENERIC_ERROR
  const nl = msg.indexOf("\n")
  return (nl === -1 ? msg : msg.slice(0, nl).trimEnd()) || msg
}

function resolveTxSheetHelperText(input: {
  previewLike: boolean
  submittedAwaitingReceipt: boolean
  awaitingWalletSignature: boolean
  terminalFootKind: "dismissed" | "wallet_cancel" | "error" | "success" | null
  snapshot: TransactionStatusSnapshot
  depositFailedStep: "approve" | "stake" | null
}): string {
  if (input.previewLike) return ""
  if (input.awaitingWalletSignature) return ""
  if (input.submittedAwaitingReceipt) {
    return STAKING_TX_UX_FOOTER_SUBMITTED_BODY
  }
  if (input.terminalFootKind === "error" && input.depositFailedStep) {
    return ""
  }
  if (input.terminalFootKind) {
    return terminalProgressFootnote(input.snapshot, input.terminalFootKind)
  }
  return ""
}

/** Inline alert inside the glass card while awaiting wallet signature. */
function TxWalletManualOpenAlert() {
  return (
    <div
      className={cn(
        TX_META_CARD,
        "flex items-start gap-2 border-amber-200/60 bg-amber-50/45",
      )}
      role="status"
    >
      <AlertTriangle
        className="mt-0.5 size-3.5 shrink-0 text-amber-600"
        aria-hidden
        strokeWidth={2.25}
      />
      <p className="text-[12px] leading-snug text-amber-950/90">
        {STAKING_TX_UX_WALLET_MANUAL_OPEN_HINT}
      </p>
    </div>
  )
}

/** Helper copy sits below the glass card — never inside it. */
function TxSheetHelperRegion({ text }: { text: string }) {
  return (
    <div className={TX_SHEET_HELPER_SLOT} aria-live="polite">
      <p className={cn(!text.trim() && "invisible")}>{text.trim() || "\u00a0"}</p>
    </div>
  )
}

/** CTA row sits below helper — same placement as preview Confirm/Cancel. */
function TxSheetActionRegion({
  previewLike,
  previewGasEstimateReady,
  previewPreparing,
  previewConfirmLabel,
  submittedAwaitingReceipt,
  awaitingWalletSignature,
  inProgressFooterClassic,
  successLike,
  terminalFootKind,
  retryLabel,
  successExplorerUrl,
  onPreviewCancel,
  onPreviewConfirm,
  onClose,
  onRetry,
}: {
  previewLike: boolean
  previewGasEstimateReady: boolean
  previewPreparing: boolean
  previewConfirmLabel: string
  submittedAwaitingReceipt: boolean
  awaitingWalletSignature: boolean
  inProgressFooterClassic: boolean
  successLike: boolean
  terminalFootKind: "dismissed" | "wallet_cancel" | "error" | "success" | null
  retryLabel: string
  successExplorerUrl: string | null
  onPreviewCancel: () => void
  onPreviewConfirm: () => void
  onClose: () => void
  onRetry: () => void
}) {
  const showTerminalActions =
    !previewLike &&
    !successLike &&
    !submittedAwaitingReceipt &&
    !awaitingWalletSignature &&
    !inProgressFooterClassic &&
    terminalFootKind !== null
  const showSuccessActions =
    !previewLike && successLike && !inProgressFooterClassic

  let ctaRow: ReactNode

  if (previewLike) {
    ctaRow = (
      <TxSheetCtaRow
        secondary={
          <GlowingButton
            type="button"
            variant="outline"
            size="lg"
            className={txSheetCtaOuterClass}
            buttonClassName={cn(txGlowOutlineClass, "h-full min-h-full")}
            onClick={onPreviewCancel}
          >
            Cancel
          </GlowingButton>
        }
        primary={
          <GlowingButton
            type="button"
            variant="default"
            size="lg"
            className={txSheetCtaOuterClass}
            buttonClassName={cn(txGlowPrimaryClass, "h-full min-h-full")}
            disabled={!previewGasEstimateReady || previewPreparing}
            aria-busy={previewPreparing}
            onClick={onPreviewConfirm}
          >
            {previewPreparing ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                {STAKING_TX_UX_PREPARING_TRANSACTION.replace(/\.\.\.$/, "")}
                ...
              </span>
            ) : (
              previewConfirmLabel
            )}
          </GlowingButton>
        }
      />
    )
  } else if (awaitingWalletSignature || inProgressFooterClassic || submittedAwaitingReceipt) {
    ctaRow = <TxSheetCtaRow />
  } else if (showSuccessActions) {
    ctaRow = (
      <TxSheetCtaRow
        secondary={
          successExplorerUrl ? (
            <GlowingButton
              type="button"
              variant="outline"
              size="lg"
              className={cn(
                "flex-1 min-w-0 rounded-full w-full! sm:w-full!",
                TX_SHEET_CTA_PILL_HEIGHT,
              )}
              buttonClassName={cn(txGlowOutlineClass, "h-full min-h-full !w-full sm:!w-full")}
              asGlowShell
            >
              <a
                href={successExplorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View transaction receipt"
                className={cn(txGlowOutlineClass, "inline-flex h-full w-full items-center justify-center gap-2")}
              >
                <ExternalLink className="size-4" aria-hidden />
                Receipt
              </a>
            </GlowingButton>
          ) : undefined
        }
        primary={
          <GlowingButton
            type="button"
            variant="default"
            size="lg"
            className={cn(
              "flex-1 min-w-0 rounded-full w-full! sm:w-full!",
              TX_SHEET_CTA_PILL_HEIGHT,
            )}
            buttonClassName={cn(txGlowPrimaryClass, "h-full min-h-full !w-full sm:!w-full")}
            onClick={onClose}
          >
            Done
          </GlowingButton>
        }
      />
    )
  } else if (showTerminalActions) {
    ctaRow = (
      <TxSheetCtaRow
        secondary={
          <GlowingButton
            type="button"
            variant="outline"
            size="lg"
            className={cn(
              "flex-1 min-w-0 rounded-full w-full! sm:w-full!",
              TX_SHEET_CTA_PILL_HEIGHT,
            )}
            buttonClassName={cn(txGlowOutlineClass, "h-full min-h-full w-full! sm:w-full!")}
            onClick={onClose}
          >
            Cancel
          </GlowingButton>
        }
        primary={
          <GlowingButton
            type="button"
            variant="default"
            size="lg"
            className={cn(
              "flex-1 min-w-0 rounded-full w-full! sm:w-full!",
              TX_SHEET_CTA_PILL_HEIGHT,
            )}
            buttonClassName={cn(txGlowPrimaryClass, "h-full min-h-full w-full! sm:w-full!")}
            onClick={onRetry}
          >
            {retryLabel}
          </GlowingButton>
        }
      />
    )
  } else {
    ctaRow = <TxSheetCtaRow />
  }

  return <div className={TX_SHEET_CTA_SLOT}>{ctaRow}</div>
}

function WithdrawProgressStep({
  wirePhase,
}: {
  wirePhase: TransactionWireStepPhase
}) {
  const label = withdrawStepLabel(wirePhase)
  const active = isWireInFlight(wirePhase)
  const done = wirePhase === "done"
  const failed = wirePhase === "failed"

  return (
    <div className={cn(TX_META_CARD, "flex min-h-10 items-center gap-2.5")}>
      {done ? (
        <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" aria-hidden strokeWidth={2.5} />
      ) : failed ? (
        <AlertCircle className="size-3.5 shrink-0 text-red-600" aria-hidden strokeWidth={2.25} />
      ) : active ? (
        <Loader2
          className="size-3.5 shrink-0 text-foreground motion-safe:animate-spin motion-reduce:animate-none"
          aria-hidden
          strokeWidth={2.25}
        />
      ) : (
        <span className="size-2 shrink-0 rounded-full bg-muted-foreground/35" aria-hidden />
      )}
      <span
        className={cn(
          "text-[13px] leading-tight tracking-tight",
          active && "font-semibold text-foreground",
          done && "font-medium text-foreground",
          failed && "font-medium text-red-700",
          !active && !done && !failed && "text-muted-foreground/70",
        )}
      >
        {label}
      </span>
    </div>
  )
}

export function TransactionStatusSurface() {
  const {
    snapshot,
    closeUser,
    confirmPreview,
    previewConfirmLocked,
    setDepositApprovalMode,
    dismissInFlightModalUiOnly,
    dismissSubmittedModal,
    retryLastTerminalFlow,
    retryRequest,
  } = useTransactionStatus()
  const {
    executionChainId,
    runtimeWalletAddress,
    tokenSymbol,
    stakingOwnerAddress,
  } = useStakingVault()
  const activeRuntimeSelection = useActiveRuntimeSelection()
  const modalWalletAddress = runtimeWalletAddress ?? stakingOwnerAddress
  const vaultTokenSymbolForModal =
    snapshot.frozenVaultTokenSymbol?.trim() ||
    tokenSymbol?.trim() ||
    STAKING_STABLECOIN_LABEL

  const snapRef = useRef(snapshot)
  snapRef.current = snapshot

  const tronUxRuntime =
    activeRuntimeSelection.deployment.chainFamily === "tron"

  const depositExecution = useMemo(() => {
    if (snapshot.scenario !== "deposit") return "skip" as const
    return deriveDepositApprovalExecution({
      needsApproval: snapshot.needsApproval,
      depositApprovalKind: snapshot.depositApprovalKind,
      approvalMode: snapshot.approvalMode,
    })
  }, [
    snapshot.scenario,
    snapshot.needsApproval,
    snapshot.depositApprovalKind,
    snapshot.approvalMode,
  ])

  const showApproveStep = depositShowsApproveStep(depositExecution, tronUxRuntime)

  const open = snapshot.dialogOpen && snapshot.uiPhase !== null
  const phase = snapshot.uiPhase
  const inProgress =
    phase === "pending" ||
    phase === "awaiting_signature" ||
    phase === "submitted" ||
    phase === "confirming"

  const submittedAwaitingReceipt =
    phase === "submitted" || phase === "confirming"
  const inProgressFooterClassic = inProgress && !submittedAwaitingReceipt

  const successLike = phase === "confirmed" || phase === "success"
  const failedLike = phase === "failed" || phase === "error"
  const cancelledLike = phase === "cancelled"
  const previewLike = phase === "preview"
  const walletFlowCancelled = failedLike && isCancelledMessage(snapshot.errorMessage)
  const progressTerminal = failedLike || cancelledLike || successLike
  const showProgressTrack =
    snapshot.scenario !== null &&
    !previewLike &&
    (inProgress || progressTerminal)

  const depositPreviewRail = useMemo(
    () =>
      deriveDepositPreviewStepRail({
        execution: depositExecution,
        tronUxRuntime,
      }),
    [depositExecution, tronUxRuntime],
  )

  const depositProgressRail = useMemo(
    () =>
      snapshot.scenario === "deposit"
        ? deriveDepositProgressStepRail({
            snapshot,
            execution: depositExecution,
            tronUxRuntime,
            walletFlowCancelled,
            cancelledLike,
          })
        : null,
    [
      snapshot,
      depositExecution,
      tronUxRuntime,
      walletFlowCancelled,
      cancelledLike,
    ],
  )

  const previewFeeRowLabel =
    snapshot.scenario === "deposit" && showApproveStep
      ? STAKING_TX_UX_FEE_APPROVE_AND_STAKE
      : "Network fee"

  const previewPrimaryLabel = previewConfirmLabel(
    snapshot.scenario,
    snapshot.needsApproval,
    showApproveStep,
  )

  const depositRetryLabelText = depositRetryLabel(depositProgressRail)

  const awaitingWalletSignature = useMemo(() => {
    if (phase !== "awaiting_signature" && phase !== "pending") return false
    if (snapshot.scenario === "deposit") {
      return depositAwaitingWalletSignature(snapshot, depositExecution)
    }
    if (snapshot.scenario === "withdraw") {
      return snapshot.withdrawWirePhase === "awaiting_signature"
    }
    return false
  }, [phase, snapshot, depositExecution])

  /**
   * Radix Dialog `onOpenChange(false)` is NOT authoritative for this flow: mobile WebKit,
   * wallet deep-links, and BFCache routinely emit spurious close intents while controlled
   * `open` stays driven only by `TransactionStatusProvider` snapshot state. All real closes
   * go through header/footer handlers calling `closeUser` / `beginInFlightDismissal`.
   */
  const onOpenChange = useCallback(
    (next: boolean) => {
      const snap = snapRef.current
      stakingTxLifecycleDev("onOpenChange", {
        next,
        phase: snap.uiPhase,
        dialogOpen: snap.dialogOpen,
      })
      const mobile = stakingMobileResumeStore.getSnapshot()
      stakingLifecycleTrace("tx-dialog", "radix_onOpenChange", {
        next,
        phase: snap.uiPhase,
        dialogOpen: snap.dialogOpen,
        visibilityState: typeof document !== "undefined" ? document.visibilityState : "?",
        suppressMobileResume: mobile.suppressRadixTxDialogSyntheticClose,
        restoredBfCache: mobile.restoredFromBfCache,
      })
      if (!next) {
        stakingLifecycleTrace("tx-dialog", "radix_close_false_suppressed", {
          phase: snap.uiPhase,
          reason: "controlled_dialog_closes_only_via_context",
        })
        stakingTxLifecycleDev("onOpenChange_false_ignored_mobile_safe", {
          phase: snap.uiPhase,
          suppressMobileResume: mobile.suppressRadixTxDialogSyntheticClose,
        })
      }
    },
    [],
  )

  /** Header X — explicit only; never rely on Radix `onOpenChange` on mobile. */
  const onExplicitHeaderDismiss = useCallback(() => {
    traceTxModalCloseClicked(snapRef.current, "explicit_header_dismiss")
    stakingTxLifecycleDev("explicit_header_dismiss", { phase })
    stakingLifecycleTrace("tx-dialog", "explicit_header_dismiss", { phase })
    if (submittedAwaitingReceipt) {
      dismissSubmittedModal()
      return
    }
    if (
      phase === "pending" ||
      phase === "awaiting_signature" ||
      (phase === "preview" && snapshot.preparingTransaction)
    ) {
      dismissInFlightModalUiOnly()
      return
    }
    closeUser()
  }, [
    phase,
    snapshot.preparingTransaction,
    submittedAwaitingReceipt,
    dismissSubmittedModal,
    dismissInFlightModalUiOnly,
    closeUser,
  ])

  const headerDismissButtonClass = cn(
    "absolute top-3 right-3 z-20 flex size-10 shrink-0 items-center justify-center rounded-full",
    "sm:top-3.5 sm:right-3.5 sm:size-7 cursor-pointer hover:bg-white/32 hover:border-white/70 active:scale-[0.94]",
    "border border-white/55 bg-white/22 text-neutral-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_4px_16px_-6px_rgba(0,0,0,0.18)]",
    "backdrop-blur-xl backdrop-saturate-150 supports-backdrop-filter:bg-white/18",
    "transition-[transform,background-color,box-shadow,border-color] duration-200 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400/45 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-[18px] [&_svg]:stroke-[2.25] sm:[&_svg]:size-[15px]"
  )

  const prevAddrRef = useRef<string | null | undefined>(undefined)
  const prevChainRef = useRef<number | null | undefined>(undefined)
  useEffect(() => {
    if (!(process.env.NODE_ENV !== 'production')) return
    const pa = prevAddrRef.current
    const pc = prevChainRef.current
    if (
      pa !== undefined &&
      (pa !== modalWalletAddress || pc !== executionChainId)
    ) {
      stakingTxLifecycleDev("vault_context_shift", {
        addressBefore: pa ?? null,
        addressAfter: modalWalletAddress ?? null,
        chainIdBefore: pc ?? null,
        chainIdAfter: executionChainId ?? null,
      })
    }
    prevAddrRef.current = modalWalletAddress
    prevChainRef.current = executionChainId ?? null
  }, [modalWalletAddress, executionChainId])

  useEffect(() => {
    if (!(process.env.NODE_ENV !== 'production')) return
    const onVis = () => {
      traceTxMobilePipeline(
        document.visibilityState === "hidden"
          ? "visibility_hidden"
          : "visibility_visible",
        { phase }
      )
      stakingTxLifecycleDev("visibilitychange", {
        visibilityState: document.visibilityState,
        phase,
      })
      stakingLifecycleTrace("resume", "dev_visibility", {
        visibilityState: document.visibilityState,
        uiPhase: snapRef.current.uiPhase,
        dialogOpen: snapRef.current.dialogOpen,
      })
    }
    document.addEventListener("visibilitychange", onVis)
    return () => document.removeEventListener("visibilitychange", onVis)
  }, [phase])

  useEffect(() => {
    if (!(process.env.NODE_ENV !== 'production')) return
    const onFocus = () => {
      traceTxMobilePipeline("window_focus", { phase })
      stakingTxLifecycleDev("window_focus", { phase })
      stakingLifecycleTrace("resume", "dev_window_focus", {
        uiPhase: snapRef.current.uiPhase,
      })
    }
    const onBlur = () => {
      traceTxMobilePipeline("window_blur", { phase })
      stakingTxLifecycleDev("window_blur", { phase })
      stakingLifecycleTrace("resume", "dev_window_blur", {
        uiPhase: snapRef.current.uiPhase,
      })
    }
    const onPageShow = (e: PageTransitionEvent) => {
      traceTxMobilePipeline("pageshow", {
        persisted: e.persisted,
        uiPhase: snapRef.current.uiPhase,
      })
      stakingLifecycleTrace("resume", "dev_pageshow", {
        persisted: e.persisted,
        uiPhase: snapRef.current.uiPhase,
      })
    }
    const onPageHide = (e: PageTransitionEvent) => {
      traceTxMobilePipeline("pagehide", {
        persisted: e.persisted,
        uiPhase: snapRef.current.uiPhase,
      })
    }
    window.addEventListener("focus", onFocus)
    window.addEventListener("blur", onBlur)
    window.addEventListener("pageshow", onPageShow)
    window.addEventListener("pagehide", onPageHide)
    return () => {
      window.removeEventListener("focus", onFocus)
      window.removeEventListener("blur", onBlur)
      window.removeEventListener("pageshow", onPageShow)
      window.removeEventListener("pagehide", onPageHide)
    }
  }, [phase])

  const sheetShowsBody =
    previewLike || showProgressTrack || successLike || failedLike || cancelledLike || inProgress

  const terminalFootKind: "dismissed" | "wallet_cancel" | "error" | "success" | null =
    successLike
      ? "success"
      : cancelledLike
        ? "dismissed"
        : walletFlowCancelled
          ? "wallet_cancel"
          : failedLike
            ? "error"
            : null

  const sheetHelperText = useMemo(
    () =>
      resolveTxSheetHelperText({
        previewLike,
        submittedAwaitingReceipt,
        awaitingWalletSignature,
        terminalFootKind,
        snapshot,
        depositFailedStep: depositProgressRail?.failedStep ?? null,
      }),
    [
      previewLike,
      submittedAwaitingReceipt,
      awaitingWalletSignature,
      terminalFootKind,
      snapshot,
      depositProgressRail?.failedStep,
    ],
  )

  const modalTitle = headerTitle(
    phase,
    snapshot.scenario,
    depositProgressRail,
    failedLike,
    snapshot.errorMessage,
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="z-61 bg-black/45 backdrop-blur-sm supports-[backdrop-filter]:bg-black/35 data-[state=open]:animate-in data-[state=closed]:animate-out duration-150 ease-out"
        onInteractOutside={e => e.preventDefault()}
        onPointerDownOutside={e => e.preventDefault()}
        className={cn(
          STAKING_BALANCE_LIQUID_CARD,
          "z-62 gap-0 overflow-y-auto p-0 font-sans duration-150 ease-out motion-reduce:duration-200",
          "max-h-[min(90dvh,640px)] max-md:inset-x-0 max-md:bottom-0 max-md:top-auto max-md:max-h-[90dvh] max-md:max-w-full max-md:w-full max-md:translate-x-0 max-md:translate-y-0 max-md:rounded-t-4xl max-md:rounded-b-none max-md:border-b-0 max-md:data-[state=open]:slide-in-from-bottom-2 max-md:data-[state=closed]:slide-out-to-bottom",
          "fixed right-0 bottom-0 left-0 top-auto max-w-none translate-x-0 translate-y-0 rounded-b-none rounded-t-2xl border-t p-0 sm:top-1/2 sm:right-auto sm:bottom-auto sm:left-1/2 sm:max-w-md sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-3xl sm:border",
          "pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]",
          "overscroll-y-contain"
        )}
      >
        <button
          type="button"
          className={headerDismissButtonClass}
          onClick={onExplicitHeaderDismiss}
          aria-label="Close"
        >
          <XIcon />
        </button>
        <div className="pointer-events-none flex justify-center pt-2.5 pb-0.5 md:hidden" aria-hidden>
          <span className="h-1.5 w-9 shrink-0 rounded-full bg-white/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]" />
        </div>

        <div className={cn("flex flex-col", STAKING_MODAL_PADDING_CONTENT_DENSE)}>
          <DialogHeader className="mb-2 min-h-11 space-y-1 pr-10 text-left sm:pr-12 px-1">
            <DialogTitle
              className={cn(
                STAKING_MODAL_TYPE_TX_TITLE,
                "leading-snug motion-safe:transition-[opacity,color] motion-safe:duration-150 motion-safe:ease-out",
              )}
            >
              <span className="flex min-w-0 items-center gap-2">
                <PhaseHeaderIcon phase={phase} scenario={snapshot.scenario} />
                <span className="min-w-0">{modalTitle}</span>
              </span>
            </DialogTitle>
            <DialogDescription className="sr-only">
              Review staking transaction status, network fee, progress, and available actions.
            </DialogDescription>
          </DialogHeader>

          {sheetShowsBody ? (
            <>
              <div className={TX_SHEET_GLASS_CARD}>
                {previewLike ? (
                  <div className="space-y-3">
                    <TxAmountFeeBlock
                      amountLabel={snapshot.amountLabel}
                      feeLine={canonicalStakingFeeLine(snapshot)}
                      feeRowLabel={previewFeeRowLabel}
                      tokenSymbol={vaultTokenSymbolForModal}
                      chainFamily={activeRuntimeSelection.deployment.chainFamily}
                      feeSkeleton={!snapshot.previewGasEstimateReady}
                      feeSkeletonClassName={
                        snapshot.scenario === "withdraw"
                          ? STAKING_TOKEN_FEE_VALUE_SKELETON
                          : STAKING_ETH_FEE_VALUE_SKELETON
                      }
                    />

                    {snapshot.scenario === "deposit" ? (
                      <div className="border-t border-white/25 pt-2.5">
                        <TransactionDepositPreviewStepRail
                          showApprove={depositPreviewRail.showApprove}
                          approveState={depositPreviewRail.approve}
                          stakeState={depositPreviewRail.stake}
                          tokenSymbol={vaultTokenSymbolForModal}
                        />
                      </div>
                    ) : null}

                    {snapshot.needsApproval &&
                      snapshot.scenario === "deposit" &&
                      showApproveStep ? (
                      <div className="space-y-0.5 border-t border-white/25 pt-2">
                        <div className="flex items-center justify-between gap-3 pe-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground">
                              {snapshot.approvalMode === "unlimited"
                                ? STAKING_TX_UX_APPROVAL_UNLIMITED
                                : STAKING_TX_UX_APPROVAL_LIMITED}
                            </p>
                            <p className="text-[11px] leading-snug text-muted-foreground">
                              {snapshot.approvalMode === "unlimited"
                                ? STAKING_TX_UX_APPROVAL_UNLIMITED_HINT
                                : STAKING_TX_UX_APPROVAL_LIMITED_HINT}
                            </p>
                          </div>
                          <Switch
                            size="default"
                            checked={snapshot.approvalMode === "unlimited"}
                            onCheckedChange={checked =>
                              setDepositApprovalMode(
                                checked ? "unlimited" : "limited"
                              )
                            }
                            aria-label={
                              snapshot.approvalMode === "unlimited"
                                ? STAKING_TX_UX_APPROVAL_UNLIMITED
                                : STAKING_TX_UX_APPROVAL_LIMITED
                            }
                            className={cn(
                              "shrink-0 border border-neutral-300/70 shadow-none",
                              "data-[state=checked]:bg-[#2563EB] data-[state=unchecked]:bg-neutral-200",
                              "dark:border-neutral-600 dark:data-[state=unchecked]:bg-neutral-700 dark:data-[state=checked]:bg-neutral-950",
                              "focus-visible:border-neutral-400 focus-visible:ring-neutral-400/35"
                            )}
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {showProgressTrack && snapshot.scenario === "deposit" && depositProgressRail ? (
                  <div className="space-y-3">
                    <TxAmountFeeBlock
                      amountLabel={snapshot.amountLabel}
                      feeLine={canonicalStakingFeeLine(snapshot)}
                      feeRowLabel="Network fee"
                      tokenSymbol={vaultTokenSymbolForModal}
                      chainFamily={activeRuntimeSelection.deployment.chainFamily}
                    />
                    <TransactionDepositProgressStepRail
                      key={`deposit-rail-${retryRequest.nonce}`}
                      showApprove={depositProgressRail.showApprove}
                      reviewState={depositProgressRail.review}
                      approveState={depositProgressRail.approve}
                      stakeState={depositProgressRail.stake}
                      tokenSymbol={vaultTokenSymbolForModal}
                    />
                  </div>
                ) : null}

                {showProgressTrack && snapshot.scenario === "withdraw" ? (
                  <div className="space-y-3">
                    <TxAmountFeeBlock
                      amountLabel={snapshot.amountLabel}
                      feeLine={canonicalStakingFeeLine(snapshot)}
                      feeRowLabel="Network fee"
                      tokenSymbol={vaultTokenSymbolForModal}
                      chainFamily={activeRuntimeSelection.deployment.chainFamily}
                    />
                    <WithdrawProgressStep
                      key={`withdraw-rail-${retryRequest.nonce}`}
                      wirePhase={snapshot.withdrawWirePhase}
                    />
                  </div>
                ) : null}

                {awaitingWalletSignature ? <TxWalletManualOpenAlert /> : null}
              </div>

              <TxSheetHelperRegion text={sheetHelperText} />

              <TxSheetActionRegion
                previewLike={previewLike}
                previewGasEstimateReady={snapshot.previewGasEstimateReady}
                previewPreparing={
                  snapshot.preparingTransaction || previewConfirmLocked
                }
                previewConfirmLabel={previewPrimaryLabel}
                submittedAwaitingReceipt={submittedAwaitingReceipt}
                awaitingWalletSignature={awaitingWalletSignature}
                inProgressFooterClassic={inProgressFooterClassic}
                successLike={successLike}
                terminalFootKind={terminalFootKind}
                retryLabel={
                  snapshot.scenario === "deposit"
                    ? depositRetryLabelText
                    : STAKING_TX_UX_RETRY_TRANSACTION
                }
                successExplorerUrl={snapshot.successExplorerUrl}
                onPreviewCancel={closeUser}
                onPreviewConfirm={confirmPreview}
                onClose={closeUser}
                onRetry={retryLastTerminalFlow}
              />
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
