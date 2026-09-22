"use client"

import { useTranslations } from "next-intl"

import { AboutExperience } from "@/components/landing/modern/about-experience"
import { ScrollReveal } from "@/components/landing/modern/scroll-reveal"
import { SectionHeader } from "@/components/landing/modern/sphere-ui"
import { LANDING_REVEAL } from "@/lib/landing-motion"
import {
  landingAfterHeader,
  landingSection,
  landingSectionBody,
} from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

export function AboutSection() {
  const t = useTranslations("modern.about")

  return (
    <section
      id="about"
      className={cn(
        landingSection,
        landingSectionBody,
        // Full-bleed in the page column: no side inset on the stage.
        "relative isolate overflow-visible"
      )}
    >
      {/* Exur introduces itself out loud, so the section stays near-wordless. */}
      <ScrollReveal>
        <SectionHeader title={t("title")} subtitle={t("subtitle")} />
      </ScrollReveal>

      <ScrollReveal
        delay={LANDING_REVEAL.stagger}
        className={cn("w-full", landingAfterHeader)}
      >
        <AboutExperience />
      </ScrollReveal>
    </section>
  )
}
