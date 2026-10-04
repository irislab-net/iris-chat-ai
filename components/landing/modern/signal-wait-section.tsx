"use client"

import { ArrowUpIcon } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"

import { ChatSignalCard } from "@/components/app-shell/chat-signal-card"
import { HeroLiquidGlassBg } from "@/components/landing/modern/hero-liquid-glass-bg"
import { ScrollReveal } from "@/components/landing/modern/scroll-reveal"
import { SectionHeader } from "@/components/landing/modern/sphere-ui"
import { Input } from "@/components/ui/input"
import { SIGNAL_WAIT_TICKET } from "@/lib/landing-modern-data"
import { useReducedMotion } from "@/lib/landing-motion"
import { localeDirection } from "@/lib/i18n/locale"
import {
  landingAfterHeader,
  landingCardRadius,
  landingDisplay,
  landingGlassBlueSheen,
  landingGlassBubbleAi,
  landingGlassBubbleUser,
  landingGlassOrb,
  landingGlassPill,
  landingGlassSheen,
  landingGlassSurface,
  landingSection,
  landingSignalWaitComposeGrid,
} from "@/lib/landing-modern-styles"
import {
  initSignalWaitDemo,
  type SignalWaitScenario,
} from "@/lib/signal-wait-story-engine"
import { cn } from "@/lib/utils"

function GlassSheen({ className }: { className?: string }) {
  return <span aria-hidden className={cn(landingGlassSheen, className)} />
}

/** Dual-layer liquid-glass avatar (matches hero compose). */
function GlassAvatar({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      aria-hidden
      className={cn(
        landingGlassPill,
        "inline-flex size-8 shrink-0 items-center justify-center rounded-full p-0.5",
        "shadow-[0_10px_28px_rgba(15,23,42,0.1),inset_0_1px_1px_rgba(255,255,255,0.98),inset_0_-1px_2px_rgba(255,255,255,0.35)]",
        "dark:shadow-[0_10px_28px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.16),inset_0_-1px_2px_rgba(255,255,255,0.05)]",
        className
      )}
    >
      <GlassSheen className="rounded-full" />
      <span
        aria-hidden
        className={cn(landingGlassBlueSheen, "rounded-full opacity-70")}
      />
      <span
        className={cn(
          landingGlassOrb,
          "relative z-10 flex size-full items-center justify-center overflow-hidden rounded-full bg-white/55 text-[9px] font-semibold tracking-wide text-muted-foreground dark:bg-white/12"
        )}
      >
        <GlassSheen className="rounded-full" />
        <span className="relative z-10">{children}</span>
      </span>
    </span>
  )
}

function UserBubble({
  children,
  youLabel,
}: {
  children: string
  youLabel: string
}) {
  return (
    <div className="flex h-full items-center justify-end gap-2.5">
      <div
        className={cn(
          landingGlassBubbleUser,
          "max-w-[min(100%,20rem)] px-3.5 py-2.5 text-start text-[13px] leading-snug text-foreground sm:max-w-md sm:px-4 sm:py-3 sm:text-sm"
        )}
      >
        <GlassSheen />
        <span className="relative z-10">{children}</span>
      </div>
      <GlassAvatar className="text-[10px] font-medium tracking-wide">
        {youLabel}
      </GlassAvatar>
    </div>
  )
}

function AiBubble({
  children,
  typing,
}: {
  children: string
  typing?: boolean
}) {
  return (
    <div className="flex h-full items-start gap-2.5">
      <GlassAvatar className="mt-0.5">EX</GlassAvatar>
      <div
        className={cn(
          landingGlassBubbleAi,
          "line-clamp-3 max-w-[min(100%,20rem)] px-3.5 py-2.5 text-start text-[13px] leading-snug text-foreground/90 sm:max-w-md sm:px-4 sm:py-3 sm:text-sm"
        )}
      >
        <GlassSheen />
        <span className="relative z-10">
          {children}
          {typing ? (
            <span
              className="ms-0.5 inline-block h-[1.1em] w-0.5 translate-y-0.5 animate-pulse bg-muted-foreground align-[-2px]"
              aria-hidden
            />
          ) : null}
        </span>
      </div>
    </div>
  )
}

function SignalResult({
  ticket,
}: {
  ticket: typeof SIGNAL_WAIT_TICKET & {
    setup: string
    thesis: string
    timeHorizon: string
    entryReason: string
    stopLossReason: string
    takeProfitReason: string
  }
}) {
  return (
    <div className="landing-signal-glass relative flex h-full min-h-0 w-full origin-top items-start justify-center overflow-visible">
      <ChatSignalCard ticket={ticket} className="mt-0 w-full" tone="neutral" />
    </div>
  )
}

function HoldResult({ label, reason }: { label: string; reason: string }) {
  return (
    <div className="flex h-full items-center justify-center px-2">
      <div
        className={cn(
          landingGlassSurface,
          "w-full max-w-sm rounded-[1.5rem] bg-white/42 px-6 py-8 text-center dark:bg-white/8"
        )}
      >
        <GlassSheen className="rounded-[1.5rem]" />
        <p
          className={cn(
            landingDisplay,
            "relative z-10 text-[2rem] leading-none tracking-[-0.04em] text-foreground/90 sm:text-4xl"
          )}
        >
          {label}.
        </p>
        <p className="relative z-10 mt-3 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
          {reason}
        </p>
      </div>
    </div>
  )
}

export function SignalWaitSection() {
  const t = useTranslations("modern.signalWait")
  const textDir = localeDirection(useLocale())
  const reducedMotion = useReducedMotion()
  const sectionRef = useRef<HTMLElement>(null)
  const userRef = useRef<HTMLDivElement>(null)
  const replyRef = useRef<HTMLDivElement>(null)
  const tradeResultRef = useRef<HTMLDivElement>(null)
  const holdResultRef = useRef<HTMLDivElement>(null)
  const sendRef = useRef<HTMLSpanElement>(null)

  const tradeQuestion = t("tradeQuestion")
  const holdQuestion = t("hold.question")
  const holdAnswer = t("hold.answer")
  const holdLabel = t("hold.label")
  const holdReason = t("hold.reason")
  const youLabel = t("you")
  const composerPlaceholder = t("composerPlaceholder")

  const [draft, setDraft] = useState("")
  const [userText, setUserText] = useState<string | null>(tradeQuestion)
  const [replyText, setReplyText] = useState<string | null>(null)
  const [scenario, setScenario] = useState<SignalWaitScenario>("trade")

  // Landing demo keeps levels + setup; drop per-level reasons so the card stays light.
  const ticket = useMemo(
    () => ({
      ...SIGNAL_WAIT_TICKET,
      setup: t("ticket.setup"),
      thesis: t("ticket.thesis"),
      timeHorizon: t("ticket.timeHorizon"),
      entryReason: "",
      stopLossReason: "",
      takeProfitReason: "",
    }),
    [t]
  )

  const shownUserText = reducedMotion ? tradeQuestion : userText
  const shownReplyText = reducedMotion ? null : replyText
  const shownDraft = reducedMotion ? "" : draft
  const replyTyping =
    !reducedMotion && replyText != null && replyText !== holdAnswer

  useLayoutEffect(() => {
    if (reducedMotion) return

    const section = sectionRef.current
    const user = userRef.current
    const reply = replyRef.current
    const tradeResult = tradeResultRef.current
    const holdResult = holdResultRef.current
    const send = sendRef.current
    if (!section || !user || !reply || !tradeResult || !holdResult || !send) {
      return
    }

    return initSignalWaitDemo(
      { observe: section, user, reply, tradeResult, holdResult, send },
      {
        onDraft: setDraft,
        onUserText: setUserText,
        onReplyText: setReplyText,
        onScenario: setScenario,
        questionFor: (id) => (id === "trade" ? tradeQuestion : holdQuestion),
        answerFor: (id) => (id === "hold" ? holdAnswer : null),
      },
      false
    )
  }, [reducedMotion, tradeQuestion, holdQuestion, holdAnswer])

  return (
    <section
      ref={sectionRef}
      id="signal-wait"
      className={cn(
        landingSection,
        // Full-bleed in the page column: no side inset, no clip on shadows/bubbles.
        "relative isolate overflow-visible rounded-[2.5rem] py-16 sm:py-20 lg:py-24"
      )}
    >
      <ScrollReveal>
        <SectionHeader title={t("title")} subtitle={t("subtitle")} />
      </ScrollReveal>

      <ScrollReveal className={cn("w-full", landingAfterHeader)}>
        <div
          dir={textDir}
          className={cn(
            "relative isolate overflow-hidden",
            landingCardRadius,
            // Fixed shell: ChatSignalCard + chat row + composer must fit without clipping.
            "flex h-136 flex-col bg-white/40 text-foreground shadow-[0_20px_60px_rgba(15,23,42,0.05)] backdrop-blur-2xl sm:h-148 lg:h-156 dark:bg-white/6 dark:shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
          )}
        >
          <HeroLiquidGlassBg tone="blue" />

          <div
            className={cn(
              landingSignalWaitComposeGrid,
              "relative z-10 mx-auto w-full max-w-xl px-4 py-5 sm:max-w-2xl sm:px-8 sm:py-8 lg:px-10 lg:py-9"
            )}
          >
            <div className="relative flex min-h-0 flex-col gap-3.5 sm:gap-4">
              <div
                ref={userRef}
                className="min-h-0 shrink-0"
                aria-hidden={!shownUserText}
              >
                <UserBubble youLabel={youLabel}>
                  {shownUserText ?? "\u00A0"}
                </UserBubble>
              </div>

              <div
                ref={replyRef}
                className={cn(
                  "min-h-0 shrink-0",
                  !shownReplyText &&
                    "pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0"
                )}
                aria-hidden={!shownReplyText}
              >
                {shownReplyText ? (
                  <AiBubble typing={replyTyping}>{shownReplyText}</AiBubble>
                ) : null}
              </div>
            </div>

            <div className="relative min-h-0">
              {reducedMotion ? (
                <SignalResult ticket={ticket} />
              ) : (
                <>
                  <div
                    ref={tradeResultRef}
                    className="absolute inset-0"
                    aria-hidden={scenario !== "trade"}
                  >
                    <SignalResult ticket={ticket} />
                  </div>
                  <div
                    ref={holdResultRef}
                    className="absolute inset-0 opacity-0"
                    aria-hidden={scenario !== "hold"}
                  >
                    <HoldResult label={holdLabel} reason={holdReason} />
                  </div>
                </>
              )}
            </div>

            <div
              className={cn(
                "relative z-30 flex h-full min-h-0 items-center gap-2 overflow-visible px-2 py-1.5 sm:px-3 sm:py-2",
                landingGlassPill
              )}
            >
              <GlassSheen className="rounded-full" />
              <span
                aria-hidden
                className={cn(landingGlassBlueSheen, "rounded-full opacity-50")}
              />
              <Input
                type="text"
                dir={textDir}
                value={shownDraft}
                readOnly
                tabIndex={-1}
                placeholder={composerPlaceholder}
                className="relative z-10 h-10 min-w-0 flex-1 border-0 bg-transparent px-2 text-sm text-foreground shadow-none placeholder:text-muted-foreground/90 read-only:cursor-default focus-visible:ring-0 sm:px-3 sm:text-base"
                aria-label={composerPlaceholder}
              />
              <span
                ref={sendRef}
                className={cn(
                  "relative z-10 inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full",
                  "bg-[#2563EB]/90 text-white",
                  "shadow-[0_12px_40px_rgba(37,99,235,0.34),inset_0_1px_1px_rgba(255,255,255,0.38),inset_0_-1px_2px_rgba(29,78,216,0.28)]",
                  "backdrop-blur-2xl"
                )}
                aria-hidden
              >
                <span
                  aria-hidden
                  className={cn(landingGlassBlueSheen, "rounded-full opacity-80")}
                />
                <ArrowUpIcon className="relative z-10 size-4" />
              </span>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  )
}
