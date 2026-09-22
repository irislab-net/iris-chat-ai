"use client"

import dynamic from "next/dynamic"

/** Hero mesh is decorative — defer chat Gemini CSS/JS off the LCP path. */
const HeroLiquidGlassBg = dynamic(
  () =>
    import("@/components/landing/modern/hero-liquid-glass-bg").then(
      (m) => m.HeroLiquidGlassBg
    ),
  { ssr: false }
)

export function HeroLiquidGlassBgLazy({ tone }: { tone?: "blue" }) {
  return <HeroLiquidGlassBg tone={tone} />
}
