"use client"

import * as React from "react"

/**
 * GSAP timing for mobile chat shell transitions (drawers + thread switch).
 * Kept separate from landing motion so chat can dynamic-import gsap only.
 */
export const CHAT_MOTION = {
  ease: "power3.out",
  easeIn: "power2.in",
  panelOpen: 0.42,
  panelClose: 0.34,
  backdropOpen: 0.36,
  backdropClose: 0.28,
  backdropOpacity: 0.22,
  /** Full-edge slide distance as xPercent. */
  panelXPercent: 100,
  /** Thread nudge on conversation switch (px). */
  threadX: 18,
  threadDuration: 0.32,
  threadFromOpacity: 0.35,
} as const

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)"

export function prefersChatReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia(REDUCED_MOTION_QUERY).matches
  )
}

export function useChatReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false)

  React.useEffect(() => {
    const query = window.matchMedia(REDUCED_MOTION_QUERY)
    queueMicrotask(() => setReduced(query.matches))

    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches)
    query.addEventListener("change", onChange)
    return () => query.removeEventListener("change", onChange)
  }, [])

  return reduced
}

type GsapCore = typeof import("gsap").gsap

let gsapPromise: Promise<GsapCore> | null = null

/** Lazy-load gsap so it stays out of the static chat graph. */
export function loadChatGsap(): Promise<GsapCore> {
  if (!gsapPromise) {
    gsapPromise = import("gsap").then((mod) => mod.gsap)
  }
  return gsapPromise
}

/** Logical side → signed xPercent offscreen (negative = left). */
export function slideOffscreenXPercent(
  side: "start" | "end",
  dir: "ltr" | "rtl"
): number {
  const fromStart = side === "start"
  const toLeft =
    (fromStart && dir === "ltr") || (!fromStart && dir === "rtl")
  return toLeft ? -CHAT_MOTION.panelXPercent : CHAT_MOTION.panelXPercent
}

/** Thread enter nudge: slide in from the trailing edge. */
export function threadEnterX(dir: "ltr" | "rtl"): number {
  return dir === "rtl" ? -CHAT_MOTION.threadX : CHAT_MOTION.threadX
}
