"use client"

import * as React from "react"

const RESYNC_DELAYS_MS = [0, 50, 150, 320, 520, 800] as const
/** Ignore small visualViewport jitter while the URL bar animates. */
const KEYBOARD_INSET_THRESHOLD_PX = 40

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  if (target.tagName === "TEXTAREA" || target.tagName === "INPUT") return true
  return target.isContentEditable
}

function readKeyboardInset(
  layoutHeight: number,
  visualHeight: number,
  offsetTop: number
) {
  return Math.max(0, layoutHeight - visualHeight - offsetTop)
}

/** Keep the workspace flush with the visible browser viewport on mobile Safari/Chrome. */
export function useAppViewportHeight(enabled = true) {
  React.useEffect(() => {
    if (!enabled || typeof window === "undefined") return

    const root = document.documentElement
    let syncFrame = 0
    const resyncTimers = new Set<number>()

    function isStandaloneDisplay() {
      return (
        root.classList.contains("display-standalone") ||
        window.matchMedia("(display-mode: standalone)").matches ||
        window.matchMedia("(display-mode: fullscreen)").matches ||
        (window.navigator as Navigator & { standalone?: boolean }).standalone ===
          true
      )
    }

    function clearViewportVars() {
      root.style.removeProperty("--app-height")
      root.style.removeProperty("--app-offset-top")
      root.style.removeProperty("--keyboard-inset-bottom")
      delete root.dataset.keyboardOpen
    }

    function syncViewport() {
      cancelAnimationFrame(syncFrame)
      syncFrame = requestAnimationFrame(() => {
        const standalone = isStandaloneDisplay()

        // Installed PWA: trust 100dvh/inset CSS — JS height sync causes bottom gaps.
        if (standalone) {
          clearViewportVars()
          if (window.scrollY !== 0 || window.scrollX !== 0) {
            window.scrollTo(0, 0)
          }
          return
        }

        const viewport = window.visualViewport
        const layoutHeight = window.innerHeight
        const visualHeight = Math.round(viewport?.height ?? layoutHeight)
        const offsetTop = Math.round(viewport?.offsetTop ?? 0)
        const keyboardInset = readKeyboardInset(
          layoutHeight,
          visualHeight,
          offsetTop
        )
        const editableFocused = isEditableTarget(document.activeElement)
        const keyboardOpen =
          editableFocused || keyboardInset > KEYBOARD_INSET_THRESHOLD_PX

        // Safari keeps visualViewport.height stale after the keyboard closes.
        const height = keyboardOpen ? visualHeight : layoutHeight
        const top = keyboardOpen ? offsetTop : 0
        const bottomInset = keyboardOpen ? keyboardInset : 0

        root.style.setProperty("--app-height", `${height}px`)
        root.style.setProperty("--app-offset-top", `${top}px`)
        root.style.setProperty("--keyboard-inset-bottom", `${bottomInset}px`)
        root.dataset.keyboardOpen = keyboardOpen ? "true" : "false"

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
      root.classList.toggle("display-standalone", isStandaloneDisplay())
    }

    function onViewportChange() {
      syncViewport()
    }

    function onEditableFocusChange(event: FocusEvent) {
      if (!isEditableTarget(event.target)) return
      if (event.type === "focusout") {
        syncViewport()
      }
      scheduleResync()
    }

    function onOrientationChange() {
      syncViewport()
      scheduleResync()
    }

    function onPageShow() {
      syncViewport()
      scheduleResync()
    }

    root.dataset.appShell = "true"
    syncDisplayMode()
    syncViewport()

    const viewport = window.visualViewport
    viewport?.addEventListener("resize", onViewportChange)
    viewport?.addEventListener("scroll", onViewportChange)
    viewport?.addEventListener("geometrychange", onViewportChange)
    window.addEventListener("resize", onViewportChange)
    window.addEventListener("orientationchange", onOrientationChange)
    window.addEventListener("pageshow", onPageShow)
    document.addEventListener("focusin", onEditableFocusChange, true)
    document.addEventListener("focusout", onEditableFocusChange, true)

    const displayQuery = window.matchMedia("(display-mode: standalone)")
    const onDisplayChange = () => {
      syncDisplayMode()
      syncViewport()
    }
    displayQuery.addEventListener("change", onDisplayChange)

    return () => {
      cancelAnimationFrame(syncFrame)
      clearScheduledResyncs()
      viewport?.removeEventListener("resize", onViewportChange)
      viewport?.removeEventListener("scroll", onViewportChange)
      viewport?.removeEventListener("geometrychange", onViewportChange)
      window.removeEventListener("resize", onViewportChange)
      window.removeEventListener("orientationchange", onOrientationChange)
      window.removeEventListener("pageshow", onPageShow)
      document.removeEventListener("focusin", onEditableFocusChange, true)
      document.removeEventListener("focusout", onEditableFocusChange, true)
      displayQuery.removeEventListener("change", onDisplayChange)
      clearViewportVars()
      delete root.dataset.appShell
      root.classList.remove("display-standalone")
    }
  }, [enabled])
}
