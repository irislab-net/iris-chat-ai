"use client"

import * as React from "react"
import { useLocale } from "next-intl"

import {
  closeChatSidebar,
  openChatSidebar,
  setChatSidebarProgress,
} from "@/lib/chat-gsap-transitions"
import {
  CHAT_MOTION,
  loadChatGsap,
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
  /** Edge drag to scrub open/close. Default true. */
  draggable?: boolean
}

type GsapCore = typeof import("gsap").gsap

/**
 * Full-bleed mobile drawer: GSAP timeline for panel xPercent + scrim opacity.
 * Clears transform leftovers on close to avoid stuck offscreen panels.
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
  draggable = true,
}: ChatMobileSlidePanelProps) {
  const dir = localeDirection(useLocale())
  const off = slideOffscreenXPercent(side, dir)

  const [mounted, setMounted] = React.useState(false)
  const panelRef = React.useRef<HTMLDivElement>(null)
  const scrimRef = React.useRef<HTMLDivElement>(null)
  const tlRef = React.useRef<{ kill: () => void } | null>(null)
  const gsapRef = React.useRef<GsapCore | null>(null)
  const openRef = React.useRef(open)
  const draggingRef = React.useRef(false)
  const dragPendingRef = React.useRef(false)
  const dragStartXRef = React.useRef(0)
  const dragStartYRef = React.useRef(0)
  const dragPointerIdRef = React.useRef<number | null>(null)
  const dragWidthRef = React.useRef(0)

  openRef.current = open

  // Keep mounted while open, or during close tween.
  React.useEffect(() => {
    if (open) {
      setMounted(true)
    }
  }, [open])

  React.useEffect(() => {
    if (!mounted) return

    const panel = panelRef.current
    if (!panel) return

    let cancelled = false
    const reduced = prefersChatReducedMotion()

    void loadChatGsap().then((gsap) => {
      if (cancelled || !panelRef.current) return
      gsapRef.current = gsap
      tlRef.current?.kill()

      const scrim = scrimRef.current
      if (open) {
        tlRef.current = openChatSidebar(gsap, {
          sidebarEl: panelRef.current,
          scrimEl: backdrop ? scrim : null,
          offscreenXPercent: off,
          reducedMotion: reduced,
        })
        return
      }

      tlRef.current = closeChatSidebar(gsap, {
        sidebarEl: panelRef.current,
        scrimEl: backdrop ? scrim : null,
        offscreenXPercent: off,
        reducedMotion: reduced,
        onComplete: () => {
          if (!cancelled && !openRef.current) {
            setMounted(false)
          }
        },
      })
    })

    return () => {
      cancelled = true
      tlRef.current?.kill()
      tlRef.current = null
      // Drop inline GSAP styles so React can unmount cleanly.
      panel.style.transform = ""
      panel.style.opacity = ""
      if (scrimRef.current) {
        scrimRef.current.style.opacity = ""
        scrimRef.current.style.display = ""
      }
    }
  }, [mounted, open, off, backdrop])

  React.useEffect(() => {
    if (!mounted || !open) return
    panelRef.current?.focus({ preventScroll: true })
  }, [mounted, open])

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

  const onPointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!draggable || !open || prefersChatReducedMotion()) return
      if (event.pointerType === "mouse" && event.button !== 0) return
      // Ignore interactive controls inside the drawer.
      const target = event.target as HTMLElement | null
      if (
        target?.closest(
          "button, a, input, textarea, select, [role='button'], [role='menuitem'], [data-no-drawer-drag]"
        )
      ) {
        return
      }

      dragPendingRef.current = true
      draggingRef.current = false
      dragStartXRef.current = event.clientX
      dragStartYRef.current = event.clientY
      dragPointerIdRef.current = event.pointerId
      dragWidthRef.current =
        panelRef.current?.getBoundingClientRect().width || window.innerWidth
    },
    [draggable, open]
  )

  const onPointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!dragPendingRef.current && !draggingRef.current) return
      if (
        dragPointerIdRef.current != null &&
        event.pointerId !== dragPointerIdRef.current
      ) {
        return
      }

      const dx = event.clientX - dragStartXRef.current
      const dy = event.clientY - dragStartYRef.current

      if (!draggingRef.current) {
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return
        // Vertical scroll wins — abandon drawer drag.
        if (Math.abs(dy) >= Math.abs(dx)) {
          dragPendingRef.current = false
          return
        }
        const gsap = gsapRef.current
        const panel = panelRef.current
        if (!gsap || !panel) {
          dragPendingRef.current = false
          return
        }
        draggingRef.current = true
        dragPendingRef.current = false
        tlRef.current?.kill()
        try {
          panel.setPointerCapture(event.pointerId)
        } catch {
          /* ignore */
        }
      }

      const gsap = gsapRef.current
      const panel = panelRef.current
      if (!gsap || !panel) return

      const width = dragWidthRef.current || 1
      // Dragging toward offscreen reduces progress.
      const signedDelta =
        off < 0 ? Math.min(0, dx) : Math.max(0, dx)
      const progress = 1 - Math.min(1, Math.abs(signedDelta) / width)
      setChatSidebarProgress(gsap, {
        sidebarEl: panel,
        scrimEl: backdrop ? scrimRef.current : null,
        offscreenXPercent: off,
        progress,
      })
    },
    [backdrop, off]
  )

  const endDrag = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (
        dragPointerIdRef.current != null &&
        event.pointerId !== dragPointerIdRef.current
      ) {
        return
      }

      const wasDragging = draggingRef.current
      dragPendingRef.current = false
      draggingRef.current = false
      dragPointerIdRef.current = null

      if (!wasDragging) return

      try {
        panelRef.current?.releasePointerCapture(event.pointerId)
      } catch {
        /* already released */
      }

      const gsap = gsapRef.current
      const panel = panelRef.current
      if (!gsap || !panel) return

      const width = dragWidthRef.current || 1
      const dx = event.clientX - dragStartXRef.current
      const signedDelta =
        off < 0 ? Math.min(0, dx) : Math.max(0, dx)
      const progress = 1 - Math.min(1, Math.abs(signedDelta) / width)

      if (progress < CHAT_MOTION.panelDragSnap) {
        onOpenChange(false)
      } else {
        tlRef.current?.kill()
        tlRef.current = openChatSidebar(gsap, {
          sidebarEl: panel,
          scrimEl: backdrop ? scrimRef.current : null,
          offscreenXPercent: off,
          reducedMotion: false,
        })
      }
    },
    [backdrop, off, onOpenChange]
  )

  if (!mounted) return null

  return (
    <div
      data-slot="chat-mobile-slide-panel"
      data-state={open ? "open" : "closed"}
      className={cn("absolute inset-0 z-30", className)}
    >
      {backdrop ? (
        <div
          ref={scrimRef}
          aria-hidden
          className="absolute inset-0 bg-black"
          style={{ opacity: 0, pointerEvents: open ? "auto" : "none" }}
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
          "absolute inset-0 flex min-h-0 flex-col outline-none will-change-transform touch-pan-y",
          panelClassName
        )}
        style={{ transform: `translate3d(${off}%,0,0)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {children}
      </div>
    </div>
  )
}

export { ChatMobileSlidePanel }
