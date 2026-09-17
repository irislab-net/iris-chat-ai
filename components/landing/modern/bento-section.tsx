"use client"

import { BrainIcon, EyeIcon, ScaleIcon } from "lucide-react"

import { AnimatedSvgIcon } from "@/components/landing/modern/animated-svg-icon"
import { ScrollReveal } from "@/components/landing/modern/scroll-reveal"
import { SectionHeader, SphereCta } from "@/components/landing/modern/sphere-ui"
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
import { APP_NEWS_PATH } from "@/lib/site"
import { cn } from "@/lib/utils"

const STEP_ICONS = [EyeIcon, BrainIcon, ScaleIcon]

function HowItWorksStepIcon({ index }: { index: number }) {
  const Icon = STEP_ICONS[index]

  return (
    <div
      className={cn(
        landingGlassSurface,
        "relative z-10 mb-5 flex size-16 items-center justify-center overflow-hidden rounded-full bg-white/52 text-[#475569] shadow-[0_12px_36px_rgba(15,23,42,0.08),inset_0_1px_1px_rgba(255,255,255,0.95)] sm:size-18"
      )}
    >
      <span aria-hidden className={cn(landingGlassSheen, "absolute inset-0 rounded-full")} />
      <AnimatedSvgIcon scrollTrigger replayOnHover className="relative z-10 size-7 sm:size-8">
        <Icon className="size-full overflow-visible" strokeWidth={1.75} />
      </AnimatedSvgIcon>
    </div>
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

        <ScrollReveal delay={0.08} className="mt-12 lg:mt-14">
          <div className="relative grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-4">
            <div
              aria-hidden
              className="absolute top-10 right-[16%] left-[16%] hidden h-px bg-linear-to-r from-transparent via-white/70 to-transparent md:block"
            />
            {HOW_IT_WORKS_STEPS.map((item, index) => {
              return (
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
                    className={cn(landingGlassSheen, "pointer-events-none absolute inset-0 rounded-[1.75rem]")}
                  />
                  <HowItWorksStepIcon index={index} />
                  <h3 className={cn("relative z-10", landingTitleCard)}>
                    {item.headline}
                  </h3>
                  <p className="relative z-10 mt-2 text-sm leading-relaxed text-[#64748B]">{item.desc}</p>
                </article>
              )
            })}
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1} className="mt-10 flex justify-center lg:mt-12">
          <SphereCta href={APP_NEWS_PATH}>{ARCHITECTURE_SECTION.cta}</SphereCta>
        </ScrollReveal>
      </div>
    </section>
  )
}
