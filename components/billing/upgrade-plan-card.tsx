"use client"

import { CheckIcon } from "lucide-react"

import type { PlanKey } from "@/lib/billing/catalog"
import { parsePriceAmount } from "@/lib/billing/prices"
import {
  landingGlassSheen,
  landingTitlePlan,
  landingTitlePrice,
} from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

type UpgradePlanCardProps = {
  planKey: PlanKey
  name: string
  description: string
  price: string
  /** Crossed-out compare-at price (e.g. $49 next to $19). */
  priceWas?: string | null
  cadence: string
  features: readonly string[]
  selected: boolean
  isCurrent: boolean
  currentLabel?: string
  badge?: string
  featured?: boolean
  onSelect: () => void
}

export function UpgradePlanCard({
  planKey,
  name,
  description,
  price,
  priceWas,
  cadence,
  features,
  selected,
  isCurrent,
  currentLabel = "Current",
  badge,
  featured,
  onSelect,
}: UpgradePlanCardProps) {
  const priceAmount = parsePriceAmount(price)
  const showCadence = priceAmount !== null && priceAmount > 0

  return (
    <article
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onSelect()
        }
      }}
      className={cn(
        "relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[1.75rem] outline-none transition-[background-color,box-shadow] duration-200 ease-out",
        "focus-visible:shadow-[0_24px_64px_rgba(15,23,42,0.12),inset_0_1px_1px_rgba(255,255,255,0.98)]",
        "bg-white/38 shadow-[0_16px_48px_rgba(15,23,42,0.08),inset_0_1px_1px_rgba(255,255,255,0.92),inset_0_-1px_2px_rgba(255,255,255,0.28)] backdrop-blur-2xl dark:bg-white/8 dark:shadow-[0_16px_48px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.12),inset_0_-1px_2px_rgba(255,255,255,0.04)]",
        featured && !selected && "bg-white/48 dark:bg-white/10",
        selected &&
          "bg-white/72 shadow-[0_24px_64px_rgba(15,23,42,0.12),inset_0_1px_1px_rgba(255,255,255,0.98),inset_0_-1px_2px_rgba(255,255,255,0.4)] dark:bg-white/[0.14] dark:shadow-[0_24px_64px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.16),inset_0_-1px_2px_rgba(255,255,255,0.06)]"
      )}
    >
      <span
        aria-hidden
        className={cn(
          landingGlassSheen,
          "pointer-events-none absolute inset-0 rounded-[1.75rem]"
        )}
      />

      <div className="relative z-10 flex h-full flex-col px-6 py-7 sm:px-7 sm:py-8">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className={landingTitlePlan}>{name}</h3>
              {badge ? (
                <span
                  className={cn(
                    "relative isolate inline-flex overflow-hidden rounded-full px-2.5 py-0.5",
                    "border-0 bg-[#2563EB]/14 text-[11px] font-medium tracking-[-0.01em] text-[#1D4ED8]",
                    "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.65),0_1px_3px_rgba(37,99,235,0.12)]",
                    "backdrop-blur-md backdrop-saturate-[160%]",
                    "dark:bg-[#2563EB]/24 dark:text-[#93C5FD] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.14),0_1px_3px_rgba(37,99,235,0.2)]"
                  )}
                >
                  <span className="relative z-10">{badge}</span>
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-[inherit]"
                  >
                    <span
                      className={cn(
                        "absolute inset-y-[-20%] left-0 w-[70%]",
                        "bg-linear-to-r from-transparent via-white/60 to-transparent",
                        "animate-exur-logo-shimmer will-change-transform",
                        "dark:via-white/45"
                      )}
                    />
                  </span>
                </span>
              ) : null}
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>
          <span
            className={cn(
              "relative isolate mt-0.5 flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full transition-[background-color,box-shadow,color] duration-200",
              selected
                ? cn(
                    "bg-[#2563EB]/88 text-white",
                    "shadow-[inset_0_1px_1px_rgba(255,255,255,0.45),inset_0_-1px_2px_rgba(29,78,216,0.3),0_4px_14px_-2px_rgba(37,99,235,0.35)]",
                    "backdrop-blur-xl backdrop-saturate-[180%]"
                  )
                : "bg-white/70 text-transparent shadow-[inset_0_0_0_1px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] dark:bg-white/10 dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14)]"
            )}
            aria-hidden
          >
            {selected ? (
              <>
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-full bg-[linear-gradient(145deg,rgba(255,255,255,0.4)_0%,rgba(255,255,255,0.12)_42%,transparent_70%)]"
                />
                <CheckIcon
                  className="relative z-10 size-3.5"
                  strokeWidth={2.75}
                />
              </>
            ) : null}
          </span>
        </div>

        <div className="mt-5">
          <p
            className={cn(
              landingTitlePrice,
              "flex flex-wrap items-baseline gap-x-2.5 text-4xl sm:text-5xl"
            )}
          >
            {priceWas ? (
              <span className="text-2xl font-normal tracking-[-0.02em] text-muted-foreground/55 line-through decoration-muted-foreground/40">
                {priceWas}
              </span>
            ) : null}
            <span>
              {price}
              {showCadence ? (
                <span className="ms-1 text-lg font-normal text-muted-foreground">
                  {cadence}
                </span>
              ) : null}
            </span>
          </p>
          {isCurrent ? (
            <span className="mt-2 inline-flex rounded-full bg-foreground/5 px-2.5 py-1 text-[11px] font-medium tracking-[-0.01em] text-muted-foreground dark:bg-white/8">
              {currentLabel}
            </span>
          ) : null}
        </div>

        <div className="mt-7 flex-1 border-t border-foreground/6 pt-6 dark:border-white/10">
          <ul className="space-y-3 text-sm text-muted-foreground">
            {features.map((feature) => (
              <li key={`${planKey}-${feature}`} className="flex gap-3">
                <span
                  className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-foreground/5 text-foreground/55 dark:bg-white/8 dark:text-foreground/65"
                  aria-hidden
                >
                  <CheckIcon className="size-2.5" strokeWidth={2.5} />
                </span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  )
}
