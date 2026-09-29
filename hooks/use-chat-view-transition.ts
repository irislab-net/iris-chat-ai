"use client"

import * as React from "react"

import { transitionChatViews } from "@/lib/chat-gsap-transitions"
import {
  loadChatGsap,
  prefersChatReducedMotion,
} from "@/lib/chat-motion"

type ChatViewId = string

type UseChatViewTransitionOptions = {
  /** Active logical view id (e.g. "chat" | "settings"). */
  view: ChatViewId
  /** Enter from trailing edge (+1) or leading (-1). */
  enterFromSign?: 1 | -1
  enabled?: boolean
}

/**
 * Push-style view transition between two absolutely stacked panels.
 * Bind `currentRef` / `nextRef` to the outgoing and incoming surfaces when
 * `view` changes. Skips the first paint and reduced-motion users.
 */
export function useChatViewTransition({
  view,
  enterFromSign = 1,
  enabled = true,
}: UseChatViewTransitionOptions) {
  const currentRef = React.useRef<HTMLDivElement>(null)
  const nextRef = React.useRef<HTMLDivElement>(null)
  const prevViewRef = React.useRef<ChatViewId | null>(null)
  const skipFirstRef = React.useRef(true)
  const tlRef = React.useRef<{ kill: () => void } | null>(null)

  React.useEffect(() => {
    if (!enabled) {
      prevViewRef.current = view
      skipFirstRef.current = true
      return
    }

    const current = currentRef.current
    const next = nextRef.current
    if (!current || !next) {
      prevViewRef.current = view
      return
    }

    if (skipFirstRef.current) {
      skipFirstRef.current = false
      prevViewRef.current = view
      return
    }

    if (prevViewRef.current === view) return
    prevViewRef.current = view

    if (prefersChatReducedMotion()) return

    let cancelled = false
    void loadChatGsap().then((gsap) => {
      if (cancelled || !currentRef.current || !nextRef.current) return
      tlRef.current?.kill()
      tlRef.current = transitionChatViews(gsap, {
        currentView: currentRef.current,
        nextView: nextRef.current,
        enterFromSign,
      })
    })

    return () => {
      cancelled = true
      tlRef.current?.kill()
      tlRef.current = null
      current.style.opacity = ""
      current.style.transform = ""
      next.style.opacity = ""
      next.style.transform = ""
    }
  }, [view, enterFromSign, enabled])

  return { currentRef, nextRef }
}
