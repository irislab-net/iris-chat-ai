"use client"

import * as React from "react"

import {
  COOKIE_BANNER_REVEAL_MS,
  PWA_AFTER_CONSENT_GAP_MS,
  PWA_ENGAGEMENT_MS,
} from "@/lib/banner-timing"
import {
  getConsentSnapshot,
  getServerConsentSnapshot,
  subscribeConsent,
} from "@/lib/consent"

/**
 * Soft delay after mount — lets first paint / LCP settle before a legal banner.
 */
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

/**
 * PWA soft nudge timing:
 * 1. Consent must already be decided (never compete with cookie/privacy).
 * 2. Brief gap after consent so prompts do not stack.
 * 3. Then arm on first intentional input, or after engagement dwell.
 */
export function usePwaNudgeReveal(eligible: boolean) {
  const prefs = React.useSyncExternalStore(
    subscribeConsent,
    getConsentSnapshot,
    getServerConsentSnapshot
  )
  const consentResolved = prefs !== null
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    if (!eligible || !consentResolved) {
      queueMicrotask(() => setReady(false))
      return
    }

    let settled = false
    let engagementTimer = 0
    const interactionEvents = ["pointerdown", "keydown", "touchstart"] as const

    const arm = () => {
      if (settled) return
      settled = true
      setReady(true)
      for (const event of interactionEvents) {
        window.removeEventListener(event, arm)
      }
      window.clearTimeout(engagementTimer)
    }

    const gapTimer = window.setTimeout(() => {
      for (const event of interactionEvents) {
        window.addEventListener(event, arm, { once: true, passive: true })
      }
      engagementTimer = window.setTimeout(arm, PWA_ENGAGEMENT_MS)
    }, PWA_AFTER_CONSENT_GAP_MS)

    return () => {
      settled = true
      window.clearTimeout(gapTimer)
      window.clearTimeout(engagementTimer)
      for (const event of interactionEvents) {
        window.removeEventListener(event, arm)
      }
      queueMicrotask(() => setReady(false))
    }
  }, [eligible, consentResolved])

  return eligible && consentResolved && ready
}
