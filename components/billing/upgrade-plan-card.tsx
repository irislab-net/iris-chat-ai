"use client"

import { CheckIcon } from "lucide-react"

import type { PlanKey } from "@/lib/billing/catalog"
import { parsePriceAmount } from "@/lib/billing/prices"
import {
  landingGlassBlueSheen,
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
    <div className="relative h-full">
      {badge ? (
        <div className="absolute inset-x-0 -top-3 z-20 flex justify-center">
          <span className="rounded-full bg-white/75 px-2.5 py-1 font-mono text-[9px] font-medium tracking-[0.18em] text-muted-foreground uppercase shadow-[0_4px_12px_rgba(15,23,42,0.04)] dark:bg-white/10">
            {badge}
          </span>
        </div>
      ) : null}

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
          "relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[1.75rem] transition-shadow",
          "bg-white/38 shadow-[0_16px_48px_rgba(15,23,42,0.08),inset_0_1px_1px_rgba(255,255,255,0.92),inset_0_-1px_2px_rgba(255,255,255,0.28)] backdrop-blur-2xl dark:bg-white/8 dark:shadow-[0_16px_48px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.12),inset_0_-1px_2px_rgba(255,255,255,0.04)]",
          featured &&
            !selected &&
            "bg-white/55 shadow-[0_28px_80px_rgba(37,99,235,0.1),inset_0_1px_1px_rgba(255,255,255,0.95)] ring-1 ring-[#2563EB]/10 dark:bg-white/10",
          selected &&
            "bg-white/58 shadow-[0_28px_80px_rgba(37,99,235,0.16),inset_0_1px_1px_rgba(255,255,255,0.96)] ring-1 ring-[#2563EB]/35 dark:bg-white/12 dark:ring-[#2563EB]/40"
        )}
      >
        {(featured || selected) && (
          <span
            aria-hidden
            className={cn(
              landingGlassBlueSheen,
              "pointer-events-none absolute inset-0 opacity-40"
            )}
          />
        )}
        <span
          aria-hidden
          className={cn(
            landingGlassSheen,
            "pointer-events-none absolute inset-0 rounded-[1.75rem]"
          )}
        />

        <div className="relative z-10 flex h-full flex-col p-7 sm:p-8">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <h3 className={landingTitlePlan}>{name}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            </div>
            <span
              className={cn(
                "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full transition-colors",
                selected
                  ? "bg-[#2563EB] text-white shadow-[0_4px_12px_rgba(37,99,235,0.35)]"
                  : "bg-white/70 text-transparent shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:bg-white/10"
              )}
              aria-hidden
            >
              {selected ? (
                <CheckIcon className="size-3" strokeWidth={3} />
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
              <span className="mt-2 inline-flex rounded-full bg-white/75 px-2.5 py-1 text-[10px] font-medium tracking-wide text-muted-foreground uppercase dark:bg-white/10">
                {currentLabel}
              </span>
            ) : null}
          </div>

          <div className="mt-7 flex-1 border-t border-white/55 pt-6 dark:border-white/10">
            <ul className="space-y-3 text-sm text-muted-foreground">
              {features.map((feature) => (
                <li key={`${planKey}-${feature}`} className="flex gap-3">
                  <span
                    className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-white/70 text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:bg-white/10 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                    aria-hidden
                  >
                    <CheckIcon className="size-2.5" strokeWidth={2} />
                  </span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </article>
    </div>
  )
}
