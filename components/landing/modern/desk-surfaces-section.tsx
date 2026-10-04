"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useTranslations } from "next-intl"

import {
  DeskNewsBoard,
  initialDeskBoard,
} from "@/components/landing/modern/desk-news-board"
import {
  ScrollReveal,
  ScrollRevealGroup,
} from "@/components/landing/modern/scroll-reveal"
import { SectionHeader } from "@/components/landing/modern/sphere-ui"
import { ensureGsapScroll } from "@/lib/gsap-scroll"
import { prefersReducedMotion } from "@/lib/landing-motion"
import {
  DESK_NEWS_CYCLE_MS,
  type DeskNewsItem,
} from "@/lib/landing-modern-data"
import {
  landingAfterHeader,
  landingContentWide,
  landingSection,
  landingSectionBody,
} from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

const SHIFT_EASE = "power2.inOut"
const SHIFT_DURATION = 0.95

/** Last card rises to lead; the rest shift down one slot. */
function promoteLastToLead(board: DeskNewsItem[]): DeskNewsItem[] {
  if (board.length < 2) return board
  const last = board[board.length - 1]!
  return [last, ...board.slice(0, -1)]
}

export function DeskSurfacesSection() {
  const t = useTranslations("modern.desk")
  const [board, setBoard] = useState<DeskNewsItem[]>(initialDeskBoard)
  const [shifting, setShifting] = useState(false)
  const listRef = useRef<HTMLUListElement>(null)
  const articleRef = useRef<HTMLElement>(null)
  const firstTopsRef = useRef<Map<string, number> | null>(null)
  const shiftTweenRef = useRef<gsap.core.Timeline | null>(null)
  const cyclingRef = useRef(false)
  const busyRef = useRef(false)

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
        <DeskNewsBoard
          board={board}
          shifting={shifting}
          articleRef={articleRef}
          listRef={listRef}
        />
      </ScrollRevealGroup>
    </section>
  )
}
