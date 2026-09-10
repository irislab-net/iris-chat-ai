"use client"

import {
  BetweenHorizontalStartIcon,
  PencilLineIcon,
  SparklesIcon,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type ChartOverlayToolId = "ghost" | "indicators" | "brackets"

export type ChartOverlayToolState = {
  id: ChartOverlayToolId
  label: string
  available: boolean
  enabled: boolean
  onToggle: () => void
}

const OVERLAY_ICONS: Record<ChartOverlayToolId, LucideIcon> = {
  ghost: SparklesIcon,
  indicators: PencilLineIcon,
  brackets: BetweenHorizontalStartIcon,
}

type ChartOverlayTogglesProps = {
  tools: ChartOverlayToolState[]
  className?: string
}

function ChartOverlayToggles({ tools, className }: ChartOverlayTogglesProps) {
  const visible = tools.filter((tool) => tool.available)
  if (visible.length === 0) return null

  return (
    <div
      className={cn("flex shrink-0 items-center gap-0.5", className)}
      role="group"
      aria-label="Chart overlays"
    >
      {visible.map((tool) => {
        const Icon = OVERLAY_ICONS[tool.id]
        return (
          <Button
            key={tool.id}
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={tool.label}
            aria-pressed={tool.enabled}
            title={tool.label}
            className={cn(
              "size-7 rounded-md",
              tool.enabled
                ? "bg-primary/12 text-primary hover:bg-primary/18 hover:text-primary"
                : "text-muted-foreground/55 hover:bg-muted/50 hover:text-muted-foreground"
            )}
            onClick={tool.onToggle}
          >
            <Icon className="size-3.5" />
          </Button>
        )
      })}
    </div>
  )
}

export { ChartOverlayToggles }
