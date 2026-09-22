"use client"

import { HeroLiquidGlassBg } from "@/components/landing/modern/hero-liquid-glass-bg"
import { ScrollRevealGroup } from "@/components/landing/modern/scroll-reveal"
import { SectionHeader, SphereCta } from "@/components/landing/modern/sphere-ui"
import { GUEST_TRIAL_SECTION } from "@/lib/landing-modern-data"
import {
  landingAfterHeader,
  landingContent,
  landingDisplay,
  landingInner,
  landingSection,
  landingSectionBody,
} from "@/lib/landing-modern-styles"
import { getLaunchAppHref } from "@/lib/site"
import { cn } from "@/lib/utils"

export function GuestTrialSection() {
  return (
    <section
      id="try"
      className={cn(
        landingSection,
        landingSectionBody,
        "bg-white/40 backdrop-blur-2xl shadow-[0_28px_80px_rgba(15,23,42,0.07)] dark:bg-white/6 dark:shadow-[0_28px_80px_rgba(0,0,0,0.45)]"
      )}
    >
      <HeroLiquidGlassBg tone="blue" />

      <div className={cn(landingInner, "relative z-10")}>
        <ScrollRevealGroup>
          <SectionHeader
            title={GUEST_TRIAL_SECTION.title}
            subtitle={GUEST_TRIAL_SECTION.subtitle}
          />

          <div
            className={cn(
              landingContent,
              landingAfterHeader,
              "flex flex-col items-center text-center"
            )}
          >
            <p
              className={cn(
                landingDisplay,
                "text-[5.5rem] leading-none tracking-[-0.06em] text-foreground sm:text-[6.5rem]"
              )}
              aria-hidden
            >
              {GUEST_TRIAL_SECTION.stat}
            </p>
            <p className="mt-2 font-[family-name:var(--font-mono-modern)] text-xs tracking-[0.2em] text-muted-foreground uppercase">
              {GUEST_TRIAL_SECTION.statLabel}
            </p>
          </div>

          <div className="mt-8 flex justify-center sm:mt-10">
            <SphereCta href={getLaunchAppHref()} variant="glass">
              {GUEST_TRIAL_SECTION.cta}
            </SphereCta>
          </div>

          <p className="mt-5 text-center text-xs text-muted-foreground">
            {GUEST_TRIAL_SECTION.note}
          </p>
        </ScrollRevealGroup>
      </div>
    </section>
  )
}
