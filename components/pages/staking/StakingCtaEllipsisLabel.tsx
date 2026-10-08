import { stripTrailingAsciiEllipsis } from "@/staking/cta"
import { cn } from "@/lib/utils"
import { memo } from "react"
import styles from "./StakingCtaEllipsis.module.css"

export type StakingCtaEllipsisLabelProps = {
  /** Full visible label (may end with ASCII "..."). */
  text: string
  /** When false, renders `text` unchanged. */
  animate: boolean
  className?: string
  /** Optional smaller dots in dense rows (e.g. modal timeline). */
  dense?: boolean
}

/**
 * Stable-width trailing ellipsis animation for staking CTAs.
 * When `animate` is true and `text` ends with `...`, strips literal dots and
 * renders a fixed 3ch CSS-animated slot (no React timers).
 */
export const StakingCtaEllipsisLabel = memo(function StakingCtaEllipsisLabel({
  text,
  animate,
  className,
  dense,
}: StakingCtaEllipsisLabelProps) {
  if (!animate) {
    return <span className={className}>{text}</span>
  }

  const { base, hadEllipsis } = stripTrailingAsciiEllipsis(text)
  if (!hadEllipsis) {
    return <span className={className}>{text}</span>
  }

  return (
    <span
      className={cn(
        "inline-flex max-w-full min-w-0 items-baseline justify-center gap-0",
        className
      )}
    >
      <span className="min-w-0 truncate">{base}</span>
      <span
        className={cn(
          styles.slot,
          "font-mono leading-none",
          dense ? "text-[0.7em]" : "text-[0.92em]"
        )}
        aria-hidden
      >
        <span className={styles.dot}>.</span>
        <span className={styles.dot}>.</span>
        <span className={styles.dot}>.</span>
      </span>
    </span>
  )
})
