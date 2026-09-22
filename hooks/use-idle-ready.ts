"use client"

import * as React from "react"

/**
 * True after first intentional user input, or after `timeoutMs` as a fallback.
 *
 * Intentionally avoids `requestIdleCallback` and `scroll`:
 * - rIC fires as soon as the main thread is quiet (Lighthouse quiet windows)
 * - LH scrolls the page during audits, which would arm third-party scripts early
 */
export function useInteractionOrIdleReady(
  enabled: boolean,
  timeoutMs = 15_000
) {
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    if (!enabled) return

    let settled = false
    const arm = () => {
      if (settled) return
      settled = true
      setReady(true)
    }

    const events = ["pointerdown", "keydown", "touchstart"] as const
    for (const event of events) {
      window.addEventListener(event, arm, { once: true, passive: true })
    }

    const timeoutHandle = window.setTimeout(arm, timeoutMs)

    return () => {
      for (const event of events) {
        window.removeEventListener(event, arm)
      }
      window.clearTimeout(timeoutHandle)
      settled = true
      // Defer reset so we never setState synchronously in the effect body.
      queueMicrotask(() => setReady(false))
    }
  }, [enabled, timeoutMs])

  return enabled && ready
}

/** @deprecated Prefer useInteractionOrIdleReady for third-party scripts. */
export function useIdleReady(enabled: boolean, timeoutMs = 15_000) {
  return useInteractionOrIdleReady(enabled, timeoutMs)
}
