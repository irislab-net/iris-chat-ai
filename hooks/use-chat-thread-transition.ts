"use client"

import * as React from "react"

import {
  CHAT_MOTION,
  loadChatGsap,
  prefersChatReducedMotion,
  threadEnterX,
} from "@/lib/chat-motion"

/**
 * Light GSAP nudge+fade when the active conversation changes (mobile).
 * Skips first mount and reduced-motion users.
 */
export function useChatThreadTransition(
  conversationId: string,
  enabled: boolean,
  dir: "ltr" | "rtl"
) {
  const ref = React.useRef<HTMLDivElement>(null)
  const prevIdRef = React.useRef<string | null>(null)
  const skipFirstRef = React.useRef(true)
  const tweenRef = React.useRef<{ kill: () => void } | null>(null)

  React.useEffect(() => {
    if (!enabled) {
      prevIdRef.current = conversationId
      skipFirstRef.current = true
      return
    }

    const el = ref.current
    if (!el) {
      prevIdRef.current = conversationId
      return
    }

    if (skipFirstRef.current) {
      skipFirstRef.current = false
      prevIdRef.current = conversationId
      return
    }

    if (prevIdRef.current === conversationId) return
    prevIdRef.current = conversationId

    if (prefersChatReducedMotion()) return

    const fromX = threadEnterX(dir)
    let cancelled = false

    void loadChatGsap().then((gsap) => {
      if (cancelled || !ref.current) return
      tweenRef.current?.kill()
      tweenRef.current = gsap.fromTo(
        ref.current,
        {
          opacity: CHAT_MOTION.threadFromOpacity,
          x: fromX,
          force3D: true,
        },
        {
          opacity: 1,
          x: 0,
          duration: CHAT_MOTION.threadDuration,
          ease: CHAT_MOTION.ease,
          overwrite: true,
        }
      )
    })

    return () => {
      cancelled = true
      tweenRef.current?.kill()
      tweenRef.current = null
      // Clear transform leftovers so React can unmount the node cleanly.
      if (ref.current) {
        ref.current.style.opacity = ""
        ref.current.style.transform = ""
      }
    }
  }, [conversationId, enabled, dir])

  return ref
}
