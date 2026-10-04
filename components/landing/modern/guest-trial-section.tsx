"use client"

import { useTranslations } from "next-intl"

import { HeroLiquidGlassBg } from "@/components/landing/modern/hero-liquid-glass-bg"
import { ScrollRevealGroup } from "@/components/landing/modern/scroll-reveal"
import { SectionHeader, SphereCta } from "@/components/landing/modern/sphere-ui"
import { GUEST_TRIAL_STAT } from "@/lib/landing-modern-data"
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
  const t = useTranslations("modern.guestTrial")

  return (
    <section
      id="try"
      className={cn(
        landingSection,
        landingSectionBody,
        "overflow-hidden bg-white/35 shadow-[0_20px_60px_rgba(15,23,42,0.05)] backdrop-blur-2xl dark:bg-white/5 dark:shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
      )}
    >
      <HeroLiquidGlassBg tone="blue" />

      <div className={cn(landingInner, "relative z-10")}>
        <ScrollRevealGroup>
          <SectionHeader title={t("title")} subtitle={t("subtitle")} />

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
                "text-[4.75rem] leading-none tracking-[-0.06em] text-foreground sm:text-[5.75rem]"
              )}
            >
              {GUEST_TRIAL_STAT}
            </p>
            <p className="mt-2 text-xs font-medium tracking-wide text-muted-foreground">
              {t("statLabel")}
            </p>
          </div>

          <div className="mt-7 flex justify-center sm:mt-8">
            <SphereCta href={getLaunchAppHref()} variant="glass">
              {t("cta")}
            </SphereCta>
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            {t("note")}
          </p>
        </ScrollRevealGroup>
      </div>
    </section>
  )
}
