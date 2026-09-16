"use client"

import { ScrollReveal } from "@/components/landing/modern/scroll-reveal"
import { SectionHeader, SphereOrb } from "@/components/landing/modern/sphere-ui"
import { Separator } from "@/components/ui/separator"
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
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-[#94A3B8]">
        {exchange.topic}
      </p>

      <div className="mt-4 flex flex-1 flex-col gap-3 sm:mt-5">
        <div className="ml-auto w-fit max-w-full sm:max-w-[92%]">
          <div className={cn("px-4 py-3 sm:px-5 sm:py-3.5", landingGlassBubbleUser)}>
            <p className="text-sm leading-relaxed text-[#0F172A] sm:text-[0.9375rem]">
              {exchange.question}
            </p>
          </div>
        </div>

        <div className="flex max-w-full items-start gap-2.5 sm:max-w-[92%]">
          <SphereOrb size="sm" className="mt-0.5 shrink-0" />
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
            badge={COMPANION_SECTION.badge}
            title={COMPANION_SECTION.title}
            subtitle={COMPANION_SECTION.subtitle}
          />
        </ScrollReveal>

        <ScrollReveal delay={0.06} className="mx-auto mt-10 max-w-2xl text-center sm:mt-12">
          <blockquote>
            <p className="font-(family-name:--font-display) text-2xl font-medium leading-snug tracking-tight text-[#0F172A] sm:text-[1.75rem]">
              {COMPANION_SECTION.quote}
            </p>
            <footer className="mt-4 font-mono text-[10px] font-medium uppercase tracking-[0.25em] text-[#94A3B8]">
              {COMPANION_SECTION.quoteAttribution}
            </footer>
          </blockquote>
        </ScrollReveal>

        <ScrollReveal delay={0.1} className="mx-auto mt-10 max-w-3xl sm:mt-12">
          <Separator className="bg-linear-to-r from-transparent via-[#E2E8F0] to-transparent" />
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
