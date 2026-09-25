"use client"

import type { ReactNode } from "react"
import { useLayoutEffect, useRef, useState } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { MinusIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import {
  ScrollReveal,
  ScrollRevealGroup,
} from "@/components/landing/modern/scroll-reveal"
import { SectionHeader } from "@/components/landing/modern/sphere-ui"
import { ensureGsapScroll } from "@/lib/gsap-scroll"
import { prefersReducedMotion } from "@/lib/landing-motion"
import {
  DESK_NEWS_CYCLE_MS,
  DESK_NEWS_META,
  DESK_NEWS_VISIBLE,
  type DeskNewsItem,
  type DeskNewsTone,
} from "@/lib/landing-modern-data"
import {
  landingAfterHeader,
  landingContentWide,
  landingGlassOrb,
  landingGlassPill,
  landingGlassSheen,
  landingGlassSurface,
  landingSection,
  landingSectionBody,
  landingTitleCard,
} from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

const SHIFT_EASE = "power2.inOut"
const SHIFT_DURATION = 0.95

function initialBoard(): DeskNewsItem[] {
  return [...DESK_NEWS_META]
    .slice(0, DESK_NEWS_VISIBLE)
    .sort((a, b) => b.impact - a.impact)
}

/** Last card rises to lead; the rest shift down one slot. */
function promoteLastToLead(board: DeskNewsItem[]): DeskNewsItem[] {
  if (board.length < 2) return board
  const last = board[board.length - 1]!
  return [last, ...board.slice(0, -1)]
}

function GlassSheen({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(landingGlassSheen, "pointer-events-none absolute inset-0", className)}
    />
  )
}

function GlassTag({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        landingGlassPill,
        "inline-flex items-center px-2.5 py-1 text-[10px] font-medium tracking-wide text-muted-foreground",
        className
      )}
    >
      <GlassSheen className="rounded-full" />
      <span className="relative z-10">{children}</span>
    </span>
  )
}

function ImpactScore({
  score,
  label,
  featured,
  shifting,
}: {
  score: number
  label: string
  featured?: boolean
  shifting?: boolean
}) {
  return (
    <div className="flex w-16 shrink-0 flex-col items-center gap-1.5 sm:w-18">
      <span
        className={cn(
          landingGlassOrb,
          "flex size-12 items-center justify-center text-foreground sm:size-13",
          shifting ? "transition-none" : "transition-shadow duration-500 ease-out",
          featured &&
            "shadow-[0_14px_36px_rgba(15,23,42,0.12),inset_0_1px_1px_rgba(255,255,255,0.98)] dark:shadow-[0_14px_36px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.16)]"
        )}
      >
        <GlassSheen className="rounded-full" />
        <span
          data-desk-score={score}
          className={cn(
            "relative z-10 font-(family-name:--font-mono-modern) tabular-nums leading-none tracking-tight",
            shifting ? "transition-none" : "transition-[font-size,opacity] duration-500 ease-out",
            featured
              ? "text-xl font-normal text-foreground sm:text-[1.35rem]"
              : "text-base font-normal text-foreground/75"
          )}
        >
          {score}
        </span>
      </span>
      <p
        className={cn(
          "text-center text-[9px] tracking-wide",
          shifting ? "transition-none" : "transition-opacity duration-500",
          featured ? "text-muted-foreground" : "text-muted-foreground/75"
        )}
      >
        {label}
      </p>
    </div>
  )
}

function ToneBadge({
  tone,
  label,
}: {
  tone: DeskNewsTone
  label: string
}) {
  const Icon =
    tone === "positive"
      ? TrendingUpIcon
      : tone === "negative"
        ? TrendingDownIcon
        : MinusIcon

  return (
    <span
      title={label}
      aria-label={label}
      className={cn(landingGlassOrb, "size-7 shrink-0 text-foreground")}
    >
      <GlassSheen className="rounded-full" />
      <span className="relative z-10 flex size-full items-center justify-center">
        <Icon className="size-3.5" strokeWidth={3.75} aria-hidden />
      </span>
    </span>
  )
}

function DeskNewsRow({
  item,
  featured,
  shifting,
  leadLabel,
  impactLabel,
  toneLabel,
  source,
  time,
  headline,
}: {
  item: DeskNewsItem
  featured?: boolean
  shifting?: boolean
  leadLabel: string
  impactLabel: string
  toneLabel: string
  source: string
  time: string
  headline: string
}) {
  return (
    <li
      data-desk-row
      data-flip-id={item.id}
      className={cn(
        "relative flex items-center gap-4 px-5 will-change-transform sm:gap-5 sm:px-8",
        shifting
          ? "transition-none"
          : "transition-[background-color,padding] duration-500 ease-out",
        featured
          ? "bg-white/28 py-5 sm:py-6 dark:bg-white/6"
          : "bg-transparent py-4 sm:py-4.5"
      )}
    >
      <div className="relative z-10 min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <ToneBadge tone={item.tone} label={toneLabel} />
          <span
            className={cn(
              "inline-flex overflow-hidden",
              shifting
                ? "transition-none"
                : "transition-[max-width,opacity,margin] duration-500 ease-out",
              featured
                ? "me-0.5 max-w-40 opacity-100"
                : "pointer-events-none max-w-0 opacity-0"
            )}
          >
            <GlassTag className="whitespace-nowrap">{leadLabel}</GlassTag>
          </span>
          <GlassTag>
            {source}
            <span className="mx-1.5 text-muted-foreground/40" aria-hidden>
              ·
            </span>
            {time}
          </GlassTag>
        </div>
        <h3
          className={cn(
            "mt-2.5 text-start sm:mt-3",
            shifting
              ? "transition-none"
              : "transition-[font-size,color,letter-spacing,line-height] duration-500 ease-out",
            featured
              ? cn(landingTitleCard, "text-foreground sm:text-xl")
              : "text-sm font-normal leading-snug tracking-[-0.01em] text-foreground/70 sm:text-[0.9375rem]"
          )}
        >
          {headline}
        </h3>
      </div>
      <ImpactScore
        score={item.impact}
        label={impactLabel}
        featured={featured}
        shifting={shifting}
      />
    </li>
  )
}

export function DeskSurfacesSection() {
  const t = useTranslations("modern.desk")
  const [board, setBoard] = useState<DeskNewsItem[]>(initialBoard)
  const [shifting, setShifting] = useState(false)
  const listRef = useRef<HTMLUListElement>(null)
  const articleRef = useRef<HTMLElement>(null)
  const firstTopsRef = useRef<Map<string, number> | null>(null)
  const shiftTweenRef = useRef<gsap.core.Timeline | null>(null)
  const cyclingRef = useRef(false)
  const busyRef = useRef(false)

  const toneLabel = (tone: DeskNewsTone) => {
    if (tone === "positive") return t("tonePositive")
    if (tone === "negative") return t("toneNegative")
    return t("toneNeutral")
  }

  useLayoutEffect(() => {
    ensureGsapScroll()
    gsap.registerPlugin(ScrollTrigger)

    const article = articleRef.current
    if (!article) return

    let intervalId: number | undefined

    const runCycle = () => {
      const list = listRef.current
      if (busyRef.current || !list) return
      busyRef.current = true

      try {
        if (prefersReducedMotion()) {
          setBoard((prev) => promoteLastToLead(prev))
          busyRef.current = false
          return
        }

        const rows = list.querySelectorAll<HTMLElement>("[data-desk-row]")
        const tops = new Map<string, number>()
        rows.forEach((row) => {
          const id = row.dataset.flipId
          if (id) tops.set(id, row.getBoundingClientRect().top)
        })
        firstTopsRef.current = tops
        setShifting(true)
        setBoard((prev) => promoteLastToLead(prev))
      } catch {
        firstTopsRef.current = null
        setShifting(false)
        busyRef.current = false
        setBoard((prev) => promoteLastToLead(prev))
      }
    }

    const start = () => {
      if (cyclingRef.current) return
      cyclingRef.current = true
      if (prefersReducedMotion()) return
      intervalId = window.setInterval(runCycle, DESK_NEWS_CYCLE_MS)
    }

    const stop = () => {
      cyclingRef.current = false
      busyRef.current = false
      if (intervalId !== undefined) {
        window.clearInterval(intervalId)
        intervalId = undefined
      }
      shiftTweenRef.current?.kill()
      shiftTweenRef.current = null
    }

    const st = ScrollTrigger.create({
      trigger: article,
      start: "top 82%",
      onEnter: start,
      onEnterBack: start,
      onLeave: stop,
      onLeaveBack: stop,
    })

    if (ScrollTrigger.isInViewport(article)) start()

    return () => {
      stop()
      st.kill()
    }
  }, [])

  useLayoutEffect(() => {
    const list = listRef.current
    const firstTops = firstTopsRef.current
    if (!list || !firstTops) return

    firstTopsRef.current = null

    const finishShift = () => {
      setShifting(false)
      busyRef.current = false
    }

    try {
      ensureGsapScroll()
      shiftTweenRef.current?.kill()

      // Flush layout so FLIP deltas use final featured sizes.
      void list.offsetHeight

      const rows = Array.from(
        list.querySelectorAll<HTMLElement>("[data-desk-row]")
      )

      const movers: HTMLElement[] = []
      const fromY: number[] = []

      rows.forEach((row) => {
        const id = row.dataset.flipId
        if (!id) return
        const prevTop = firstTops.get(id)
        if (prevTop === undefined) return
        const nextTop = row.getBoundingClientRect().top
        const dy = prevTop - nextTop
        if (Math.abs(dy) < 0.5) return
        movers.push(row)
        fromY.push(dy)
      })

      if (movers.length === 0) {
        queueMicrotask(finishShift)
        return
      }

      movers.forEach((row, i) => {
        gsap.set(row, {
          y: fromY[i],
          force3D: true,
          zIndex: fromY[i]! > 0 ? 4 : 1,
        })
      })

      const tl = gsap.timeline({
        defaults: {
          ease: SHIFT_EASE,
          duration: SHIFT_DURATION,
          force3D: true,
          overwrite: "auto",
        },
        onComplete: () => {
          gsap.set(movers, { clearProps: "transform,zIndex" })
          finishShift()
          shiftTweenRef.current = null
        },
      })

      tl.to(movers, { y: 0 }, 0)
      shiftTweenRef.current = tl
    } catch {
      shiftTweenRef.current?.kill()
      shiftTweenRef.current = null
      gsap.set(list.querySelectorAll<HTMLElement>("[data-desk-row]"), {
        clearProps: "transform,zIndex",
      })
      queueMicrotask(finishShift)
    }
  }, [board])

  return (
    <section id="desk" className={cn(landingSection, landingSectionBody)}>
      <ScrollReveal>
        <SectionHeader title={t("title")} subtitle={t("subtitle")} />
      </ScrollReveal>

      <ScrollRevealGroup
        stagger={0.08}
        className={cn(landingContentWide, landingAfterHeader)}
      >
        <article
          ref={articleRef}
          className={cn(
            landingGlassSurface,
            "relative overflow-hidden rounded-[1.75rem] bg-white/42 dark:bg-white/8"
          )}
        >
          <span
            aria-hidden
            className={cn(
              landingGlassSheen,
              "pointer-events-none absolute inset-0 rounded-[1.75rem]"
            )}
          />

          <ol className="sr-only">
            {board.map((item) => (
              <li key={item.id}>
                {t(`news.${item.id}.headline`)} — {item.impact}{" "}
                {t("impactLabel")}
              </li>
            ))}
          </ol>

          <ul
            ref={listRef}
            aria-live="polite"
            className="relative z-10 m-0 list-none divide-y divide-foreground/5 p-0 dark:divide-white/8"
          >
            {board.map((item, index) => (
              <DeskNewsRow
                key={item.id}
                item={item}
                featured={index === 0}
                shifting={shifting}
                leadLabel={t("lead")}
                impactLabel={t("impactLabel")}
                toneLabel={toneLabel(item.tone)}
                source={t(`news.${item.id}.source`)}
                time={t(`news.${item.id}.time`)}
                headline={t(`news.${item.id}.headline`)}
              />
            ))}
          </ul>
        </article>
      </ScrollRevealGroup>
    </section>
  )
}
