"use client"

import * as React from "react"

/** Mirrors `@base-ui/utils` InteractionType without a direct package import. */
type InteractionType = "mouse" | "touch" | "pen" | "keyboard" | ""

const RESUME_OUTSIDE_PRESS_GRACE_MS = 400

let overlayOpenCount = 0
let resumeGraceUntil = 0
let resumeListenersAttached = false

function syncOverlayOpenAttr() {
  if (typeof document === "undefined") return
  if (overlayOpenCount > 0) {
    document.documentElement.dataset.overlayOpen = "true"
  } else {
    delete document.documentElement.dataset.overlayOpen
  }
}

function markResumeGrace() {
  resumeGraceUntil = Date.now() + RESUME_OUTSIDE_PRESS_GRACE_MS
}

function ensureResumeListeners() {
  if (typeof window === "undefined" || resumeListenersAttached) return
  resumeListenersAttached = true

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") markResumeGrace()
  })
  window.addEventListener("pageshow", markResumeGrace)
}

/** True while any Sheet/Dialog overlay holds the global open signal. */
export function isOverlayOpen(): boolean {
  return overlayOpenCount > 0
}

export function isResumeOutsidePressGrace(): boolean {
  return Date.now() < resumeGraceUntil
}

/**
 * Refcount open overlays onto `html[data-overlay-open]` so CSS can freeze
 * live blur / Gemini mesh under portals on mobile.
 */
export function useOverlayOpenSignal(open: boolean) {
  React.useEffect(() => {
    ensureResumeListeners()
  }, [])

  React.useEffect(() => {
    if (!open) return
    overlayOpenCount += 1
    syncOverlayOpenAttr()
    return () => {
      overlayOpenCount = Math.max(0, overlayOpenCount - 1)
      syncOverlayOpenAttr()
    }
  }, [open])
}

type ChangeDetails = {
  reason: string
  cancel: () => void
}

/**
 * Ignore synthetic `outside-press` closes for a short window after the tab
 * becomes visible again (app switch / leave Chrome → return).
 */
export function useGuardedOverlayOpenChange<T extends ChangeDetails>(
  onOpenChange: ((open: boolean, eventDetails: T) => void) | undefined,
  setUncontrolledOpen?: React.Dispatch<React.SetStateAction<boolean>>
) {
  return React.useCallback(
    (nextOpen: boolean, eventDetails: T) => {
      if (
        !nextOpen &&
        eventDetails.reason === "outside-press" &&
        isResumeOutsidePressGrace()
      ) {
        eventDetails.cancel()
        return
      }
      setUncontrolledOpen?.(nextOpen)
      onOpenChange?.(nextOpen, eventDetails)
    },
    [onOpenChange, setUncontrolledOpen]
  )
}

/**
 * Focus the popup container for touch / pen / empty interaction (controlled
 * opens leave openMethod empty). Keyboard and mouse keep first-tabbable.
 *
 * Hook form avoids passing a ref into a render-time factory (react-hooks/refs).
 */
export function useTouchSafeInitialFocus(
  popupRef: React.RefObject<HTMLElement | null>
): (openType: InteractionType) => boolean | HTMLElement | null {
  return React.useCallback((openType: InteractionType) => {
    if (openType === "keyboard" || openType === "mouse") {
      return true
    }
    return popupRef.current
  }, [popupRef])
}
