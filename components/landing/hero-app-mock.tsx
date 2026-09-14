"use client"

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { NewspaperIcon, SendHorizonalIcon, SparklesIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { IrisMark } from "@/components/app-shell/chat-message"
import { IrisLabAvatar } from "@/components/brand/iris-lab-avatar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  APP_CHROME_H,
  APP_FRAME_CLASS,
  APP_MAIN_H,
} from "@/components/landing/hero-app-frame"
import { cn } from "@/lib/utils"

const USER_AVATAR_SRC =
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=96&h=96&q=80"

const NEWS = [
  { score: 92, titleKey: "headline0" as const, time: "3m" },
  { score: 78, titleKey: "headline1" as const, time: "12m" },
  { score: 64, titleKey: "headline2" as const, time: "27m" },
  { score: 51, titleKey: "headline3" as const, time: "41m" },
] as const

type Phase = "idle" | "typing" | "sent" | "thinking" | "reply" | "hold"

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

function NewsRow({
  score,
  title,
  time,
  active,
}: {
  score: number
  title: string
  time: string
  active?: boolean
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-2.5 transition-colors",
        active
          ? "border-foreground/25 bg-muted/35"
          : "border-border/50 bg-card/40"
      )}
    >
      <div className="flex items-start gap-2.5">
        <span
          className={cn(
            "mt-0.5 inline-flex min-w-8 shrink-0 items-center justify-center rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold tabular-nums",
            score >= 80
              ? "bg-foreground text-background"
              : "border border-border/60 bg-muted/30 text-foreground"
          )}
        >
          {score}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] leading-snug font-medium text-foreground/90">
            {title}
          </p>
          <p className="mt-1 font-mono text-[9px] text-muted-foreground tabular-nums">
            {time}
          </p>
        </div>
      </div>
    </div>
  )
}

function IrisAvatar() {
  return <IrisLabAvatar />
}

function UserAvatar() {
  return (
    <Avatar size="sm">
      <AvatarImage src={USER_AVATAR_SRC} alt="" loading="lazy" decoding="async" />
      <AvatarFallback className="bg-foreground text-background">U</AvatarFallback>
    </Avatar>
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

        await wait(900, signal)
        setPhase("typing")
        const prompt = t("userQ")
        for (let i = 1; i <= prompt.length; i++) {
          setDraft(prompt.slice(0, i))
          await wait(34, signal)
        }
        await wait(420, signal)
        setUserMsg(prompt)
        setDraft("")

        setPhase("thinking")
        await wait(680, signal)

        setPhase("reply")
        const reply = t("aiReply")
        for (let i = 1; i <= reply.length; i++) {
          setAiMsg(reply.slice(0, i))
          await wait(14, signal)
        }

        setPhase("hold")
        await wait(2600, signal)
        setLoop((n) => n + 1)
      } catch {
        /* aborted */
      }
    }

    void run()
    return () => ac.abort()
  }, [loop, playing, t])

  return (
    <div ref={rootRef} className={cn(APP_FRAME_CLASS, className)} aria-hidden>
      <div
        className={cn(
          APP_CHROME_H,
          "flex items-center justify-between gap-2 border-b border-border/70 px-3 sm:px-4"
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          <span className="hidden gap-1 sm:flex">
            <span className="size-2 rounded-full border border-border dark:border-white/10 dark:bg-white/10" />
            <span className="size-2 rounded-full border border-border dark:border-white/10 dark:bg-white/10" />
            <span className="size-2 rounded-full border border-border dark:border-white/10 dark:bg-white/10" />
          </span>
          <span className="truncate text-[11px] font-semibold tracking-tight">
            Exur
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge variant="outline" className="h-5 rounded-full px-2 text-[9px]">
            ETH
          </Badge>
          <Badge className="h-5 rounded-full px-2 text-[9px]">
            <NewspaperIcon className="size-3" aria-hidden />
            {t("newsTab")}
          </Badge>
        </div>
      </div>

      <div
        className={cn(
          APP_MAIN_H,
          "grid min-h-0 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_17rem]"
        )}
      >
        <section className="flex min-h-0 flex-col border-b border-border/60 lg:border-b-0 lg:border-r">
          <div className="flex shrink-0 items-center justify-between border-b border-border/50 px-3 py-2 sm:px-4">
            <p className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              {t("newsHeading")}
            </p>
            <span className="font-mono text-[9px] text-muted-foreground tabular-nums">
              {t("updated")}
            </span>
          </div>
          <div className="min-h-0 flex-1 space-y-2 overflow-hidden px-3 py-3 sm:px-4">
            {NEWS.map((item, index) => (
              <NewsRow
                key={item.titleKey}
                score={item.score}
                title={t(item.titleKey)}
                time={item.time}
                active={index === 0 && (activePhase === "typing" || activePhase === "reply" || still)}
              />
            ))}
          </div>
        </section>

        <aside className="flex min-h-0 flex-col bg-card/50">
          <div className="flex shrink-0 items-center gap-2 border-b border-border/50 px-3 py-2.5">
            <span className="relative flex size-7 items-center justify-center">
              <IrisMark className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold tracking-tight">Exur</p>
              <p className="text-[10px] text-muted-foreground">{t("chatSubtitle")}</p>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-2 p-3">
            <div className="flex min-h-0 flex-1 flex-col justify-end gap-2 overflow-hidden">
              <AnimatePresence>
                {showUser ? (
                  <motion.div
                    key="user"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-end gap-1"
                  >
                    <UserAvatar />
                    <p className="max-w-[92%] rounded-xl rounded-tr-sm bg-foreground px-2.5 py-1.5 text-left text-[10px] leading-relaxed font-medium text-background">
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
                    className="flex flex-col items-start gap-1"
                  >
                    <IrisAvatar />
                    <span className="inline-flex gap-1 rounded-xl rounded-tl-sm border border-border/60 bg-muted/25 px-2.5 py-2 text-[8px] leading-none text-muted-foreground">
                      <span className="animate-pulse">●</span>
                      <span className="animate-pulse [animation-delay:120ms]">●</span>
                      <span className="animate-pulse [animation-delay:240ms]">●</span>
                    </span>
                  </motion.div>
                ) : null}
                {showAi ? (
                  <motion.div
                    key="ai"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-start gap-1"
                  >
                    <IrisAvatar />
                    <div className="w-full min-w-0 rounded-xl rounded-tl-sm border border-border/60 bg-muted/25 px-2.5 py-2 text-left">
                      <p className="text-[10px] leading-relaxed text-muted-foreground">
                        {showAi}
                        {activePhase === "reply" ? (
                          <span className="ml-0.5 inline-block h-2.5 w-px animate-pulse bg-foreground/70 align-middle" />
                        ) : null}
                      </p>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            <div
              className={cn(
                "shrink-0 rounded-2xl border px-2.5 py-2 text-[10px] transition-all",
                activePhase === "typing"
                  ? "border-white/12 bg-linear-to-b from-muted/35 to-muted/15 text-foreground ring-1 ring-white/8"
                  : "border-border/45 bg-linear-to-b from-muted/20 via-card/35 to-muted/10 text-muted-foreground"
              )}
            >
              {showDraft ? (
                <span>{showDraft}</span>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex min-w-0 items-center gap-1.5">
                    <span className="flex size-4 shrink-0 items-center justify-center rounded-md border border-border/70 bg-muted/20 text-foreground/75">
                      <SparklesIcon className="size-2.5" />
                    </span>
                    <span className="truncate text-foreground/80">
                      {t("composerPlaceholder")}
                    </span>
                  </span>
                  <Button
                    size="xs"
                    variant="ghost"
                    tabIndex={-1}
                    className="h-7 gap-1 px-2.5 text-[9px] font-medium"
                  >
                    <SendHorizonalIcon className="size-2.5" />
                    {t("send")}
                  </Button>
                </div>
              )}
              {activePhase === "typing" ? (
                <span className="ml-0.5 inline-block h-2.5 w-px animate-pulse bg-foreground align-middle" />
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
