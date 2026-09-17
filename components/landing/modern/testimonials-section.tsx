"use client"

import { AnimatedIrisLabLogo } from "@/components/brand/animated-iris-lab-logo"
import { ScrollReveal } from "@/components/landing/modern/scroll-reveal"
import { SectionHeader, SphereOrb } from "@/components/landing/modern/sphere-ui"
import {
  COMPANION_SECTION,
  VOICE_EXCHANGES,
  type VoiceExchange,
} from "@/lib/landing-modern-data"
import {
  landingGlassBubbleAi,
  landingGlassBubbleUser,
  landingInner,
  landingSection,
  landingSectionBody,
} from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

function StoryExchange({ exchange }: { exchange: VoiceExchange }) {
  return (
    <article className="flex h-full flex-col">
      <div className="flex flex-1 flex-col gap-3">
        <div className="ml-auto w-fit max-w-full sm:max-w-[92%]">
          <div className={cn("px-4 py-3 sm:px-5 sm:py-3.5", landingGlassBubbleUser)}>
            <p className="text-sm leading-relaxed text-[#0F172A] sm:text-[0.9375rem]">
              {exchange.question}
            </p>
          </div>
        </div>

        <div className="flex max-w-full items-start gap-2.5 sm:max-w-[92%]">
          <SphereOrb bare size="sm" className="mt-0.5 shrink-0">
            <AnimatedIrisLabLogo
              play={false}
              variant="on-hero"
              className="size-5 drop-shadow-[0_1px_2px_rgba(15,23,42,0.18)]"
            />
          </SphereOrb>
          <div className={cn("min-w-0 flex-1 px-4 py-3 sm:px-5 sm:py-3.5", landingGlassBubbleAi)}>
            <p className="text-sm leading-relaxed text-[#64748B] sm:text-[0.9375rem]">
              {exchange.answer}
            </p>
          </div>
        </div>
      </div>
    </article>
  )
}

export function TestimonialsSection() {
  return (
    <section id="testimonials" className={cn(landingSection, landingSectionBody)}>
      <div className={landingInner}>
        <ScrollReveal>
          <SectionHeader
            title={COMPANION_SECTION.title}
            subtitle={COMPANION_SECTION.subtitle}
          />
        </ScrollReveal>

        <div className="mt-10 grid grid-cols-1 gap-12 sm:mt-12 sm:gap-14 lg:mt-14 lg:grid-cols-3 lg:gap-8">
          {VOICE_EXCHANGES.map((exchange, index) => (
            <ScrollReveal key={exchange.question} delay={0.08 + index * 0.06}>
              <StoryExchange exchange={exchange} />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
