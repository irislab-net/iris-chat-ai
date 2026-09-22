"use client"

import { useTranslations } from "next-intl"

import { AnimatedSvgIcon } from "@/components/landing/modern/animated-svg-icon"
import { HOW_IT_WORKS_MARKS } from "@/components/landing/modern/how-it-works-marks"
import {
  ScrollReveal,
  ScrollRevealGroup,
} from "@/components/landing/modern/scroll-reveal"
import { SectionHeader } from "@/components/landing/modern/sphere-ui"
import { HOW_IT_WORKS_STEP_KEYS } from "@/lib/landing-modern-data"
import {
  landingContentWide,
  landingGlassSheen,
  landingGlassSurface,
  landingAfterHeader,
  landingInner,
  landingSection,
  landingSectionBody,
  landingTitleCard,
} from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

function HowItWorksStepIcon({ index }: { index: number }) {
  const Mark = HOW_IT_WORKS_MARKS[index]

  return (
    <AnimatedSvgIcon
      replayOnHover
      scrollTrigger
      className="relative z-10 mb-6 size-26 text-foreground/70 lg:size-32"
    >
      <Mark />
    </AnimatedSvgIcon>
  )
}

export function BentoSection() {
  const tSection = useTranslations("modern.architecture")
  const tSteps = useTranslations("modern.howItWorks")

  return (
    <section id="how-it-works" className={cn(landingSection, landingSectionBody)}>
      <div className={landingInner}>
        <ScrollReveal>
          <SectionHeader
            title={tSection("title")}
            subtitle={tSection("subtitle")}
          />
        </ScrollReveal>

        <ScrollRevealGroup className={cn(landingContentWide, "relative grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-4", landingAfterHeader)}>
          {HOW_IT_WORKS_STEP_KEYS.map((key, index) => (
            <article
              key={key}
              className={cn(
                landingGlassSurface,
                "group relative flex flex-col items-center overflow-hidden rounded-[1.75rem] bg-white/42 text-center dark:bg-white/8",
                "px-6 py-8 sm:px-7 sm:py-9"
              )}
            >
              <span
                aria-hidden
                className={cn(
                  landingGlassSheen,
                  "pointer-events-none absolute inset-0 rounded-[1.75rem]"
                )}
              />
              <HowItWorksStepIcon index={index} />
              <h3 className={cn("relative z-10", landingTitleCard)}>
                {tSteps(`${key}.headline`)}
              </h3>
              <p className="relative z-10 mt-2 text-sm leading-relaxed text-muted-foreground">
                {tSteps(`${key}.desc`)}
              </p>
            </article>
          ))}
        </ScrollRevealGroup>
      </div>
    </section>
  )
}
