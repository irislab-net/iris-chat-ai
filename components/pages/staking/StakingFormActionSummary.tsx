import { Skeleton } from "@/components/ui/skeleton"
import {
  STAKING_SUMMARY_FEE_VALUE_SKELETON,
  STAKING_SUMMARY_INLINE_VALUE_SKELETON,
} from "@/lib/stakingFeeValueSkeleton"
import { cn } from "@/lib/utils"

const SUMMARY_STACK = "flex w-full min-w-0 shrink-0 flex-col gap-px font-mono"
const ROW = "flex h-4 min-h-4 w-full shrink-0 items-center justify-between gap-2 overflow-hidden px-1"
/** Fee / Receive / Est. rewards labels — one size, weight, and color. */
const SUMMARY_LABEL = "shrink-0 text-[11px] font-normal leading-none text-neutral-500"
/** Right-column values (~0 ETH, ~0 USDM, +0 USDM / Year) — match label typography scale. */
const SUMMARY_VALUE =
  "min-w-0 max-w-full truncate text-right text-[11px] font-normal leading-none tabular-nums tracking-tight text-neutral-600"

type FeeValueCellProps = {
  feeRightDisplay: string
  feeLoading: boolean
  gasShortfall: boolean
  feeMuted: boolean
  title?: string
}

function FeeValueCell({
  feeRightDisplay,
  feeLoading,
  gasShortfall,
  feeMuted,
  title,
}: FeeValueCellProps) {
  const hasValue = feeRightDisplay.trim() !== ""
  const showSkeleton = feeLoading

  return (
    <div className='flex h-4 min-w-0 flex-1 items-center justify-end overflow-hidden'>
      {showSkeleton ? (
        <Skeleton
          className={cn(
            STAKING_SUMMARY_FEE_VALUE_SKELETON,
            "motion-safe:transition-opacity motion-safe:duration-200 motion-safe:ease-out"
          )}
          aria-busy
          aria-label='Loading fee'
        />
      ) : (
        <span
          aria-live='polite'
          title={title}
          className={cn(
            SUMMARY_VALUE,
            "motion-safe:transition-[color,opacity] motion-safe:duration-150 motion-safe:ease-out",
            gasShortfall && "text-red-500",
            !gasShortfall && feeMuted && hasValue && "opacity-75"
          )}
        >
          {hasValue ? feeRightDisplay : "\u00A0"}
        </span>
      )}
    </div>
  )
}

type ReceiveValueCellProps = {
  display: string | null
  /** Keep row height while protocol fee (withdraw) is resolving */
  loading?: boolean
  ghost?: boolean
}

function ReceiveValueCell({
  display,
  loading = false,
  ghost = false,
}: ReceiveValueCellProps) {
  if (loading) {
    return (
      <div className='flex h-4 min-w-0 flex-1 items-center justify-end overflow-hidden'>
        <Skeleton
          className={cn(
            STAKING_SUMMARY_INLINE_VALUE_SKELETON,
            "motion-safe:transition-opacity motion-safe:duration-200 motion-safe:ease-out"
          )}
          aria-busy
          aria-label='Loading receive amount'
        />
      </div>
    )
  }
  const empty = ghost || display === null || display.trim() === ""
  return (
    <span
      className={cn(
        SUMMARY_VALUE,
        "flex-1 motion-safe:transition-[color,opacity] motion-safe:duration-150 motion-safe:ease-out",
        empty && "pointer-events-none select-none opacity-0"
      )}
      aria-hidden={empty}
    >
      {empty ? "\u00A0" : display}
    </span>
  )
}

export type StakingFormActionSummaryDepositProps = Readonly<{
  feeRightDisplay: string
  feeLoading: boolean
  feeMuted: boolean
  gasShortfall: boolean
  feeHintTitle?: string
  /** EVM fee row only; passive Tron hides network-fee line. */
  showNetworkFeeRow?: boolean
  receiveDisplay: string | null
  receiveLoading?: boolean
  yieldLine: string | null
  yieldLoading?: boolean
}>

/** Deposit: Fee → Receive → Est. rewards (+/year • APY) — single-line rows, stable heights */
export function StakingFormActionSummaryDeposit({
  feeRightDisplay,
  feeLoading,
  feeMuted,
  gasShortfall,
  feeHintTitle,
  showNetworkFeeRow = true,
  receiveDisplay,
  receiveLoading = false,
  yieldLine,
  yieldLoading = false,
}: StakingFormActionSummaryDepositProps) {
  const yieldEmpty = yieldLine === null || yieldLine.trim() === ""
  const profitShowSkeleton = yieldLoading
  return (
    <div className={SUMMARY_STACK} aria-label='Fee, receive, and estimated rewards'>
      {showNetworkFeeRow ? (
        <div className={ROW}>
          <span className={SUMMARY_LABEL}>Fee</span>
          <FeeValueCell
            feeRightDisplay={feeRightDisplay}
            feeLoading={feeLoading}
            gasShortfall={gasShortfall}
            feeMuted={feeMuted}
            title={feeHintTitle}
          />
        </div>
      ) : null}
      <div className={ROW}>
        <span className={SUMMARY_LABEL}>Receive</span>
        <ReceiveValueCell
          display={receiveDisplay}
          loading={receiveLoading}
          ghost={!receiveLoading && receiveDisplay === null}
        />
      </div>
      <div className={ROW}>
        <span
          className={cn(
            SUMMARY_LABEL,
            (yieldEmpty && !profitShowSkeleton) &&
              "pointer-events-none select-none opacity-0"
          )}
          aria-hidden={yieldEmpty && !profitShowSkeleton}
        >
          Est. rewards
        </span>
        {profitShowSkeleton ? (
          <div className='flex h-4 min-w-0 flex-1 items-center justify-end overflow-hidden'>
            <Skeleton
              className={cn(
                STAKING_SUMMARY_INLINE_VALUE_SKELETON,
                "motion-safe:transition-opacity motion-safe:duration-200 motion-safe:ease-out"
              )}
              aria-busy
              aria-label='Loading reward estimate'
            />
          </div>
        ) : (
          <span
            className={cn(
              SUMMARY_VALUE,
              "flex-1 motion-safe:transition-[color,opacity] motion-safe:duration-150 motion-safe:ease-out",
              yieldEmpty && "pointer-events-none select-none opacity-0"
            )}
            aria-hidden={yieldEmpty}
          >
            {yieldEmpty ? "\u00A0" : yieldLine}
          </span>
        )}
      </div>
    </div>
  )
}

export type StakingFormActionSummaryWithdrawProps = Readonly<{
  feeRightDisplay: string
  feeLoading: boolean
  feeMuted: boolean
  gasShortfall: boolean
  feeHintTitle?: string
  /** EVM fee row only; passive Tron hides network-fee line. */
  showNetworkFeeRow?: boolean
  receiveDisplay: string | null
  receiveLoading?: boolean
}>

/** Withdraw: Fee → Receive (net) + inert Est. rewards row so height matches deposit summary */
export function StakingFormActionSummaryWithdraw({
  feeRightDisplay,
  feeLoading,
  feeMuted,
  gasShortfall,
  feeHintTitle,
  showNetworkFeeRow = true,
  receiveDisplay,
  receiveLoading = false,
}: StakingFormActionSummaryWithdrawProps) {
  return (
    <div className={SUMMARY_STACK} aria-label='Fee and receive'>
      {showNetworkFeeRow ? (
        <div className={ROW}>
          <span className={SUMMARY_LABEL}>Fee</span>
          <FeeValueCell
            feeRightDisplay={feeRightDisplay}
            feeLoading={feeLoading}
            gasShortfall={gasShortfall}
            feeMuted={feeMuted}
            title={feeHintTitle}
          />
        </div>
      ) : null}
      <div className={ROW}>
        <span className={SUMMARY_LABEL}>Receive</span>
        <ReceiveValueCell
          display={receiveDisplay}
          loading={receiveLoading}
          ghost={!receiveLoading && receiveDisplay === null}
        />
      </div>
      <div className={ROW} aria-hidden>
        <span
          className={cn(
            SUMMARY_LABEL,
            "pointer-events-none select-none opacity-0"
          )}
        >
          Est. rewards
        </span>
        <span
          className={cn(
            SUMMARY_VALUE,
            "flex-1 pointer-events-none select-none opacity-0"
          )}
        >
          {"\u00A0"}
        </span>
      </div>
    </div>
  )
}
