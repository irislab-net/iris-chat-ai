"use client"

import * as React from "react"

const DESKTOP_QUERY = "(min-width: 1024px)"

function subscribeDesktop(onStoreChange: () => void) {
  const media = window.matchMedia(DESKTOP_QUERY)
  media.addEventListener("change", onStoreChange)
  return () => media.removeEventListener("change", onStoreChange)
}

function getDesktopSnapshot(): boolean | null {
  return window.matchMedia(DESKTOP_QUERY).matches
}

/** Server + hydration must match; viewport is resolved only after hydrate. */
function getDesktopServerSnapshot(): boolean | null {
  return null
}

/**
 * Tailwind `lg` and up (1024px). Tablets and iPads stay in the mobile shell.
 * Returns `null` on the server and during hydration, then the live matchMedia value.
 */
function useIsDesktop(): boolean | null {
  return React.useSyncExternalStore(
    subscribeDesktop,
    getDesktopSnapshot,
    getDesktopServerSnapshot
  )
}

export { useIsDesktop }
