"use client"

import { AboutExperience } from "@/components/landing/modern/about-experience"
import { ScrollReveal } from "@/components/landing/modern/scroll-reveal"
import { SectionHeader } from "@/components/landing/modern/sphere-ui"
import { MEET_EXUR_SECTION } from "@/lib/landing-modern-data"
import { LANDING_REVEAL } from "@/lib/landing-motion"
import {
  landingAfterHeader,
  landingContentWide,
  landingInner,
  landingSection,
  landingSectionBody,
} from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

export function AboutSection() {
  return (
    <section id="about" className={cn(landingSection, landingSectionBody)}>
      <div className={landingInner}>
        {/* Exur introduces itself out loud, so the section stays near-wordless. */}
        <ScrollReveal>
          <SectionHeader
            title={MEET_EXUR_SECTION.title}
            subtitle={MEET_EXUR_SECTION.subtitle}
          />
        </ScrollReveal>

        <ScrollReveal
          delay={LANDING_REVEAL.stagger}
          className={cn(landingContentWide, landingAfterHeader)}
        >
          <AboutExperience />
        </ScrollReveal>
      </div>
    </section>
  )
}
