"use client"

import { useTranslations } from "next-intl"

import { HeroLiquidGlassBg } from "@/components/landing/modern/hero-liquid-glass-bg"
import { ScrollRevealGroup } from "@/components/landing/modern/scroll-reveal"
import { SectionHeader, SphereCta } from "@/components/landing/modern/sphere-ui"
import {
  landingInner,
  landingSection,
  landingSectionBody,
} from "@/lib/landing-modern-styles"
import { getLaunchAppHref } from "@/lib/site"
import { cn } from "@/lib/utils"

export function CtaSection() {
  const t = useTranslations("modern.cta")

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
            title={t("title")}
            subtitle={t("subtitle")}
            className="max-w-2xl"
          />

          <div className="mt-9 flex justify-center">
            <SphereCta href={getLaunchAppHref()} variant="glass">
              {t("cta")}
            </SphereCta>
          </div>

          <p className="mt-5 text-center text-xs text-muted-foreground">{t("note")}</p>
        </ScrollRevealGroup>
      </div>
    </section>
  )
}
