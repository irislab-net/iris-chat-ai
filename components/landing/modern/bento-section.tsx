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
    <section
      id="how-it-works"
      className={cn(landingSection, landingSectionBody)}
    >
      <ScrollReveal>
        <SectionHeader
          title={tSection("title")}
          subtitle={tSection("subtitle")}
        />
      </ScrollReveal>

      <ScrollRevealGroup className={cn(landingContentWide, landingAfterHeader)}>
        <ol className="relative m-0 grid list-none grid-cols-1 gap-6 p-0 md:grid-cols-3 md:gap-4">
          {HOW_IT_WORKS_STEP_KEYS.map((key, index) => (
            <li key={key}>
              <article
                className={cn(
                  landingGlassSurface,
                  "group relative flex h-full flex-col items-center overflow-hidden rounded-[1.75rem] bg-white/42 text-center dark:bg-white/8",
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
            </li>
          ))}
        </ol>
      </ScrollRevealGroup>
    </section>
  )
}
