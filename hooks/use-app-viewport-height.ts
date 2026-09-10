"use client"

import * as React from "react"

/** Keep the workspace flush with the visible browser viewport on mobile Safari/Chrome. */
export function useAppViewportHeight(enabled = true) {
  React.useEffect(() => {
    if (!enabled || typeof window === "undefined") return

    const root = document.documentElement

    function syncHeight() {
      const height = window.visualViewport?.height ?? window.innerHeight
      root.style.setProperty("--app-height", `${Math.round(height)}px`)
    }

    function syncDisplayMode() {
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        window.matchMedia("(display-mode: fullscreen)").matches ||
        (window.navigator as Navigator & { standalone?: boolean }).standalone ===
          true
      root.classList.toggle("display-standalone", standalone)
    }

    root.dataset.appShell = "true"
    syncHeight()
    syncDisplayMode()

    const viewport = window.visualViewport
    viewport?.addEventListener("resize", syncHeight)
    viewport?.addEventListener("scroll", syncHeight)
    window.addEventListener("resize", syncHeight)
    window.addEventListener("orientationchange", syncHeight)

    const displayQuery = window.matchMedia("(display-mode: standalone)")
    const onDisplayChange = () => syncDisplayMode()
    displayQuery.addEventListener("change", onDisplayChange)

    return () => {
      viewport?.removeEventListener("resize", syncHeight)
      viewport?.removeEventListener("scroll", syncHeight)
      window.removeEventListener("resize", syncHeight)
      window.removeEventListener("orientationchange", syncHeight)
      displayQuery.removeEventListener("change", onDisplayChange)
      root.style.removeProperty("--app-height")
      delete root.dataset.appShell
      root.classList.remove("display-standalone")
    }
  }, [enabled])
}
