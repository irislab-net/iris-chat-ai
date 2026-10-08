import { cn } from "@/lib/utils"
import { memo } from "react"

export type StakingApyBadgeVariant = "compact" | "hero"

/**
 * Circular APY badge — Exur liquid glass disc (composer frost + soft blue tint).
 * `displayPercent` is an informational up-to yield indicator, not a guarantee.
 */
export const StakingApyBadge = memo(function StakingApyBadge({
  displayPercent,
  variant = "compact",
  className,
  title,
  degraded = false,
}: {
  /** Whole number percent, e.g. 20 for "20%". */
  displayPercent: number
  variant?: StakingApyBadgeVariant
  className?: string
  /** Optional native tooltip; prefer `degraded` for live-data-unavailable state. */
  title?: string
  /** Live APY unavailable — muted glass + indicator; figure may be a placeholder. */
  degraded?: boolean
}) {
  const hero = variant === "hero"
  const ariaLabel = degraded
    ? `Up to ${displayPercent}% APY placeholder until live data loads`
    : `Up to ${displayPercent}% APY`

  return (
    <div
      className={cn(
        "chat-ios26-liquid-glass relative isolate shrink-0 overflow-hidden rounded-full contain-[paint]",
        "border border-white/50 bg-white/40",
        "shadow-[inset_0_1px_1px_rgba(255,255,255,0.85),inset_0_-6px_14px_-8px_rgba(0,0,0,0.08),0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-10px_rgba(37,99,235,0.22)]",
        "backdrop-blur-xl backdrop-saturate-[190%] supports-[backdrop-filter]:bg-white/22",
        "dark:border-white/18 dark:bg-white/12 dark:supports-[backdrop-filter]:bg-white/8",
        hero ? "size-32 md:size-36" : "size-21 sm:size-22",
        degraded && "opacity-90",
        className
      )}
      aria-label={ariaLabel}
      title={title}
    >
      {degraded ? (
        <span
          className={cn(
            "absolute z-20 rounded-full bg-amber-400 ring-2 ring-white/80",
            hero ? "top-1.5 right-1.5 size-2.5" : "top-0.5 right-0.5 size-2"
          )}
          aria-hidden
        />
      ) : null}

      {/* Soft blue liquid wash */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 z-0",
          "bg-[radial-gradient(circle_at_50%_32%,rgba(37,99,235,0.22)_0%,rgba(147,197,253,0.1)_42%,transparent_70%)]",
          degraded && "opacity-60"
        )}
      />

      {/* Specular highlight */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[10%] z-0 rounded-full bg-[radial-gradient(circle_at_50%_28%,rgba(255,255,255,0.55)_0%,transparent_55%)]"
      />

      <span className="relative z-10 flex size-full flex-col items-center justify-center px-1">
        <span
          className={cn(
            "leading-none font-medium uppercase tracking-[0.08em] text-muted-foreground",
            hero ? "mb-0.5 text-[8px] md:text-[9px]" : "mb-px text-[6px]"
          )}
        >
          Up to
        </span>
        <span
          className={cn(
            "leading-none font-bold tabular-nums text-foreground",
            hero ? "text-xl md:text-2xl" : "text-[18px]",
            degraded && "text-foreground/60"
          )}
        >
          {displayPercent}%
        </span>
        <span
          className={cn(
            "font-medium tracking-wide text-[#1D4ED8] dark:text-[#93C5FD]",
            hero ? "mt-0.5 text-[10px] md:text-xs" : "text-[10px]",
            degraded && "opacity-70"
          )}
        >
          APY
        </span>
      </span>
    </div>
  )
})
