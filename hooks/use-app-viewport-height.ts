"use client"

import * as React from "react"

const RESYNC_DELAYS_MS = [0, 50, 150, 320, 520] as const

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  if (target.tagName === "TEXTAREA" || target.tagName === "INPUT") return true
  return target.isContentEditable
}

/** Keep the workspace flush with the visible browser viewport on mobile Safari/Chrome. */
export function useAppViewportHeight(enabled = true) {
  React.useEffect(() => {
    if (!enabled || typeof window === "undefined") return

    const root = document.documentElement
    let syncFrame = 0
    const resyncTimers = new Set<number>()

    function syncViewport() {
      cancelAnimationFrame(syncFrame)
      syncFrame = requestAnimationFrame(() => {
        const viewport = window.visualViewport
        const height = Math.round(viewport?.height ?? window.innerHeight)
        const offsetTop = Math.round(viewport?.offsetTop ?? 0)

        root.style.setProperty("--app-height", `${height}px`)
        root.style.setProperty("--app-offset-top", `${offsetTop}px`)

        // Safari scrolls the layout viewport when the keyboard opens — reset it.
        if (window.scrollY !== 0 || window.scrollX !== 0) {
          window.scrollTo(0, 0)
        }
      })
    }

    function clearScheduledResyncs() {
      for (const timer of resyncTimers) {
        window.clearTimeout(timer)
      }
      resyncTimers.clear()
    }

    function scheduleResync() {
      clearScheduledResyncs()
      for (const delay of RESYNC_DELAYS_MS) {
        const timer = window.setTimeout(() => {
          resyncTimers.delete(timer)
          syncViewport()
        }, delay)
        resyncTimers.add(timer)
      }
    }

    function syncDisplayMode() {
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        window.matchMedia("(display-mode: fullscreen)").matches ||
        (window.navigator as Navigator & { standalone?: boolean }).standalone ===
          true
      root.classList.toggle("display-standalone", standalone)
    }

    function onViewportChange() {
      syncViewport()
    }

    function onEditableFocusChange(event: FocusEvent) {
      if (!isEditableTarget(event.target)) return
      scheduleResync()
    }

    function onOrientationChange() {
      syncViewport()
      scheduleResync()
    }

    root.dataset.appShell = "true"
    syncViewport()
    syncDisplayMode()

    const viewport = window.visualViewport
    viewport?.addEventListener("resize", onViewportChange)
    viewport?.addEventListener("scroll", onViewportChange)
    window.addEventListener("resize", onViewportChange)
    window.addEventListener("orientationchange", onOrientationChange)
    document.addEventListener("focusin", onEditableFocusChange, true)
    document.addEventListener("focusout", onEditableFocusChange, true)

    const displayQuery = window.matchMedia("(display-mode: standalone)")
    const onDisplayChange = () => syncDisplayMode()
    displayQuery.addEventListener("change", onDisplayChange)

    return () => {
      cancelAnimationFrame(syncFrame)
      clearScheduledResyncs()
      viewport?.removeEventListener("resize", onViewportChange)
      viewport?.removeEventListener("scroll", onViewportChange)
      window.removeEventListener("resize", onViewportChange)
      window.removeEventListener("orientationchange", onOrientationChange)
      document.removeEventListener("focusin", onEditableFocusChange, true)
      document.removeEventListener("focusout", onEditableFocusChange, true)
      displayQuery.removeEventListener("change", onDisplayChange)
      root.style.removeProperty("--app-height")
      root.style.removeProperty("--app-offset-top")
      delete root.dataset.appShell
      root.classList.remove("display-standalone")
    }
  }, [enabled])
}
