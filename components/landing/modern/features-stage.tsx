"use client"

import type { ReactNode } from "react"

import {
  FeaturesViewportGlassBg,
  useFeaturesLiteGlass,
} from "@/components/landing/modern/features-glass-wash"
import {
  landingCardRadius,
  landingGlassSheen,
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

/**
 * Full-bleed glass demo stage — same language as signal-wait / desk.
 *
 * On phone-class viewports we skip live `backdrop-filter` + animated Gemini
 * mesh (both stack hard during scroll and trip Chrome/WebKit
 * “A problem repeatedly occurred” when many stages share a long page).
 */
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
  const lite = useFeaturesLiteGlass()

  return (
    <div
      className={cn(
        landingCardRadius,
        "relative isolate overflow-hidden",
        lite
          ? "bg-white/95 shadow-[0_16px_48px_rgba(15,23,42,0.08),inset_0_1px_1px_rgba(255,255,255,0.92),inset_0_-1px_2px_rgba(255,255,255,0.28)] dark:bg-white/10 dark:shadow-[0_16px_48px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.12)]"
          : "bg-white/40 shadow-[0_16px_48px_rgba(15,23,42,0.08),inset_0_1px_1px_rgba(255,255,255,0.92),inset_0_-1px_2px_rgba(255,255,255,0.28)] backdrop-blur-2xl dark:bg-white/6 dark:shadow-[0_16px_48px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.12),inset_0_-1px_2px_rgba(255,255,255,0.04)]",
        className
      )}
    >
      {tone === "blue" ? <FeaturesViewportGlassBg tone="blue" /> : null}
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
