"use client"

import * as React from "react"
import { ChevronRightIcon, LoaderCircleIcon, WrenchIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import type { ChatThinkingStep } from "@/lib/api/chat-sse"
import { cn } from "@/lib/utils"

function formatToolName(name: string) {
  return name.replace(/_/g, " ")
}

function stepsFromReasoning(reasoning?: string): ChatThinkingStep[] {
  if (!reasoning?.trim()) return []
  return reasoning
    .split(/\n\n+/)
    .map((text) => text.trim())
    .filter(Boolean)
    .map((text) => ({ type: "reasoning" as const, text }))
}

type ChatThinkingTraceProps = {
  steps?: ChatThinkingStep[]
  reasoning?: string
  live?: boolean
  className?: string
}

function ChatThinkingTrace({
  steps,
  reasoning,
  live = false,
  className,
}: ChatThinkingTraceProps) {
  const t = useTranslations("workspace.thinkingTrace")
  const resolvedSteps = React.useMemo(() => {
    if (steps?.length) return steps
    return stepsFromReasoning(reasoning)
  }, [steps, reasoning])

  if (!resolvedSteps.length && !live) return null

  const latestTool = [...resolvedSteps]
    .reverse()
    .find((step) => step.type === "tool")
  const summary = live
    ? latestTool
      ? t("usingTool", { tool: formatToolName(latestTool.name) })
      : t("live")
    : t("done")

  return (
    <Accordion className={cn("mb-3 w-full max-w-xl", className)}>
      <AccordionItem value="thinking" className="border-0">
        <AccordionTrigger
          className={cn(
            "gap-2 rounded-lg border-0 px-0 py-1.5 text-muted-foreground hover:no-underline hover:text-foreground",
            "**:data-[slot=accordion-trigger-icon]:hidden"
          )}
        >
          <span className="flex min-w-0 items-center gap-1.5 text-xs font-medium tracking-tight">
            {live ? (
              <LoaderCircleIcon
                className="size-3.5 shrink-0 animate-spin opacity-70"
                aria-hidden
              />
            ) : (
              <ChevronRightIcon
                className="size-3.5 shrink-0 opacity-70 transition-transform group-aria-expanded/accordion-trigger:rotate-90"
                aria-hidden
              />
            )}
            <span className="min-w-0 truncate">{summary}</span>
          </span>
        </AccordionTrigger>
        <AccordionContent className="pb-0">
          <div
            className="flex flex-col gap-2.5 border-s border-border/60 ps-3"
            role="list"
            aria-label={t("aria")}
          >
            {resolvedSteps.length === 0 && live ? (
              <p className="text-xs leading-5 text-muted-foreground">
                {t("waiting")}
              </p>
            ) : null}
            {resolvedSteps.map((step, index) =>
              step.type === "tool" ? (
                <div
                  key={`tool-${index}-${step.name}`}
                  role="listitem"
                  className="inline-flex w-fit max-w-full items-center gap-1.5 rounded-full bg-muted/50 px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
                >
                  <WrenchIcon className="size-3 shrink-0 opacity-70" aria-hidden />
                  <span className="min-w-0 truncate">
                    {t("usingTool", { tool: formatToolName(step.name) })}
                  </span>
                </div>
              ) : (
                <p
                  key={`reason-${index}`}
                  role="listitem"
                  className="whitespace-pre-wrap text-xs leading-5 text-muted-foreground"
                >
                  {step.text}
                </p>
              )
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

export { ChatThinkingTrace }
