"use client"

import * as React from "react"

/**
 * Loads chat Gemini mesh CSS after first paint so it stays off the LCP
 * critical path. Sample-prompt text styles live in Tailwind separately.
 */
export function ChatGeminiCssLazy() {
  React.useEffect(() => {
    let idleHandle: number | undefined
    let timeoutHandle: number | undefined
    let cancelled = false

    const load = () => {
      if (cancelled) return
      void import("@/app/styles/chat-gemini.css")
    }

    if (typeof window.requestIdleCallback === "function") {
      idleHandle = window.requestIdleCallback(load, { timeout: 1500 })
    } else {
      timeoutHandle = window.setTimeout(load, 200)
    }

    return () => {
      cancelled = true
      if (idleHandle !== undefined) window.cancelIdleCallback(idleHandle)
      if (timeoutHandle !== undefined) window.clearTimeout(timeoutHandle)
    }
  }, [])

  return null
}
