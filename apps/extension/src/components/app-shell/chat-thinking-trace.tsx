"use client"

import * as React from "react"
import {
  ChevronRightIcon,
  LoaderCircleIcon,
  SparklesIcon,
  WrenchIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"

import {
  chatThinkingIconMutedClass,
  chatThinkingLabelClass,
  chatThinkingRowClass,
  chatThinkingShellClass,
  chatThinkingShimmerClass,
  chatThinkingSpinnerClass,
} from "@/components/app-shell/chat-thinking-styles"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import type { ChatThinkingStep } from "@/lib/api/chat-sse"
import { cn } from "@/lib/utils"

/** `get_market_state` → `Market state` */
function formatToolName(name: string) {
  const spaced = name.replace(/[_-]+/g, " ").trim()
  const stripped = spaced.replace(
    /^(get|fetch|list|load|query|read|search|use)\s+/i,
    ""
  )
  const label = stripped || spaced
  return label
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
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
    <Accordion
      className={cn(chatThinkingShellClass, className)}
      data-chat-thinking=""
      data-live={live ? "" : undefined}
    >
      <AccordionItem value="thinking" className="border-0">
        <AccordionTrigger
          className={cn(
            chatThinkingRowClass,
            "group/thinking border-0 hover:text-foreground/80 hover:no-underline",
            "**:data-[slot=accordion-trigger-icon]:hidden"
          )}
        >
          <span className="flex min-w-0 flex-1 items-center gap-2">
            {live ? (
              <LoaderCircleIcon
                className={chatThinkingSpinnerClass}
                aria-hidden
              />
            ) : (
              <SparklesIcon
                className={chatThinkingIconMutedClass}
                aria-hidden
              />
            )}
            <span
              className={cn(
                chatThinkingLabelClass,
                "text-current",
                live && chatThinkingShimmerClass
              )}
            >
              {summary}
            </span>
            <ChevronRightIcon
              className="size-3.5 shrink-0 opacity-40 transition-transform duration-200 ease-out group-aria-expanded/accordion-trigger:rotate-90"
              aria-hidden
            />
          </span>
        </AccordionTrigger>
        <AccordionContent className="px-1 pb-0">
          <div
            className="mt-1.5 flex flex-col gap-2 border-s border-border/45 ps-3"
            role="list"
            aria-label={t("aria")}
          >
            {resolvedSteps.length === 0 && live ? (
              <p className="text-[12px] leading-5 text-muted-foreground/80">
                {t("waiting")}
              </p>
            ) : null}
            {resolvedSteps.map((step, index) =>
              step.type === "tool" ? (
                <div
                  key={`tool-${index}-${step.name}`}
                  role="listitem"
                  className="inline-flex w-fit max-w-full items-center gap-1.5 rounded-full bg-foreground/[0.04] px-2.5 py-1 text-[12px] font-medium text-muted-foreground"
                >
                  <WrenchIcon
                    className="size-3 shrink-0 opacity-70"
                    aria-hidden
                  />
                  <span className="min-w-0 truncate">
                    {formatToolName(step.name)}
                  </span>
                </div>
              ) : (
                <p
                  key={`reason-${index}`}
                  role="listitem"
                  className="text-[12px] leading-relaxed whitespace-pre-wrap text-muted-foreground/85"
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
