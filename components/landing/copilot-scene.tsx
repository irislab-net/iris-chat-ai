"use client"

import * as React from "react"
import { motion, useReducedMotion } from "motion/react"
import { SendHorizonalIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { IrisMark } from "@/components/app-shell/chat-message"
import { TypingDots } from "@/components/app-shell/chat-typing"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const USER_AVATAR_SRC =
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=96&h=96&q=80"

const PLAN = [
  { label: "Side", value: "Short" },
  { label: "Size", value: "0.42 ETH" },
  { label: "Stop", value: "3,445.0" },
  { label: "Target", value: "3,310.0" },
] as const

function CopilotBracketReply() {
  const t = useTranslations("landing.scenes")

  return (
    <div
      className={cn(
        "mt-1 overflow-hidden rounded-2xl rounded-bl-md border border-border/60",
        "bg-linear-to-b from-muted/35 via-background/80 to-background",
        "shadow-[0_14px_36px_-24px_color-mix(in_oklch,var(--foreground)_22%,transparent)]"
      )}
    >
      <div className="flex flex-wrap items-center gap-1.5 border-b border-border/50 px-3 py-2">
        <Badge
          variant="outline"
          className="rounded-full px-2 py-0 text-[10px] font-medium"
        >
          15m
        </Badge>
        <Badge className="rounded-full px-2 py-0 text-[10px] font-medium">
          {t("copilotSide")}
        </Badge>
        <p className="text-[11px] leading-snug text-foreground/85">
          {t("copilotAlign")}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-1 p-2">
        {PLAN.map((row) => (
          <div
            key={row.label}
            className="rounded-md border border-border/55 bg-muted/30 px-2 py-1.5"
          >
            <dt className="text-[8px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
              {row.label}
            </dt>
            <dd className="mt-0.5 font-mono text-[11px] leading-none font-semibold tracking-tight text-foreground tabular-nums">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="flex items-center justify-between gap-2 border-t border-border/45 bg-muted/15 px-3 py-1.5">
        <p className="text-[9px] text-muted-foreground">{t("copilotAnalysis")}</p>
        <p className="font-mono text-[9px] tabular-nums text-muted-foreground">
          R:R 2.0×
        </p>
      </div>
    </div>
  )
}

type Point = { x: number; y: number }

function TraderAvatar({ className }: { className?: string }) {
  return (
    <Avatar
      size="default"
      className={cn(
        "size-8 after:hidden shadow-[0_6px_16px_-8px_color-mix(in_oklch,var(--foreground)_18%,transparent)]",
        className
      )}
    >
      <AvatarImage src={USER_AVATAR_SRC} alt="Trader" />
      <AvatarFallback>T</AvatarFallback>
    </Avatar>
  )
}

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

function centerIn(root: HTMLElement, el: HTMLElement | null): Point {
  if (!el) return { x: 40, y: 40 }
  const a = root.getBoundingClientRect()
  const b = el.getBoundingClientRect()
  return {
    x: b.left - a.left + b.width / 2,
    y: b.top - a.top + b.height / 2,
  }
}

function DemoCursor({
  point,
  clicking,
  visible,
}: {
  point: Point
  clicking: boolean
  visible: boolean
}) {
  if (!visible) return null
  return (
    <motion.div
      className="pointer-events-none absolute top-0 left-0 z-30 hidden sm:block"
      animate={{
        x: point.x,
        y: point.y,
        scale: clicking ? 0.86 : 1,
      }}
      transition={{
        x: { type: "spring", stiffness: 90, damping: 28, mass: 1.05 },
        y: { type: "spring", stiffness: 90, damping: 28, mass: 1.05 },
        scale: { duration: 0.22 },
      }}
      style={{ marginLeft: -2, marginTop: -2 }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        className="drop-shadow-sm"
        aria-hidden
      >
        <path
          d="M5.5 3.5L19 12.2L12.4 13.5L9.8 20.5L5.5 3.5Z"
          className="fill-foreground stroke-background"
          strokeWidth="1.25"
          strokeLinejoin="round"
        />
      </svg>
    </motion.div>
  )
}

export function CopilotScene() {
  const t = useTranslations("landing.scenes")
  const reduceMotion = useReducedMotion()
  const userQuestion = t("copilotUserQ")
  const rootRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLDivElement>(null)
  const sendRef = React.useRef<HTMLSpanElement>(null)

  const [onScreen, setOnScreen] = React.useState(false)
  const [loop, setLoop] = React.useState(0)
  const [cursor, setCursor] = React.useState<Point>({ x: 48, y: 36 })
  const [cursorOn, setCursorOn] = React.useState(false)
  const [clicking, setClicking] = React.useState(false)
  const [focused, setFocused] = React.useState(false)
  const [draft, setDraft] = React.useState("")
  const [userOn, setUserOn] = React.useState(false)
  const [thinking, setThinking] = React.useState(false)
  const [replyOn, setReplyOn] = React.useState(false)

  const still = reduceMotion === true
  const showUser = still || userOn
  const showReply = still || replyOn
  const showCursor = !still && cursorOn
  const showIdle = !showUser && !thinking && !showReply

  React.useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => setOnScreen(entry.isIntersecting),
      { threshold: 0.35 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const moveTo = React.useEffectEvent(
    async (el: HTMLElement | null, signal: AbortSignal) => {
      const root = rootRef.current
      if (!root) return
      setCursorOn(true)
      setCursor(centerIn(root, el))
      await wait(1100, signal)
    }
  )

  const clickAt = React.useEffectEvent(async (signal: AbortSignal) => {
    setClicking(true)
    await wait(220, signal)
    setClicking(false)
    await wait(180, signal)
  })

  React.useEffect(() => {
    if (still || !onScreen) return
    const ac = new AbortController()
    const { signal } = ac

    async function play() {
      try {
        setUserOn(false)
        setThinking(false)
        setReplyOn(false)
        setDraft("")
        setFocused(false)
        setClicking(false)
        setCursorOn(true)
        const root = rootRef.current
        if (root) setCursor({ x: root.clientWidth * 0.72, y: 28 })

        await wait(800, signal)
        await moveTo(inputRef.current, signal)
        await clickAt(signal)
        setFocused(true)

        for (let i = 1; i <= userQuestion.length; i++) {
          setDraft(userQuestion.slice(0, i))
          await wait(48, signal)
        }
        await wait(520, signal)

        await moveTo(sendRef.current, signal)
        await clickAt(signal)
        setUserOn(true)
        setDraft("")
        setFocused(false)
        setCursorOn(false)

        await wait(800, signal)
        setThinking(true)
        await wait(1600, signal)
        setThinking(false)
        setReplyOn(true)
        await wait(3800, signal)
        setLoop((n) => n + 1)
      } catch {
        /* aborted */
      }
    }

    void play()
    return () => ac.abort()
  }, [loop, onScreen, still, userQuestion])

  return (
    <div
      ref={rootRef}
      data-reveal
      className="relative mx-auto w-full max-w-88"
      aria-hidden
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[4%] -z-10 rounded-[2.5rem] bg-foreground/14 opacity-55 blur-3xl dark:bg-foreground/22"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[10%] -z-10 rounded-[2rem] bg-foreground/18 opacity-60 blur-2xl dark:bg-foreground/28"
      />

      <DemoCursor point={cursor} clicking={clicking} visible={showCursor} />

      <div
        className={cn(
          "relative overflow-hidden rounded-[1.75rem]",
          "bg-card/80 text-card-foreground backdrop-blur-md",
          "shadow-[0_2px_8px_-2px_rgba(0,0,0,0.12),0_18px_40px_-18px_rgba(0,0,0,0.28)]",
          "dark:shadow-[0_2px_10px_-2px_rgba(255,255,255,0.06),0_20px_48px_-16px_rgba(255,255,255,0.16)]"
        )}
      >
        <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
          <IrisMark className="size-8" />
          <div className="min-w-0 text-left">
            <p className="text-[15px] font-semibold tracking-tight text-foreground">
              {t("copilotName")}
            </p>
            <p className="text-[12px] text-muted-foreground">{t("copilotSubtitle")}</p>
          </div>
        </div>

        <div className="relative flex h-72 min-h-0 flex-col px-4 pb-4 pt-3">
          <div
            className={cn(
              "absolute inset-x-4 inset-y-3 flex flex-col items-center justify-center px-2 text-center transition-opacity duration-500",
              showIdle ? "opacity-100" : "pointer-events-none opacity-0"
            )}
          >
            <p className="text-sm font-medium tracking-tight text-foreground">
              {t("copilotIdleTitle")}
            </p>
            <p className="mt-1.5 max-w-68 text-[12px] leading-5 text-muted-foreground">
              {t("copilotIdleBody")}
            </p>
          </div>

          <div
            className={cn(
              "flex min-h-0 flex-1 flex-col justify-end gap-3 overflow-y-auto transition-opacity duration-500",
              showIdle ? "pointer-events-none opacity-0" : "opacity-100"
            )}
          >
            {showUser ? (
              <div
                className={cn(
                  "flex shrink-0 justify-end transition-all duration-1000 ease-out",
                  "translate-y-0 opacity-100"
                )}
              >
                <div className="flex max-w-[86%] items-end gap-2">
                  <p className="rounded-2xl rounded-br-md bg-muted/50 px-3.5 py-2.5 text-left text-[13px] leading-[1.45] font-medium tracking-[-0.01em] text-foreground">
                    {userQuestion}
                  </p>
                  <TraderAvatar className="shrink-0" />
                </div>
              </div>
            ) : null}

            {thinking || showReply ? (
              <div
                className={cn(
                  "flex max-w-[94%] shrink-0 gap-2.5 transition-all duration-1000 ease-out",
                  "translate-y-0 opacity-100"
                )}
              >
                <IrisMark className="mt-0.5 shrink-0" />

                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium tracking-wide text-muted-foreground">
                    {t("copilotName")}
                  </p>

                  {thinking && !showReply ? (
                    <div className="mt-1 rounded-2xl rounded-bl-md border border-border/60 bg-muted/25 px-3.5 py-3">
                      <TypingDots className="text-muted-foreground" />
                    </div>
                  ) : null}

                  {showReply ? (
                    <div className="transition-opacity duration-1000 ease-out">
                      <CopilotBracketReply />
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="border-t border-border/60 px-4 py-3">
          <div
            ref={inputRef}
            className="flex h-11 items-center justify-between gap-3 rounded-full border border-border/60 bg-muted/50 px-2 pl-4"
          >
            <span className="min-w-0 truncate text-left text-[13px] text-foreground/80">
              {draft || (
                <span className="text-muted-foreground">{t("copilotPlaceholder")}</span>
              )}
              {focused ? (
                <span className="ml-0.5 inline-block h-3 w-px animate-pulse bg-foreground align-middle" />
              ) : null}
            </span>
            <span ref={sendRef} className="inline-flex">
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                tabIndex={-1}
                className="pointer-events-none size-8 rounded-full bg-background text-foreground hover:bg-background"
              >
                <SendHorizonalIcon className="size-3.5" />
              </Button>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
