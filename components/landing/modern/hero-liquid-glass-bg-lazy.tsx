"use client"

import dynamic from "next/dynamic"
import * as React from "react"

/** Hero mesh is decorative — defer chat Gemini CSS/JS off the LCP path. */
const HeroLiquidGlassBg = dynamic(
  () =>
    import("@/components/landing/modern/hero-liquid-glass-bg").then(
      (m) => m.HeroLiquidGlassBg
    ),
  { ssr: false }
)

export function HeroLiquidGlassBgLazy({ tone }: { tone?: "blue" }) {
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    let idleHandle: number | undefined
    let timeoutHandle: number | undefined
    const enable = () => setReady(true)

    if (typeof window.requestIdleCallback === "function") {
      idleHandle = window.requestIdleCallback(enable, { timeout: 2500 })
    } else {
      timeoutHandle = window.setTimeout(enable, 400)
    }

    return () => {
      if (idleHandle !== undefined) window.cancelIdleCallback(idleHandle)
      if (timeoutHandle !== undefined) window.clearTimeout(timeoutHandle)
    }
  }, [])

  if (!ready) return null
  return <HeroLiquidGlassBg tone={tone} />
}
