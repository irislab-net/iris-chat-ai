"use client"

import dynamic from "next/dynamic"

import { HERO } from "@/lib/landing-modern-data"
import { landingInner, landingTitleHero } from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

/** Demo is below the LCP title — load after first paint. */
const HeroComposeDemo = dynamic(
  () =>
    import("@/components/landing/modern/hero-compose-demo").then(
      (m) => m.HeroComposeDemo
    ),
  {
    ssr: false,
    loading: () => (
      <div
        className="mx-auto h-[220px] w-full max-w-xl rounded-2xl bg-foreground/[0.04]"
        aria-hidden
      />
    ),
  }
)

export function HeroSection() {
  return (
    <section className="flex min-h-0 flex-1 flex-col">
      {/* Visible immediately — do not wrap LCP copy in ScrollReveal (`invisible`). */}
      <div
        className={cn(
          landingInner,
          "flex min-h-0 flex-1 flex-col pb-8 pt-7 sm:pb-6 sm:pt-6 lg:pb-8 lg:pt-8"
        )}
      >
        <div className="shrink-0 text-center">
          <h1 className={landingTitleHero}>
            {HERO.titleBefore}
            <br className="sm:hidden" />{" "}
            {HERO.titleAfter}
          </h1>

          <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-muted-foreground sm:mt-6 sm:text-base lg:max-w-2xl lg:text-lg">
            {HERO.subtitle}
          </p>
        </div>

        <div className="mt-auto w-full shrink-0 overflow-visible pt-6 pb-1 sm:pt-6 sm:pb-0">
          <HeroComposeDemo />
        </div>
      </div>
    </section>
  )
}
