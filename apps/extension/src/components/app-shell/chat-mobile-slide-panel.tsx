"use client"

import * as React from "react"
import { useLocale } from "next-intl"

import {
  CHAT_MOTION,
  prefersChatReducedMotion,
  slideOffscreenXPercent,
} from "@/lib/chat-motion"
import { localeDirection } from "@/lib/i18n/locale"
import { cn } from "@/lib/utils"

type ChatMobileSlidePanelProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Logical edge — maps to physical left/right via locale direction. */
  side: "start" | "end"
  children: React.ReactNode
  className?: string
  panelClassName?: string
  /** Accessible name when no visible title is present. */
  label?: string
  /** Show dimmed underlay (click closes). Default true. */
  backdrop?: boolean
}

/**
 * Full-bleed mobile drawer with edge slide + exit keep-alive.
 *
 * Uses CSS transforms/transitions (not GSAP tweens on this node).
 * GSAP xPercent was leaving the panel stuck at translate3d(-100%,0,0)
 * after the backdrop tween completed — CSS is reliable for this drawer.
 */
function ChatMobileSlidePanel({
  open,
  onOpenChange,
  side,
  children,
  className,
  panelClassName,
  label,
  backdrop = true,
}: ChatMobileSlidePanelProps) {
  const dir = localeDirection(useLocale())
  const off = slideOffscreenXPercent(side, dir)
  const reduced = prefersChatReducedMotion()

  const [mounted, setMounted] = React.useState(false)
  const [visible, setVisible] = React.useState(false)
  const panelRef = React.useRef<HTMLDivElement>(null)
  const closeTimerRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    if (closeTimerRef.current != null) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }

    if (open) {
      const id = window.requestAnimationFrame(() => {
        setMounted(true)
        window.requestAnimationFrame(() => setVisible(true))
      })
      return () => window.cancelAnimationFrame(id)
    }

    const hideId = window.requestAnimationFrame(() => {
      setVisible(false)
    })
    if (!mounted) {
      return () => window.cancelAnimationFrame(hideId)
    }

    if (reduced) {
      const unmountId = window.requestAnimationFrame(() => {
        setMounted(false)
      })
      return () => {
        window.cancelAnimationFrame(hideId)
        window.cancelAnimationFrame(unmountId)
      }
    }

    closeTimerRef.current = window.setTimeout(() => {
      setMounted(false)
      closeTimerRef.current = null
    }, CHAT_MOTION.panelClose * 1000 + 40)

    return () => {
      window.cancelAnimationFrame(hideId)
      if (closeTimerRef.current != null) {
        window.clearTimeout(closeTimerRef.current)
        closeTimerRef.current = null
      }
    }
  }, [open, mounted, reduced])

  React.useEffect(() => {
    if (!mounted || !open) return
    panelRef.current?.focus({ preventScroll: true })
  }, [mounted, open, visible])

  React.useEffect(() => {
    if (!mounted || !open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault()
        onOpenChange(false)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [mounted, open, onOpenChange])

  if (!mounted) return null

  const durationMs = reduced
    ? 0
    : Math.round(
        (open ? CHAT_MOTION.panelOpen : CHAT_MOTION.panelClose) * 1000
      )
  const ease = open
    ? "cubic-bezier(0.22, 1, 0.36, 1)"
    : "cubic-bezier(0.4, 0, 1, 1)"

  return (
    <div
      data-slot="chat-mobile-slide-panel"
      data-state={visible ? "open" : "closed"}
      className={cn("absolute inset-0 z-30", className)}
    >
      {backdrop ? (
        <div
          aria-hidden
          className="absolute inset-0 bg-black"
          style={{
            opacity: visible ? CHAT_MOTION.backdropOpacity : 0,
            pointerEvents: open ? "auto" : "none",
            transition: reduced
              ? "none"
              : `opacity ${Math.round(CHAT_MOTION.backdropOpen * 1000)}ms ${ease}`,
          }}
          onClick={() => onOpenChange(false)}
        />
      ) : null}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className={cn(
          "absolute inset-0 flex min-h-0 flex-col outline-none will-change-transform",
          panelClassName
        )}
        style={{
          transform: visible
            ? "translate3d(0,0,0)"
            : `translate3d(${off}%,0,0)`,
          transition: reduced ? "none" : `transform ${durationMs}ms ${ease}`,
        }}
      >
        {children}
      </div>
    </div>
  )
}

export { ChatMobileSlidePanel }
