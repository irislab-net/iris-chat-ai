"use client"

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { MessageSquareIcon, NewspaperIcon, SendHorizonalIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { chatUserBubbleClass } from "@/components/app-shell/chat-turn-actions"
import { TypingDots } from "@/components/app-shell/chat-typing"
import {
  chatDesktopComposerBodyClass,
  chatDesktopComposerSendClass,
  chatDesktopComposerSendDisabledClass,
  chatDesktopComposerShellClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  APP_CHROME_H,
  APP_FRAME_CLASS,
  APP_MAIN_H,
} from "@/components/landing/hero-app-frame"
import { cn } from "@/lib/utils"

type SentimentTone = "positive" | "negative" | "neutral"

const NEWS = [
  {
    titleKey: "headline0" as const,
    timeKey: "time0" as const,
    sourceKey: "source0" as const,
    summaryKey: "summary0" as const,
    tone: "positive" as const,
    featured: true,
    highImpact: true,
  },
  {
    titleKey: "headline1" as const,
    timeKey: "time1" as const,
    sourceKey: "source1" as const,
    tone: "negative" as const,
    highImpact: true,
  },
  {
    titleKey: "headline2" as const,
    timeKey: "time2" as const,
    sourceKey: "source2" as const,
    tone: "neutral" as const,
  },
  {
    titleKey: "headline3" as const,
    timeKey: "time3" as const,
    sourceKey: "source3" as const,
    tone: "positive" as const,
  },
] as const

const PANEL_SWITCH = { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const }

const TIMING = {
  newsDwell: 2_800,
  beforeChat: 450,
  typeChar: 42,
  afterType: 550,
  thinking: 1_100,
  replyChar: 18,
  hold: 3_400,
} as const

type Phase = "idle" | "typing" | "sent" | "thinking" | "reply" | "hold"
type MockTab = "news" | "chat"

function wait(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Aborted", "AbortError"))
      return
    }
    const id = window.setTimeout(() => resolve(), ms)
    signal.addEventListener(
      "abort",
      () => {
        window.clearTimeout(id)
        reject(new DOMException("Aborted", "AbortError"))
      },
      { once: true }
    )
  })
}

function useIsAwake(ref: React.RefObject<HTMLElement | null>) {
  const [awake, setAwake] = React.useState(false)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return

    let onScreen = true
    let foreground = document.visibilityState === "visible"
    const apply = () => setAwake(onScreen && foreground)

    const io =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            ([entry]) => {
              onScreen = entry.isIntersecting
              apply()
            },
            { rootMargin: "150px 0px" }
          )
    io?.observe(el)

    const onVisibility = () => {
      foreground = document.visibilityState === "visible"
      apply()
    }
    document.addEventListener("visibilitychange", onVisibility)
    apply()

    return () => {
      io?.disconnect()
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [ref])

  return awake
}

function toneSurface(tone: SentimentTone, featured = false) {
  if (tone === "positive") {
    return featured
      ? "bg-emerald-500/[0.08] dark:bg-emerald-400/[0.06]"
      : "bg-emerald-500/[0.045] dark:bg-emerald-400/[0.04]"
  }
  if (tone === "negative") {
    return featured
      ? "bg-red-500/[0.08] dark:bg-red-400/[0.06]"
      : "bg-red-500/[0.045] dark:bg-red-400/[0.04]"
  }
  return featured ? "bg-muted/22" : "bg-muted/18"
}

function MockSourceIcon({
  label,
  featured = false,
}: {
  label: string
  featured?: boolean
}) {
  return (
    <Avatar
      className={cn(
        "shrink-0 bg-muted/70 after:border-border/50",
        featured ? "mt-0.5 size-8 sm:size-9" : "size-7"
      )}
      aria-hidden
    >
      <AvatarFallback className="text-[10px] font-semibold text-muted-foreground">
        {label.charAt(0)}
      </AvatarFallback>
    </Avatar>
  )
}

function MockTabBar({
  active,
  newsLabel,
  chatLabel,
}: {
  active: MockTab
  newsLabel: string
  chatLabel: string
}) {
  return (
    <div
      className="flex shrink-0 rounded-full border border-border/40 bg-muted/20 p-0.5"
      role="tablist"
      aria-hidden
    >
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium transition-all duration-500 ease-out sm:px-3 sm:text-[11px]",
          active === "news"
            ? "bg-foreground text-background"
            : "text-muted-foreground"
        )}
      >
        <NewspaperIcon className="size-3" aria-hidden />
        {newsLabel}
      </span>
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium transition-all duration-500 ease-out sm:px-3 sm:text-[11px]",
          active === "chat"
            ? "bg-foreground text-background"
            : "text-muted-foreground"
        )}
      >
        <MessageSquareIcon className="size-3" aria-hidden />
        {chatLabel}
      </span>
    </div>
  )
}

function NewsMetaLine({
  source,
  time,
  tone,
  highImpact,
  tonePositiveLabel,
  toneNegativeLabel,
  highImpactLabel,
}: {
  source: string
  time: string
  tone: SentimentTone
  highImpact?: boolean
  tonePositiveLabel: string
  toneNegativeLabel: string
  highImpactLabel: string
}) {
  return (
    <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] text-muted-foreground sm:text-[11px]">
      <span>{source}</span>
      <span>· {time}</span>
      {highImpact ? (
        <span className="font-medium text-foreground">· {highImpactLabel}</span>
      ) : null}
      {tone === "positive" ? (
        <span className="font-medium text-emerald-600 dark:text-emerald-400">
          · {tonePositiveLabel}
        </span>
      ) : null}
      {tone === "negative" ? (
        <span className="font-medium text-red-600 dark:text-red-400">
          · {toneNegativeLabel}
        </span>
      ) : null}
    </p>
  )
}

function NewsCardMock({
  source,
  time,
  title,
  summary,
  tone,
  featured = false,
  highImpact,
  leadLabel,
  tonePositiveLabel,
  toneNegativeLabel,
  highImpactLabel,
  active,
  className,
}: {
  source: string
  time: string
  title: string
  summary?: string
  tone: SentimentTone
  featured?: boolean
  highImpact?: boolean
  leadLabel: string
  tonePositiveLabel: string
  toneNegativeLabel: string
  highImpactLabel: string
  active?: boolean
  className?: string
}) {
  return (
    <article
      className={cn(
        "flex items-start gap-2.5 rounded-2xl transition-colors sm:gap-3",
        toneSurface(tone, featured),
        featured ? "p-3 sm:p-3.5" : "px-2 py-2.5 sm:px-2.5 sm:py-3",
        active && "ring-1 ring-foreground/10",
        className
      )}
    >
      <MockSourceIcon label={source} featured={featured} />
      <div className="min-w-0 flex-1 text-start">
        {featured ? (
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="h-5 px-1.5 text-[9px] font-medium">
              {leadLabel}
            </Badge>
            {highImpact ? (
              <Badge variant="secondary" className="h-5 px-1.5 text-[9px] font-medium">
                {highImpactLabel}
              </Badge>
            ) : null}
            {tone === "positive" ? (
              <Badge
                variant="secondary"
                className="h-5 border-0 bg-emerald-500/10 px-1.5 text-[9px] font-medium text-emerald-800/85 dark:text-emerald-200/90"
              >
                {tonePositiveLabel}
              </Badge>
            ) : null}
            {tone === "negative" ? (
              <Badge
                variant="secondary"
                className="h-5 border-0 bg-red-500/10 px-1.5 text-[9px] font-medium text-red-800/85 dark:text-red-200/90"
              >
                {toneNegativeLabel}
              </Badge>
            ) : null}
            <span className="text-[10px] text-muted-foreground sm:text-[11px]">
              {source} · {time}
            </span>
          </div>
        ) : (
          <NewsMetaLine
            source={source}
            time={time}
            tone={tone}
            highImpact={highImpact}
            tonePositiveLabel={tonePositiveLabel}
            toneNegativeLabel={toneNegativeLabel}
            highImpactLabel={highImpactLabel}
          />
        )}
        <h3
          className={cn(
            "font-semibold tracking-tight text-foreground",
            featured
              ? "text-[13px] leading-snug sm:text-sm"
              : "mt-1 text-[12px] leading-snug line-clamp-2 sm:text-[13px]"
          )}
        >
          {title}
        </h3>
        {featured && summary ? (
          <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground line-clamp-2 sm:text-xs">
            {summary}
          </p>
        ) : null}
      </div>
    </article>
  )
}

/** Split news + chat mock for the landing hero. */
export function HeroAppMock({ className }: { className?: string }) {
  const t = useTranslations("landing.heroMock")
  const reduceMotion = useReducedMotion()
  const rootRef = React.useRef<HTMLDivElement>(null)
  const awake = useIsAwake(rootRef)
  const playing = reduceMotion === false && awake

  const [phase, setPhase] = React.useState<Phase>("idle")
  const [draft, setDraft] = React.useState("")
  const [userMsg, setUserMsg] = React.useState<string | null>(null)
  const [aiMsg, setAiMsg] = React.useState("")
  const [loop, setLoop] = React.useState(0)

  const still = !playing
  const showUser = still ? t("userQ") : userMsg
  const showAi = still ? t("aiReply") : aiMsg
  const showDraft = still ? "" : draft
  const activePhase = still ? ("hold" as Phase) : phase
  const composerActive = activePhase === "typing" || Boolean(showDraft)

  const activeTab: MockTab = still
    ? "chat"
    : activePhase === "idle"
      ? "news"
      : "chat"
  const animatePanels = reduceMotion !== true

  const [lead, ...rest] = NEWS

  React.useEffect(() => {
    if (!playing) return

    const ac = new AbortController()
    const { signal } = ac

    async function run() {
      try {
        setPhase("idle")
        setDraft("")
        setUserMsg(null)
        setAiMsg("")

        await wait(TIMING.newsDwell, signal)
        await wait(TIMING.beforeChat, signal)
        setPhase("typing")
        const prompt = t("userQ")
        for (let i = 1; i <= prompt.length; i++) {
          setDraft(prompt.slice(0, i))
          await wait(TIMING.typeChar, signal)
        }
        await wait(TIMING.afterType, signal)
        setUserMsg(prompt)
        setDraft("")

        setPhase("thinking")
        await wait(TIMING.thinking, signal)

        setPhase("reply")
        const reply = t("aiReply")
        for (let i = 1; i <= reply.length; i++) {
          setAiMsg(reply.slice(0, i))
          await wait(TIMING.replyChar, signal)
        }

        setPhase("hold")
        await wait(TIMING.hold, signal)
        setLoop((n) => n + 1)
      } catch {
        /* aborted */
      }
    }

    void run()
    return () => ac.abort()
  }, [loop, playing, t])

  const newsPanel = (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 px-3 pt-3 pb-2 sm:px-4">
        <p className="text-[10px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
          {t("newsEyebrow")}
        </p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <h3 className="text-[13px] font-semibold tracking-tight text-foreground sm:text-sm">
            {t("newsHeading")}
          </h3>
          <Badge variant="secondary" className="h-5 font-mono text-[9px] tabular-nums">
            {t("updated")}
          </Badge>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-hidden px-3 pb-3 sm:space-y-2.5 sm:px-4 sm:pb-4">
        <NewsCardMock
          source={t(lead.sourceKey)}
          time={t(lead.timeKey)}
          title={t(lead.titleKey)}
          summary={t(lead.summaryKey)}
          tone={lead.tone}
          featured
          highImpact={lead.highImpact}
          leadLabel={t("leadBadge")}
          tonePositiveLabel={t("tonePositive")}
          toneNegativeLabel={t("toneNegative")}
          highImpactLabel={t("highImpact")}
          active={
            activePhase === "typing" ||
            activePhase === "reply" ||
            activePhase === "hold" ||
            still
          }
        />

        {rest.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 pt-0.5">
              <p className="text-[10px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                {t("latestSection")}
              </p>
              <Separator className="min-w-0 flex-1" />
            </div>
            <div className="flex flex-col gap-2">
              {rest.map((item, index) => (
                <NewsCardMock
                  key={item.titleKey}
                  source={t(item.sourceKey)}
                  time={t(item.timeKey)}
                  title={t(item.titleKey)}
                  tone={item.tone}
                  highImpact={"highImpact" in item ? item.highImpact : undefined}
                  leadLabel={t("leadBadge")}
                  tonePositiveLabel={t("tonePositive")}
                  toneNegativeLabel={t("toneNegative")}
                  highImpactLabel={t("highImpact")}
                  className={index >= 2 ? "hidden sm:flex" : undefined}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )

  const chatPanel = (
    <div className="flex min-h-0 flex-1 flex-col bg-background/40">
      <div className="flex min-h-0 flex-1 flex-col justify-end gap-3 overflow-hidden px-2 py-3 sm:px-3">
        <AnimatePresence mode="wait">
          {showUser ? (
            <motion.div
              key="user"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: PANEL_SWITCH.ease }}
              className="flex justify-end"
            >
              <p
                className={cn(
                  chatUserBubbleClass,
                  "max-w-[88%] text-[11px] leading-[1.55] sm:text-[12px]"
                )}
              >
                {showUser}
              </p>
            </motion.div>
          ) : null}
          {activePhase === "thinking" ? (
            <motion.div
              key="think"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: PANEL_SWITCH.ease }}
              className="px-2 sm:px-3"
            >
              <TypingDots className="text-muted-foreground/70" />
            </motion.div>
          ) : null}
          {showAi ? (
            <motion.div
              key="ai"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: PANEL_SWITCH.ease }}
              className="px-2 sm:px-3"
            >
              <p className="text-[11px] leading-[1.6] text-foreground/92 sm:text-[12px]">
                {showAi}
                {activePhase === "reply" ? (
                  <span className="ms-0.5 inline-block h-2.5 w-px animate-pulse bg-foreground/70 align-middle" />
                ) : null}
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div
        className={cn(
          chatDesktopComposerShellClass,
          "shrink-0 bg-background/95 px-2 backdrop-blur-md sm:px-3"
        )}
      >
        <div
          className={cn(
            chatDesktopComposerBodyClass,
            composerActive && "ring-white/80 dark:ring-white/16"
          )}
        >
          <div className="[grid-area:primary] min-h-9 px-3 pt-2 pb-1 text-[11px] leading-relaxed sm:min-h-10 sm:px-3.5 sm:pt-2.5 sm:text-[12px]">
            {showDraft ? (
              <span className="text-foreground">{showDraft}</span>
            ) : (
              <span className="text-muted-foreground/70">{t("composerPlaceholder")}</span>
            )}
            {activePhase === "typing" ? (
              <span className="ms-0.5 inline-block h-2.5 w-px animate-pulse bg-foreground align-middle" />
            ) : null}
          </div>
          <div className="[grid-area:trailing] flex items-end justify-end pb-1 pe-0.5">
            <Button
              size="icon"
              variant="ghost"
              tabIndex={-1}
              className={cn(
                composerActive
                  ? chatDesktopComposerSendClass
                  : chatDesktopComposerSendDisabledClass,
                "size-8 sm:size-9"
              )}
            >
              <SendHorizonalIcon className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div ref={rootRef} className={cn(APP_FRAME_CLASS, className)} aria-hidden>
      <div
        className={cn(
          APP_CHROME_H,
          "flex items-center justify-between gap-3 border-b border-border/50 px-3 sm:px-4"
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          <span className="hidden gap-1 sm:flex">
            <span className="size-2 rounded-full border border-border/60 bg-muted/30" />
            <span className="size-2 rounded-full border border-border/60 bg-muted/30" />
            <span className="size-2 rounded-full border border-border/60 bg-muted/30" />
          </span>
          <Badge
            variant="outline"
            className="h-6 rounded-full px-2.5 text-[10px] font-semibold"
          >
            {t("market")}
          </Badge>
        </div>
        <MockTabBar
          active={activeTab}
          newsLabel={t("newsTab")}
          chatLabel={t("chatTab")}
        />
      </div>

      <div className={cn(APP_MAIN_H, "relative min-h-0 overflow-hidden")}>
        <div className="hidden h-full min-h-0 grid-cols-[minmax(0,1fr)_15.5rem] lg:grid">
          <section className="flex min-h-0 flex-col border-r border-border/50">
            {newsPanel}
          </section>
          <aside className="flex min-h-0 flex-col">{chatPanel}</aside>
        </div>

        <div className="relative h-full min-h-0 lg:hidden">
          <AnimatePresence mode="wait" initial={false}>
            {activeTab === "news" ? (
              <motion.section
                key="news"
                className="absolute inset-0 flex min-h-0 flex-col"
                initial={animatePanels ? { opacity: 0, x: -18 } : false}
                animate={{ opacity: 1, x: 0 }}
                exit={animatePanels ? { opacity: 0, x: 18 } : undefined}
                transition={PANEL_SWITCH}
              >
                {newsPanel}
              </motion.section>
            ) : (
              <motion.aside
                key="chat"
                className="absolute inset-0 flex min-h-0 flex-col"
                initial={animatePanels ? { opacity: 0, x: 18 } : false}
                animate={{ opacity: 1, x: 0 }}
                exit={animatePanels ? { opacity: 0, x: -18 } : undefined}
                transition={PANEL_SWITCH}
              >
                {chatPanel}
              </motion.aside>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
