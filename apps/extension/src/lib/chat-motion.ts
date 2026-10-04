"use client"

import * as React from "react"

/**
 * GSAP timing for mobile chat shell transitions (drawers + thread switch).
 * Kept separate from landing motion so chat can dynamic-import gsap only.
 */
export const CHAT_MOTION = {
  ease: "power3.out",
  easeIn: "power2.in",
  panelOpen: 0.35,
  panelClose: 0.3,
  backdropOpen: 0.3,
  backdropClose: 0.3,
  backdropOpacity: 0.4,
  /** Full-edge slide distance as xPercent. */
  panelXPercent: 100,
  /** Drag past this progress (0–1) snaps open; below snaps closed. */
  panelDragSnap: 0.42,
  /** Thread nudge on conversation switch (px). */
  threadX: 18,
  threadDuration: 0.32,
  threadFromOpacity: 0.35,
  /** Model pickers / glass popups. */
  popupOpen: 0.25,
  popupClose: 0.2,
  popupFromScale: 0.8,
  popupToScale: 0.9,
  popupEase: "back.out(1.7)",
  /** Chat → settings push: full-width parallel slide (opaque panels while moving). */
  viewDuration: 0.28,
  viewEase: "power3.out",
  viewXPercent: 100,
  viewRecedeXPercent: 100,
  viewRecedeOpacity: 1,
  viewRecedeScale: 1,
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
let gsapCached: GsapCore | null = null

/** Sync handle after the first successful `loadChatGsap()` (null until then). */
export function getChatGsapSync(): GsapCore | null {
  return gsapCached
}

/** Lazy-load gsap so it stays out of the static chat graph. */
export function loadChatGsap(): Promise<GsapCore> {
  if (!gsapPromise) {
    gsapPromise = import("gsap").then((mod) => {
      gsapCached = mod.gsap
      return mod.gsap
    })
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
