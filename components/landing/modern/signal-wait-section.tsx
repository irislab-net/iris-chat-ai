"use client"

import { ArrowUpIcon } from "lucide-react"
import { useLayoutEffect, useRef, useState } from "react"

import { ChatSignalCard } from "@/components/app-shell/chat-signal-card"
import { HeroLiquidGlassBg } from "@/components/landing/modern/hero-liquid-glass-bg"
import { ScrollReveal } from "@/components/landing/modern/scroll-reveal"
import { SectionHeader } from "@/components/landing/modern/sphere-ui"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  SIGNAL_WAIT_HOLD,
  SIGNAL_WAIT_SECTION,
  SIGNAL_WAIT_TICKET,
  SIGNAL_WAIT_TRADE_BEAT,
} from "@/lib/landing-modern-data"
import { useReducedMotion } from "@/lib/landing-motion"
import {
  landingAfterHeader,
  landingCardRadius,
  landingDisplay,
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

function UserBubble({ children }: { children: string }) {
  return (
    <div className="flex h-full items-center justify-end gap-2.5">
      <div
        className={cn(
          landingGlassBubbleUser,
          "max-w-[min(100%,20rem)] px-3.5 py-2.5 text-left text-[13px] leading-snug text-foreground sm:max-w-md sm:px-4 sm:py-3 sm:text-sm"
        )}
      >
        {children}
      </div>
      <span
        className={cn(
          landingGlassOrb,
          "size-8 shrink-0 text-[10px] font-medium text-muted-foreground"
        )}
      >
        You
      </span>
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
      <span
        className={cn(
          landingGlassOrb,
          "mt-0.5 size-8 shrink-0 text-[9px] font-semibold tracking-wide text-muted-foreground"
        )}
      >
        EX
      </span>
      <div
        className={cn(
          landingGlassBubbleAi,
          "line-clamp-3 max-w-[min(100%,20rem)] px-3.5 py-2.5 text-left text-[13px] leading-snug text-foreground/90 sm:max-w-md sm:px-4 sm:py-3 sm:text-sm"
        )}
      >
        {children}
        {typing ? (
          <span
            className="ml-0.5 inline-block h-[1.1em] w-0.5 translate-y-0.5 animate-pulse bg-muted-foreground align-[-2px]"
            aria-hidden
          />
        ) : null}
      </div>
    </div>
  )
}

function SignalResult() {
  return (
    <div className="relative flex h-full min-h-0 w-full items-start justify-center overflow-visible">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-4 -inset-y-2 rounded-[2rem] bg-[#2563EB]/10 blur-2xl dark:bg-[#2563EB]/18 sm:-inset-x-6 sm:-inset-y-4"
      />
      <div
        className={cn(
          landingGlassSurface,
          "relative w-full origin-top scale-[0.92] overflow-visible rounded-[1.5rem] bg-white/55 p-1 shadow-[0_24px_56px_-28px_rgba(37,99,235,0.26),inset_0_1px_1px_rgba(255,255,255,0.95)] sm:scale-100 sm:rounded-[1.75rem] sm:p-1.5 dark:bg-white/10 dark:shadow-[0_28px_64px_-24px_rgba(0,0,0,0.55),inset_0_1px_1px_rgba(255,255,255,0.12)]"
        )}
      >
        <span
          aria-hidden
          className={cn(landingGlassSheen, "rounded-[1.4rem] sm:rounded-[1.65rem]")}
        />
        <div
          className={cn(
            "relative z-10",
            "[&_article_header_h3]:text-[1.2rem] sm:[&_article_header_h3]:text-[1.5rem]",
            "[&_.grid.grid-cols-3_p.tabular-nums]:text-[1.25rem] sm:[&_.grid.grid-cols-3_p.tabular-nums]:text-[1.7rem]",
            "[&_.grid.grid-cols-3_p.tabular-nums]:font-bold [&_.grid.grid-cols-3_p.tabular-nums]:leading-none",
            "[&_.grid.grid-cols-3_p.tabular-nums]:tracking-[-0.04em]",
            "[&_.grid.grid-cols-3_p.tabular-nums]:[text-shadow:0_1px_0_rgba(255,255,255,0.85),0_0_28px_rgba(37,99,235,0.28)]",
            "dark:[&_.grid.grid-cols-3_p.tabular-nums]:[text-shadow:0_1px_0_rgba(255,255,255,0.12),0_0_32px_rgba(37,99,235,0.45)]",
            "[&_.grid.grid-cols-3>div]:px-2 [&_.grid.grid-cols-3>div]:py-3 sm:[&_.grid.grid-cols-3>div]:px-3 sm:[&_.grid.grid-cols-3>div]:py-4",
            "[&_.grid.grid-cols-3]:gap-2 sm:[&_.grid.grid-cols-3]:gap-3",
            "[&_.grid.grid-cols-2_p.tabular-nums]:text-[14px] [&_.grid.grid-cols-2_p.tabular-nums]:font-semibold sm:[&_.grid.grid-cols-2_p.tabular-nums]:text-base",
            "[&_article]:rounded-[1.25rem] [&_article]:bg-white/70 [&_article]:shadow-none sm:[&_article]:rounded-[1.35rem] dark:[&_article]:bg-white/8"
          )}
        >
          <ChatSignalCard ticket={SIGNAL_WAIT_TICKET} className="mt-0" />
        </div>
      </div>
    </div>
  )
}

function HoldResult() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-2 text-center">
      <p
        className={cn(
          landingDisplay,
          "text-[2rem] leading-none tracking-[-0.04em] text-foreground/90 sm:text-4xl"
        )}
      >
        {SIGNAL_WAIT_HOLD.label}.
      </p>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
        {SIGNAL_WAIT_HOLD.reason}
      </p>
    </div>
  )
}

export function SignalWaitSection() {
  const reducedMotion = useReducedMotion()
  const rootRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)
  const replyRef = useRef<HTMLDivElement>(null)
  const tradeResultRef = useRef<HTMLDivElement>(null)
  const holdResultRef = useRef<HTMLDivElement>(null)
  const sendRef = useRef<HTMLSpanElement>(null)

  const [draft, setDraft] = useState("")
  const [userText, setUserText] = useState<string | null>(null)
  const [replyText, setReplyText] = useState<string | null>(null)
  const [scenario, setScenario] = useState<SignalWaitScenario>("trade")

  const shownUserText = reducedMotion
    ? SIGNAL_WAIT_TRADE_BEAT.question
    : userText
  const shownReplyText = reducedMotion ? null : replyText
  const shownDraft = reducedMotion ? "" : draft
  const replyTyping =
    !reducedMotion &&
    replyText != null &&
    replyText !== SIGNAL_WAIT_HOLD.answer

  useLayoutEffect(() => {
    if (reducedMotion) return

    const root = rootRef.current
    const user = userRef.current
    const reply = replyRef.current
    const tradeResult = tradeResultRef.current
    const holdResult = holdResultRef.current
    const send = sendRef.current
    if (!root || !user || !reply || !tradeResult || !holdResult || !send) {
      return
    }

    return initSignalWaitDemo(
      { root, user, reply, tradeResult, holdResult, send },
      {
        onDraft: setDraft,
        onUserText: setUserText,
        onReplyText: setReplyText,
        onScenario: setScenario,
        questionFor: (id) =>
          id === "trade"
            ? SIGNAL_WAIT_TRADE_BEAT.question
            : SIGNAL_WAIT_HOLD.question,
        answerFor: (id) => (id === "hold" ? SIGNAL_WAIT_HOLD.answer : null),
      },
      false
    )
  }, [reducedMotion])

  return (
    <section
      id="signal-wait"
      className={cn(
        landingSection,
        // Full-bleed in the page column: no side inset, no clip on shadows/bubbles.
        "relative isolate overflow-visible rounded-[2.5rem] py-16 sm:py-20 lg:py-24"
      )}
    >
      <ScrollReveal>
        <SectionHeader
          title={SIGNAL_WAIT_SECTION.title}
          subtitle={SIGNAL_WAIT_SECTION.subtitle}
        />
      </ScrollReveal>

      <ScrollReveal className={cn("w-full", landingAfterHeader)}>
        <div
          ref={rootRef}
          className={cn(
            "relative isolate overflow-visible",
            landingCardRadius,
            // Fixed height only — never grows/shrinks with beats.
            "flex h-[38rem] flex-col bg-white/40 text-foreground shadow-[0_28px_80px_rgba(15,23,42,0.07)] backdrop-blur-2xl sm:h-[40rem] dark:bg-white/6 dark:shadow-[0_28px_80px_rgba(0,0,0,0.45)] lg:h-[42rem]"
          )}
        >
          <HeroLiquidGlassBg tone="blue" />

          <div
            className={cn(
              landingSignalWaitComposeGrid,
              "relative z-10 mx-auto w-full max-w-xl px-4 py-6 sm:max-w-2xl sm:px-8 sm:py-9 lg:px-10 lg:py-10"
            )}
          >
              {/* Slot 1 — user + EX (tight; no empty reply gap on trade) */}
              <div className="relative flex min-h-0 flex-col gap-3.5 sm:gap-4">
                <div
                  ref={userRef}
                  className="min-h-0 shrink-0"
                  aria-hidden={!shownUserText}
                >
                  <UserBubble>{shownUserText ?? "\u00A0"}</UserBubble>
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

              {/* Slot 2 — result panes overlaid (no height swap) */}
              <div className="relative min-h-0">
                {reducedMotion ? (
                  <SignalResult />
                ) : (
                  <>
                    <div
                      ref={tradeResultRef}
                      className="absolute inset-0"
                      aria-hidden={scenario !== "trade"}
                    >
                      <SignalResult />
                    </div>
                    <div
                      ref={holdResultRef}
                      className="absolute inset-0"
                      aria-hidden={scenario !== "hold"}
                    >
                      <HoldResult />
                    </div>
                  </>
                )}
              </div>

              {/* Slot 3 — composer */}
              <div
                className={cn(
                  "relative z-30 flex h-full min-h-0 items-center gap-2 overflow-visible px-2 py-1.5 sm:px-3 sm:py-2",
                  landingGlassPill
                )}
              >
              <span
                aria-hidden
                className={cn(landingGlassSheen, "rounded-full")}
              />
              <Input
                value={shownDraft}
                readOnly
                tabIndex={-1}
                placeholder={SIGNAL_WAIT_SECTION.composerPlaceholder}
                className="relative z-10 h-10 min-w-0 flex-1 border-0 bg-transparent px-2 text-sm text-foreground shadow-none placeholder:text-muted-foreground/90 focus-visible:ring-0 read-only:cursor-default sm:px-3 sm:text-base"
                aria-label={SIGNAL_WAIT_SECTION.composerPlaceholder}
              />
              <span
                ref={sendRef}
                className="relative z-10 inline-flex shrink-0"
              >
                <Button
                  type="button"
                  size="icon"
                  tabIndex={-1}
                  className="pointer-events-none size-10 shrink-0 rounded-full bg-[#2563EB] text-white shadow-[0_8px_24px_rgba(37,99,235,0.32)] hover:bg-[#1D4ED8]"
                  aria-hidden
                >
                  <ArrowUpIcon className="size-4" />
                </Button>
              </span>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  )
}
