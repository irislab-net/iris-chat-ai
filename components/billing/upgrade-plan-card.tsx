"use client"

import { CheckIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { PlanKey } from "@/lib/billing/catalog"
import { parsePriceAmount } from "@/lib/billing/prices"
import { cn } from "@/lib/utils"

type UpgradePlanCardProps = {
  planKey: PlanKey
  name: string
  description: string
  price: string
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
    <div className="relative">
      {badge ? (
        <div className="absolute inset-x-0 -top-3 z-20 flex justify-center">
          <Badge className="rounded-full px-3 shadow-sm">{badge}</Badge>
        </div>
      ) : null}

      <Card
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
          "cursor-pointer border bg-card/90 py-0 transition-all hover:border-foreground/30",
          featured && !selected && "border-foreground/25 bg-muted/20",
          selected && "border-foreground shadow-[0_0_0_1px_var(--foreground)]"
        )}
      >
        <CardHeader className="gap-4 border-b border-border/50 px-5 pt-6 pb-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <CardTitle className="text-xl font-semibold tracking-tight">
                {name}
              </CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                {description}
              </CardDescription>
            </div>
            <span
              className={cn(
                "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                selected
                  ? "border-foreground bg-foreground text-background"
                  : "border-border/80 bg-background"
              )}
              aria-hidden
            >
              {selected ? <CheckIcon className="size-3" strokeWidth={3} /> : null}
            </span>
          </div>

          <div className="flex flex-wrap items-end gap-x-2 gap-y-1">
            <span className="text-3xl font-semibold tracking-tight">{price}</span>
            {showCadence ? (
              <span className="pb-0.5 text-sm text-muted-foreground">{cadence}</span>
            ) : null}
            {isCurrent ? (
              <Badge variant="outline" className="mb-0.5 rounded-full">
                {currentLabel}
              </Badge>
            ) : null}
          </div>
        </CardHeader>

        <CardContent className="px-5 py-5">
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            {features.map((feature) => (
              <li key={`${planKey}-${feature}`} className="flex gap-2.5">
                <CheckIcon
                  className="mt-0.5 size-3.5 shrink-0 text-foreground/70"
                  strokeWidth={2.5}
                />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
