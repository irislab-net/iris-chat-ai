"use client"

import * as React from "react"

import { COOKIE_BANNER_REVEAL_MS } from "@/lib/banner-timing"

/** Soft delay after mount — lets first paint settle before a legal banner. */
export function useDelayedReveal(enabled: boolean, delayMs: number) {
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    if (!enabled) {
      queueMicrotask(() => setReady(false))
      return
    }

    let cancelled = false
    const timer = window.setTimeout(() => {
      if (!cancelled) setReady(true)
    }, delayMs)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
      queueMicrotask(() => setReady(false))
    }
  }, [enabled, delayMs])

  return enabled && ready
}

/** Cookie/privacy banner: short post-paint delay, then show if still undecided. */
export function useCookieBannerReveal(needsConsent: boolean) {
  return useDelayedReveal(needsConsent, COOKIE_BANNER_REVEAL_MS)
}
