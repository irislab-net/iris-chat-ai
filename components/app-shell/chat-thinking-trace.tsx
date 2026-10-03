"use client"

import * as React from "react"
import {
  ChevronRightIcon,
  LoaderCircleIcon,
  SparklesIcon,
  WrenchIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { Streamdown } from "streamdown"

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

const thinkingMarkdownClass = cn(
  "thinking-md min-w-0 text-[12px] leading-relaxed text-muted-foreground/85",
  "space-y-1.5 whitespace-normal [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
  "[&_p]:mb-1.5 [&_p]:leading-relaxed [&_p:last-child]:mb-0",
  "[&_strong]:font-semibold [&_strong]:text-foreground/75",
  "[&_em]:italic",
  "[&_code]:rounded [&_code]:bg-foreground/5 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.92em]",
  "[&_ul]:my-1 [&_ul]:list-disc [&_ul]:ps-4 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:ps-4",
  "[&_li]:leading-relaxed",
  "[&_a]:underline [&_a]:underline-offset-2"
)

function ThinkingMarkdown({ text }: { text: string }) {
  return (
    <Streamdown
      className={thinkingMarkdownClass}
      dir="auto"
      mode="static"
      controls={false}
      linkSafety={{ enabled: true }}
    >
      {text}
    </Streamdown>
  )
}

type ChatThinkingTraceProps = {
  steps?: ChatThinkingStep[]
  reasoning?: string
  live?: boolean
  /** Frozen wall-clock seconds for completed turns (ChatGPT-style receipt). */
  durationSec?: number
  className?: string
}

function ChatThinkingTrace({
  steps,
  reasoning,
  live = false,
  durationSec,
  className,
}: ChatThinkingTraceProps) {
  const t = useTranslations("workspace.thinkingTrace")
  const resolvedSteps = React.useMemo(() => {
    if (steps?.length) return steps
    return stepsFromReasoning(reasoning)
  }, [steps, reasoning])

  const startedAtRef = React.useRef<number | null>(null)
  const [liveElapsedSec, setLiveElapsedSec] = React.useState<number | null>(
    null
  )
  const [frozenSec, setFrozenSec] = React.useState<number | null>(
    durationSec && durationSec > 0 ? durationSec : null
  )

  React.useEffect(() => {
    if (durationSec && durationSec > 0) {
      setFrozenSec(durationSec)
    }
  }, [durationSec])

  React.useEffect(() => {
    if (live) {
      if (startedAtRef.current == null) {
        startedAtRef.current = Date.now()
      }
      const tick = () => {
        const start = startedAtRef.current
        if (!start) return
        setLiveElapsedSec(
          Math.max(1, Math.round((Date.now() - start) / 1000))
        )
      }
      tick()
      const id = window.setInterval(tick, 250)
      return () => window.clearInterval(id)
    }

    if (startedAtRef.current != null) {
      const finalSec = Math.max(
        1,
        Math.round((Date.now() - startedAtRef.current) / 1000)
      )
      setFrozenSec((prev) =>
        durationSec && durationSec > 0 ? durationSec : (prev ?? finalSec)
      )
      setLiveElapsedSec(null)
    }
    return undefined
  }, [live, durationSec])

  if (!resolvedSteps.length && !live) return null

  const latestTool = [...resolvedSteps]
    .reverse()
    .find((step) => step.type === "tool")

  const receiptSec = frozenSec ?? durationSec ?? null
  const summary = live
    ? latestTool
      ? t("usingTool", { tool: formatToolName(latestTool.name) })
      : liveElapsedSec != null
        ? t("liveWithDuration", { seconds: liveElapsedSec })
        : t("live")
    : receiptSec != null && receiptSec > 0
      ? t("doneWithDuration", { seconds: receiptSec })
      : t("done")

  return (
    <Accordion
      key={live ? "thinking-live" : "thinking-done"}
      defaultValue={live ? ["thinking"] : []}
      className={cn(chatThinkingShellClass, className)}
      data-chat-thinking=""
      data-live={live ? "" : undefined}
    >
      <AccordionItem value="thinking" className="border-0">
        <AccordionTrigger
          className={cn(
            chatThinkingRowClass,
            "group/thinking border-0 py-1 hover:text-foreground/80 hover:no-underline",
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
            className="mt-1.5 flex flex-col gap-2.5 border-s border-border/45 ps-3"
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
                  className="inline-flex w-fit max-w-full items-center gap-1.5 rounded-full bg-foreground/4 px-2.5 py-1 text-[12px] font-medium text-muted-foreground"
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
                <div
                  key={`reason-${index}`}
                  role="listitem"
                  className="min-w-0"
                >
                  <ThinkingMarkdown text={step.text} />
                </div>
              )
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

export { ChatThinkingTrace }
