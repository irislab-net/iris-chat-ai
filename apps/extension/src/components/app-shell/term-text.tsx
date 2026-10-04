"use client"

import * as React from "react"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { splitGlossarySegments } from "@/lib/chat/glossary-terms"
import { cn } from "@/lib/utils"

const termTriggerClassName = cn(
  "rounded-[2px] underline decoration-dotted decoration-muted-foreground/50 underline-offset-4",
  "cursor-help text-inherit transition-colors hover:decoration-muted-foreground/80",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/35 focus-visible:ring-offset-1"
)

type TermTextProps = {
  text: string
  className?: string
}

/**
 * Renders prose with glossary terms wrapped in Base UI tooltips.
 * Numeric / non-prose fields should stay plain — do not use this on prices.
 */
function TermText({ text, className }: TermTextProps) {
  const segments = React.useMemo(() => splitGlossarySegments(text), [text])

  if (!text) return null

  if (segments.length === 0 || segments.every((s) => s.type === "text")) {
    return <span className={className}>{text}</span>
  }

  return (
    <span className={className}>
      {segments.map((segment, index) => {
        if (segment.type === "text") {
          return (
            <React.Fragment key={`t-${index}`}>{segment.value}</React.Fragment>
          )
        }

        return (
          <Tooltip key={`g-${index}-${segment.term}`}>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  className={termTriggerClassName}
                  aria-label={`${segment.term}: ${segment.definition}`}
                />
              }
            >
              {segment.value}
            </TooltipTrigger>
            <TooltipContent
              side="top"
              sideOffset={6}
              className="max-w-66 flex-col items-start gap-0.5 py-2"
            >
              <span className="font-medium">{segment.term}</span>
              <span className="opacity-90">{segment.definition}</span>
            </TooltipContent>
          </Tooltip>
        )
      })}
    </span>
  )
}

export { TermText }
