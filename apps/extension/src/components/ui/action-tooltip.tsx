"use client"

import type { ReactElement } from "react"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type ActionTooltipProps = {
  label: React.ReactNode
  side?: "top" | "bottom" | "left" | "right" | "inline-start" | "inline-end"
  children: ReactElement
}

/** Design-system tooltip wrapper for icon buttons and other compact controls. */
function ActionTooltip({
  label,
  side = "top",
  children,
}: ActionTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
  )
}

export { ActionTooltip }
