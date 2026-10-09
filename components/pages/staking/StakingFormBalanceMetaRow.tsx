import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

/** One stable line height for skeleton ↔ real values (no vertical layout shift). */
export const STAKING_FORM_BALANCE_META_ROW_CLASS = cn(
  "flex min-h-5 w-full min-w-0 flex-row items-center justify-between gap-x-2 px-1 ps-2",
  "text-[11px] leading-5 tabular-nums font-mono sm:gap-x-3 sm:text-xs sm:leading-5"
)

const ROW_CLASS = STAKING_FORM_BALANCE_META_ROW_CLASS

const META_SKELETON_CLASS =
  "h-5 max-h-5 min-h-5 shrink-0 self-center rounded-md"

const TOKEN_SYMBOL_CLASS =
  "font-mono text-[11px] font-extralight leading-5 text-gray-400 sm:text-xs"

/** Invisible token+symbol footprint when disconnected (no em dash, stable width). */
const TOKEN_INACTIVE_RESERVE_CLASS =
  "inline-flex min-h-5 min-w-[4.25rem] shrink-0 items-center whitespace-nowrap leading-5 opacity-0 pointer-events-none select-none"

const GAS_COLUMN_CLASS =
  "flex min-h-5 min-w-22 shrink-0 items-center justify-end ps-1"

const GAS_INACTIVE_RESERVE_CLASS =
  "inline-flex min-h-5 shrink-0 items-center whitespace-nowrap text-end leading-5 opacity-0 pointer-events-none select-none"

type MetaGasColumnProps = {
  applyGasColumn: boolean
  reserveInactive: boolean
  nativeAmount: string | null
  nativeSymbol: string
  nativeAmountClassName?: string
}

function MetaGasColumn({
  applyGasColumn,
  reserveInactive,
  nativeAmount,
  nativeSymbol,
  nativeAmountClassName,
}: MetaGasColumnProps) {
  if (!applyGasColumn) return null

  return (
    <div className={GAS_COLUMN_CLASS}>
      {reserveInactive ? (
        <span className={GAS_INACTIVE_RESERVE_CLASS} aria-hidden>
          <span className='font-medium tabular-nums'>{"\u00A0"}</span>
          <span className={TOKEN_SYMBOL_CLASS}>{"\u00A0"}</span>
        </span>
      ) : nativeAmount === null ? (
        <Skeleton
          className={cn(META_SKELETON_CLASS, "w-22")}
          aria-hidden
        />
      ) : (
        <span className='inline-flex min-h-5 shrink-0 items-center whitespace-nowrap text-end leading-5'>
          <span
            className={cn(
              "text-xs font-mono",
              nativeAmountClassName
            )}
          >
            {nativeAmount}
          </span>
          <span className={TOKEN_SYMBOL_CLASS}>{nativeSymbol}</span>
        </span>
      )}
    </div>
  )
}

export type StakingFormBalanceMetaRowProps = {
  /** e.g. `Assets:` or `Withdrawable:` */
  prefix: string
  /** Show native gas column (EVM product surface). */
  applyGasColumn: boolean
  /** EVM + wallet disconnected: token area reserves footprint (no visible punctuation). */
  showDisconnectedDash: boolean
  tokenSkeleton: boolean
  tokenAmountClassName?: string
  tokenAmount: string
  tokenSymbol: string
  nativeAmountClassName?: string
  /** `null` while loading or unavailable — fixed column shows a skeleton. */
  nativeAmount: string | null
  nativeSymbol: string
}

/**
 * Staking deposit/withdraw meta row: `prefix` + token balance (skeleton while loading)
 * and native gas on the end (`justify-between`). Amount + symbol are glued (no space) and not ellipsis-truncated.
 */
export function StakingFormBalanceMetaRow({
  prefix,
  applyGasColumn,
  showDisconnectedDash,
  tokenSkeleton,
  tokenAmountClassName,
  tokenAmount,
  tokenSymbol,
  nativeAmountClassName,
  nativeAmount,
  nativeSymbol,
}: StakingFormBalanceMetaRowProps) {
  return (
    <div className={ROW_CLASS}>
      <div className='flex min-h-5 min-w-0 flex-1 items-center gap-x-1.5'>
        <span className='shrink-0 leading-5 font-normal text-muted-foreground'>
          {prefix}
        </span>
        {showDisconnectedDash ? (
          <span className={TOKEN_INACTIVE_RESERVE_CLASS} aria-hidden>
            <span className='font-medium tabular-nums'>{"\u00A0"}</span>
            <span className={TOKEN_SYMBOL_CLASS}>{"\u00A0"}</span>
          </span>
        ) : tokenSkeleton ? (
          <Skeleton
            className={cn(META_SKELETON_CLASS, "w-29")}
            aria-hidden
          />
        ) : (
          <span className='inline-flex min-h-5 min-w-0 shrink-0 items-center whitespace-nowrap leading-5'>
            <span
              className={cn(
                "text-xs font-mono",
                tokenAmountClassName
              )}
            >
              {tokenAmount}
            </span>
            <span className={TOKEN_SYMBOL_CLASS}>{tokenSymbol}</span>
          </span>
        )}
      </div>
      <MetaGasColumn
        applyGasColumn={applyGasColumn}
        reserveInactive={showDisconnectedDash}
        nativeAmount={nativeAmount}
        nativeSymbol={nativeSymbol}
        nativeAmountClassName={nativeAmountClassName}
      />
    </div>
  )
}

/** One constraint hint (`Max now:` / `Min:`) — same token amount layout as `StakingFormBalanceMetaRow`. */
export type StakingFormBalanceMetaConstraintHint = Readonly<{
  prefix: string
  tokenAmount: string
  tokenSymbol: string
  tokenAmountClassName?: string
}>

export type StakingFormBalanceMetaConstraintsRowProps = {
  maxHint: StakingFormBalanceMetaConstraintHint | null | undefined
  minHint: StakingFormBalanceMetaConstraintHint | null | undefined
  title?: string
  applyGasColumn: boolean
  reserveGasInactive: boolean
  nativeAmount: string | null
  nativeSymbol: string
  nativeAmountClassName?: string
}

function MetaConstraintTokenHint({
  hint,
  align = "start",
}: {
  hint: StakingFormBalanceMetaConstraintHint
  align?: "start" | "end"
}) {
  return (
    <div
      className={cn(
        "flex min-h-5 shrink-0 items-center gap-x-1.5 whitespace-nowrap leading-5",
        align === "end" && "ms-auto"
      )}
    >
      <span className='shrink-0 font-normal leading-5 text-muted-foreground'>
        {hint.prefix}
      </span>
      <span className='inline-flex min-h-5 shrink-0 items-center whitespace-nowrap leading-5'>
        <span className={cn("text-xs font-mono", hint.tokenAmountClassName)}>
          {hint.tokenAmount}
        </span>
        <span className={TOKEN_SYMBOL_CLASS}>{hint.tokenSymbol}</span>
      </span>
    </div>
  )
}

/** Withdraw min/max constraints — matches deposit `Assets:` meta row styling + EVM gas column. */
export function StakingFormBalanceMetaConstraintsRow({
  maxHint,
  minHint,
  title,
  applyGasColumn,
  reserveGasInactive,
  nativeAmount,
  nativeSymbol,
  nativeAmountClassName,
}: StakingFormBalanceMetaConstraintsRowProps) {
  return (
    <div className={ROW_CLASS} title={title}>
      <div className='flex min-h-5 min-w-0 flex-1 items-center gap-x-1.5'>
        {maxHint ? (
          <MetaConstraintTokenHint hint={maxHint} />
        ) : (
          <span className='min-h-5 shrink-0' aria-hidden>
            {"\u00A0"}
          </span>
        )}
        {minHint ? <MetaConstraintTokenHint hint={minHint} align='end' /> : null}
      </div>
      <MetaGasColumn
        applyGasColumn={applyGasColumn}
        reserveInactive={reserveGasInactive}
        nativeAmount={nativeAmount}
        nativeSymbol={nativeSymbol}
        nativeAmountClassName={nativeAmountClassName}
      />
    </div>
  )
}
