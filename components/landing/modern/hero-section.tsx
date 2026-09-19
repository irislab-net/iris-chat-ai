"use client"

import { HeroComposeDemo } from "@/components/landing/modern/hero-compose-demo"
import { ScrollRevealGroup } from "@/components/landing/modern/scroll-reveal"
import { HERO } from "@/lib/landing-modern-data"
import { landingInner, landingTitleHero } from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

export function HeroSection() {
  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <ScrollRevealGroup
        className={cn(
          landingInner,
          "flex min-h-0 flex-1 flex-col pb-8 pt-7 sm:pb-6 sm:pt-6 lg:pb-8 lg:pt-8"
        )}
      >
        <div className="shrink-0 text-center">
          <h1 className={landingTitleHero}>
            {HERO.titleBefore}
            <br className="sm:hidden" />
            {" "}
            {HERO.titleAfter}
          </h1>

          <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-[#64748B] sm:mt-6 sm:text-base lg:max-w-2xl lg:text-lg">
            {HERO.subtitle}
          </p>
        </div>

        <div className="mt-auto w-full shrink-0 overflow-visible pt-6 pb-1 sm:pt-6 sm:pb-0">
          <HeroComposeDemo />
        </div>
      </ScrollRevealGroup>
    </section>
  )
}
