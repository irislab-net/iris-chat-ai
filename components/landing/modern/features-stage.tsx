import type { ReactNode } from "react"

import { HeroLiquidGlassBg } from "@/components/landing/modern/hero-liquid-glass-bg"
import {
  landingCardRadius,
  landingGlassSheen,
  landingGlassSurface,
} from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

function GlassSheen({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        landingGlassSheen,
        "pointer-events-none absolute inset-0",
        className
      )}
    />
  )
}

/** Full-bleed glass demo stage — same language as signal-wait / desk. */
export function FeaturesDemoStage({
  children,
  className,
  contentClassName,
  tone = "blue",
}: {
  children: ReactNode
  className?: string
  contentClassName?: string
  tone?: "blue" | "neutral"
}) {
  return (
    <div
      className={cn(
        landingGlassSurface,
        landingCardRadius,
        "relative isolate overflow-hidden bg-white/40 dark:bg-white/6",
        className
      )}
    >
      {tone === "blue" ? <HeroLiquidGlassBg tone="blue" /> : null}
      <GlassSheen className={landingCardRadius} />
      <div
        className={cn(
          // Tighter mobile inset so demo cards (signal / wait) keep readable
          // measure inside a 390px frame after page + card padding.
          "relative z-10 px-2.5 py-5 sm:px-8 sm:py-8 lg:px-10 lg:py-9",
          contentClassName
        )}
      >
        {children}
      </div>
    </div>
  )
}

export { GlassSheen as FeaturesGlassSheen }
