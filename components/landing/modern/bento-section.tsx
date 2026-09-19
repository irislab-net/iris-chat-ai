"use client"

import { AnimatedSvgIcon } from "@/components/landing/modern/animated-svg-icon"
import { HOW_IT_WORKS_MARKS } from "@/components/landing/modern/how-it-works-marks"
import {
  ScrollReveal,
  ScrollRevealGroup,
} from "@/components/landing/modern/scroll-reveal"
import { SectionHeader } from "@/components/landing/modern/sphere-ui"
import {
  ARCHITECTURE_SECTION,
  HOW_IT_WORKS_STEPS,
} from "@/lib/landing-modern-data"
import {
  landingGlassSheen,
  landingGlassSurface,
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
      className="relative z-10 mb-6 size-26 text-[#334155] lg:size-32"
    >
      <Mark />
    </AnimatedSvgIcon>
  )
}

export function BentoSection() {
  return (
    <section id="how-it-works" className={cn(landingSection, landingSectionBody)}>
      <div className={landingInner}>
        <ScrollReveal>
          <SectionHeader
            title={ARCHITECTURE_SECTION.title}
            subtitle={ARCHITECTURE_SECTION.subtitle}
          />
        </ScrollReveal>

        <ScrollRevealGroup className="relative mt-12 grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-4 lg:mt-14">
          {HOW_IT_WORKS_STEPS.map((item, index) => (
            <article
              key={item.title}
              className={cn(
                landingGlassSurface,
                "group relative flex flex-col items-center overflow-hidden rounded-[1.75rem] bg-white/42 text-center",
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
              <h3 className={cn("relative z-10", landingTitleCard)}>{item.headline}</h3>
              <p className="relative z-10 mt-2 text-sm leading-relaxed text-[#64748B]">
                {item.desc}
              </p>
            </article>
          ))}
        </ScrollRevealGroup>
      </div>
    </section>
  )
}
