"use client"

import dynamic from "next/dynamic"

/** Demo is below the LCP title — client-only so the server shell stays light. */
const HeroComposeDemo = dynamic(
  () =>
    import("@/components/landing/modern/hero-compose-demo").then(
      (m) => m.HeroComposeDemo
    ),
  {
    ssr: false,
    loading: () => (
      <div
        className="mx-auto h-55 w-full max-w-xl rounded-2xl bg-foreground/4"
        aria-hidden
      />
    ),
  }
)

export function HeroComposeDemoLazy() {
  return <HeroComposeDemo />
}
