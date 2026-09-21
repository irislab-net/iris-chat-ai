"use client"

import * as React from "react"

const DESKTOP_QUERY = "(min-width: 1024px)"

function readIsDesktop(): boolean | null {
  if (typeof window === "undefined") return null
  return window.matchMedia(DESKTOP_QUERY).matches
}

/**
 * Tailwind `lg` and up (1024px). Tablets and iPads stay in the mobile shell.
 * SSR stays `null`; on the client we seed from matchMedia to avoid a blank boot frame.
 */
function useIsDesktop(): boolean | null {
  const [isDesktop, setIsDesktop] = React.useState<boolean | null>(readIsDesktop)

  React.useEffect(() => {
    const media = window.matchMedia(DESKTOP_QUERY)
    const apply = () => setIsDesktop(media.matches)
    apply()
    media.addEventListener("change", apply)
    return () => media.removeEventListener("change", apply)
  }, [])

  return isDesktop
}

export { useIsDesktop }
