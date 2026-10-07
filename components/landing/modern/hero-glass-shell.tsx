"use client"

import * as React from "react"

import {
  landingHeroCard,
  landingHeroGlass,
  landingHeroGlassSolid,
} from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

/**
 * SSR / first paint: solid hero (no backdrop-blur).
 * After idle: restore frosted glass without blocking LCP.
 */
export function HeroGlassShell({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const [frosted, setFrosted] = React.useState(false)

  React.useEffect(() => {
    let idleHandle: number | undefined
    let timeoutHandle: number | undefined
    const enable = () => setFrosted(true)

    if (typeof window.requestIdleCallback === "function") {
      idleHandle = window.requestIdleCallback(enable, { timeout: 1500 })
    } else {
      timeoutHandle = window.setTimeout(enable, 200)
    }

    return () => {
      if (idleHandle !== undefined) window.cancelIdleCallback(idleHandle)
      if (timeoutHandle !== undefined) window.clearTimeout(timeoutHandle)
    }
  }, [])

  return (
    <div
      id="hero"
      className={cn(
        landingHeroCard,
        frosted ? landingHeroGlass : landingHeroGlassSolid,
        className
      )}
    >
      {children}
    </div>
  )
}
