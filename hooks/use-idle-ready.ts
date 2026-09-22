"use client"

import * as React from "react"

/**
 * True after first user interaction, or after idle/`timeoutMs` as a fallback.
 * Keeps third-party scripts out of Lighthouse / early TBT windows.
 */
export function useInteractionOrIdleReady(
  enabled: boolean,
  timeoutMs = 12_000
) {
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    if (!enabled) {
      setReady(false)
      return
    }

    let settled = false
    const arm = () => {
      if (settled) return
      settled = true
      setReady(true)
    }

    const events = ["pointerdown", "keydown", "touchstart", "scroll"] as const
    for (const event of events) {
      window.addEventListener(event, arm, { once: true, passive: true })
    }

    const idle = window.requestIdleCallback
    let idleHandle: number | undefined
    let timeoutHandle: number | undefined
    if (typeof idle === "function") {
      idleHandle = idle(arm, { timeout: timeoutMs })
    } else {
      timeoutHandle = window.setTimeout(arm, timeoutMs)
    }

    return () => {
      for (const event of events) {
        window.removeEventListener(event, arm)
      }
      if (idleHandle !== undefined) window.cancelIdleCallback(idleHandle)
      if (timeoutHandle !== undefined) window.clearTimeout(timeoutHandle)
    }
  }, [enabled, timeoutMs])

  return ready
}

/** @deprecated Prefer useInteractionOrIdleReady for third-party scripts. */
export function useIdleReady(enabled: boolean, timeoutMs = 4000) {
  return useInteractionOrIdleReady(enabled, timeoutMs)
}
