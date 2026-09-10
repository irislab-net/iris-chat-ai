"use client"

import * as React from "react"

import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  assessPositionHealth,
  type PositionHealthLevel,
} from "@/lib/chart/position-health"
import type { Position } from "@/lib/trading/types"
import { cn } from "@/lib/utils"

const levelStyles: Record<
  PositionHealthLevel,
  { badge: string; dot: string }
> = {
  healthy: {
    badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  watch: {
    badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  at_risk: {
    badge: "bg-red-500/10 text-red-700 dark:text-red-400",
    dot: "bg-red-500",
  },
}

function PositionHealthBadge({
  position,
  mark,
  className,
  compact,
}: {
  position: Position
  mark: number
  className?: string
  compact?: boolean
}) {
  const health = React.useMemo(
    () => assessPositionHealth(position, mark),
    [position, mark]
  )
  const styles = levelStyles[health.level]

  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <span
              className={cn(
                "inline-block size-2 shrink-0 rounded-full",
                styles.dot,
                className
              )}
              aria-label={`Position health: ${health.label}`}
            />
          }
        />
        <TooltipContent side="top">{health.detail}</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Badge
            variant="secondary"
            className={cn(
              "h-5 border-0 px-1.5 text-[9px] font-semibold uppercase tracking-wide",
              styles.badge,
              className
            )}
          >
            {health.label}
          </Badge>
        }
      />
      <TooltipContent side="top">{health.detail}</TooltipContent>
    </Tooltip>
  )
}

export { PositionHealthBadge, assessPositionHealth }
