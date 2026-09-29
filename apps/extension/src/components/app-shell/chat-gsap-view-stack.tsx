"use client"

import * as React from "react"

import { transitionChatViews } from "@/lib/chat-gsap-transitions"
import {
  loadChatGsap,
  prefersChatReducedMotion,
} from "@/lib/chat-motion"
import { cn } from "@/lib/utils"

type ChatGsapViewStackProps = {
  /** Active view key — changing it runs the push transition. */
  active: string
  /** Logical enter direction for the incoming view. */
  enterFromSign?: 1 | -1
  className?: string
  children: React.ReactNode
}

/**
 * Stacked full-bleed views with GSAP push transition (chat → settings pattern).
 * Each direct child needs a stable `data-view` attribute matching `active`.
 */
function ChatGsapViewStack({
  active,
  enterFromSign = 1,
  className,
  children,
}: ChatGsapViewStackProps) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const prevActiveRef = React.useRef(active)
  const skipFirstRef = React.useRef(true)
  const tlRef = React.useRef<{ kill: () => void } | null>(null)

  const syncVisibility = React.useCallback(
    (activeKey: string, opts?: { hideOthers: boolean }) => {
      const root = rootRef.current
      if (!root) return
      const views = Array.from(
        root.querySelectorAll<HTMLElement>(":scope > [data-view]")
      )
      for (const view of views) {
        const isActive = view.dataset.view === activeKey
        if (isActive) {
          view.hidden = false
          view.style.display = "flex"
          view.setAttribute("aria-hidden", "false")
          continue
        }
        if (opts?.hideOthers !== false) {
          view.hidden = true
          view.style.display = "none"
          view.setAttribute("aria-hidden", "true")
          view.style.opacity = ""
          view.style.transform = ""
        }
      }
    },
    []
  )

  // Initial paint only — transitions own visibility after that.
  React.useLayoutEffect(() => {
    if (!skipFirstRef.current) return
    syncVisibility(active, { hideOthers: true })
  }, [active, syncVisibility])

  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return

    if (skipFirstRef.current) {
      skipFirstRef.current = false
      prevActiveRef.current = active
      return
    }

    if (prevActiveRef.current === active) return

    const fromKey = prevActiveRef.current
    prevActiveRef.current = active

    const currentView = root.querySelector<HTMLElement>(
      `:scope > [data-view="${CSS.escape(fromKey)}"]`
    )
    const nextView = root.querySelector<HTMLElement>(
      `:scope > [data-view="${CSS.escape(active)}"]`
    )
    if (!currentView || !nextView) {
      syncVisibility(active, { hideOthers: true })
      return
    }

    currentView.hidden = false
    nextView.hidden = false
    currentView.style.display = "flex"
    nextView.style.display = "flex"
    currentView.setAttribute("aria-hidden", "true")
    nextView.setAttribute("aria-hidden", "false")

    if (prefersChatReducedMotion()) {
      syncVisibility(active, { hideOthers: true })
      return
    }

    let cancelled = false
    void loadChatGsap().then((gsap) => {
      if (cancelled) return
      tlRef.current?.kill()
      tlRef.current = transitionChatViews(gsap, {
        currentView,
        nextView,
        enterFromSign,
        onComplete: () => {
          if (cancelled) return
          syncVisibility(active, { hideOthers: true })
        },
      })
    })

    return () => {
      cancelled = true
      tlRef.current?.kill()
      tlRef.current = null
    }
  }, [active, enterFromSign, syncVisibility])

  return (
    <div
      ref={rootRef}
      data-slot="chat-gsap-view-stack"
      className={cn("relative isolate min-h-0 flex-1 overflow-hidden", className)}
    >
      {React.Children.map(children, (child) => {
        if (!React.isValidElement<{ className?: string }>(child)) return child
        return React.cloneElement(child, {
          className: cn(
            "absolute inset-0 flex min-h-0 flex-col will-change-transform",
            child.props.className
          ),
        })
      })}
    </div>
  )
}

export { ChatGsapViewStack }
