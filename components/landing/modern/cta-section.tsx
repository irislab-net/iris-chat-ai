"use client"

import { HeroLiquidGlassBg } from "@/components/landing/modern/hero-liquid-glass-bg"
import { ScrollRevealGroup } from "@/components/landing/modern/scroll-reveal"
import { SectionHeader, SphereCta } from "@/components/landing/modern/sphere-ui"
import { CTA_SECTION } from "@/lib/landing-modern-data"
import {
  landingInner,
  landingSection,
  landingSectionBody,
} from "@/lib/landing-modern-styles"
import { getLaunchAppHref } from "@/lib/site"
import { cn } from "@/lib/utils"

export function CtaSection() {
  return (
    <section
      id="get-started"
      className={cn(
        landingSection,
        // Shares the standard section shell (radius, clip, vertical rhythm) so
        // the band sits on the same scale as every other section.
        landingSectionBody,
        // Glass shell from the hero card, so the shared mesh reads as one system.
        "bg-white/40 backdrop-blur-2xl shadow-[0_28px_80px_rgba(15,23,42,0.07)] dark:bg-white/6 dark:shadow-[0_28px_80px_rgba(0,0,0,0.45)]"
      )}
    >
      <HeroLiquidGlassBg tone="blue" />

      <div className={cn(landingInner, "relative z-10")}>
        <ScrollRevealGroup>
          <SectionHeader
            title={CTA_SECTION.title}
            subtitle={CTA_SECTION.subtitle}
            className="max-w-2xl"
          />

          <div className="mt-9 flex justify-center">
            <SphereCta href={getLaunchAppHref()} variant="glass">
              {CTA_SECTION.cta}
            </SphereCta>
          </div>

          <p className="mt-5 text-center text-xs text-muted-foreground">{CTA_SECTION.note}</p>
        </ScrollRevealGroup>
      </div>
    </section>
  )
}
