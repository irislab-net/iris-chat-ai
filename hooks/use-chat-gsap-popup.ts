"use client"

import * as React from "react"

import {
  closeChatPopup,
  openChatPopup,
} from "@/lib/chat-gsap-transitions"
import {
  loadChatGsap,
  prefersChatReducedMotion,
} from "@/lib/chat-motion"

type UseChatGsapPopupOptions = {
  open: boolean
  /** CSS transform-origin for the scale spring. */
  transformOrigin?: string
  /** When false, skip GSAP (caller keeps CSS enter/exit). Default true. */
  enabled?: boolean
  /**
   * `both` — open + close tweens.
   * `open-only` — GSAP enter; leave exit to CSS/presence (Base UI dialogs).
   */
  phase?: "both" | "open-only"
}

/**
 * Scale + opacity popup motion via GSAP (`back.out` open / `power2.in` close).
 * Attach `ref` to the popup surface.
 */
export function useChatGsapPopup({
  open,
  transformOrigin = "top left",
  enabled = true,
  phase = "both",
}: UseChatGsapPopupOptions) {
  const ref = React.useRef<HTMLDivElement>(null)
  const tlRef = React.useRef<{ kill: () => void } | null>(null)
  const wasOpenRef = React.useRef(false)

  React.useLayoutEffect(() => {
    if (!enabled) return
    const el = ref.current
    if (!el) return

    let cancelled = false
    const reduced = prefersChatReducedMotion()

    void loadChatGsap().then((gsap) => {
      if (cancelled || !ref.current) return
      tlRef.current?.kill()

      if (open) {
        wasOpenRef.current = true
        tlRef.current = openChatPopup(gsap, {
          popupEl: ref.current,
          transformOrigin,
          reducedMotion: reduced,
        })
        return
      }

      if (!wasOpenRef.current) return
      wasOpenRef.current = false
      if (phase === "open-only") {
        gsap.set(ref.current, {
          clearProps: "transform,translate,x,y,xPercent,yPercent,scale,opacity",
        })
        return
      }
      tlRef.current = closeChatPopup(gsap, {
        popupEl: ref.current,
        reducedMotion: reduced,
      })
    })

    return () => {
      cancelled = true
      tlRef.current?.kill()
      tlRef.current = null
      el.style.opacity = ""
      el.style.transform = ""
    }
  }, [open, transformOrigin, enabled, phase])

  return ref
}
