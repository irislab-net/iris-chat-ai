"use client"

import * as React from "react"

const DESKTOP_QUERY = "(min-width: 1024px)"

/**
 * Tailwind `lg` and up (1024px). Tablets and iPads stay in the mobile shell.
 * `null` until mounted — avoid treating the SSR snapshot as a real phone.
 */
function useIsDesktop(): boolean | null {
  const [isDesktop, setIsDesktop] = React.useState<boolean | null>(null)

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
