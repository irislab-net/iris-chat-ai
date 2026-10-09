"use client"

import * as React from "react"

import { trackChatThreadEngagement } from "@/lib/analytics"

/**
 * Measures visible time in an active chat thread (not empty new-chat).
 * Flushes on tab hide, conversation change, leaving the thread, or unmount.
 */
function useChatThreadEngagement(
  active: boolean,
  conversationId?: string
) {
  const startedAtRef = React.useRef<number | null>(null)
  const accumulatedMsRef = React.useRef(0)
  const conversationIdRef = React.useRef(conversationId)
  conversationIdRef.current = conversationId

  const flush = React.useEffectEvent(() => {
    if (startedAtRef.current != null) {
      accumulatedMsRef.current += Date.now() - startedAtRef.current
      startedAtRef.current = null
    }
    const ms = accumulatedMsRef.current
    accumulatedMsRef.current = 0
    if (ms <= 0) return
    trackChatThreadEngagement({
      duration_sec: Math.round(ms / 1000),
      conversation_id: conversationIdRef.current || undefined,
    })
  })

  const resume = React.useEffectEvent(() => {
    if (
      startedAtRef.current == null &&
      typeof document !== "undefined" &&
      document.visibilityState === "visible"
    ) {
      startedAtRef.current = Date.now()
    }
  })

  React.useEffect(() => {
    if (!active) {
      flush()
      return
    }

    resume()

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        flush()
      } else {
        resume()
      }
    }

    document.addEventListener("visibilitychange", onVisibility)
    window.addEventListener("pagehide", flush)

    return () => {
      document.removeEventListener("visibilitychange", onVisibility)
      window.removeEventListener("pagehide", flush)
      flush()
    }
  }, [active, conversationId])
}

export { useChatThreadEngagement }
