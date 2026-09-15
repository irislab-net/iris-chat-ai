"use client"

import { ScrollReveal } from "@/components/landing/modern/scroll-reveal"
import { SectionHeader } from "@/components/landing/modern/sphere-ui"
import { COMPANION_SECTION, VOICE_EXCHANGES } from "@/lib/landing-modern-data"
import { landingCard, landingInner, landingSection, landingSectionBody } from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

export function TestimonialsSection() {
  return (
    <section className={cn(landingSection, landingSectionBody)}>
      <div className={landingInner}>
        <ScrollReveal>
          <SectionHeader
            badge={COMPANION_SECTION.badge}
            title={COMPANION_SECTION.title}
            subtitle={COMPANION_SECTION.subtitle}
          />
          <div className="mx-auto mt-8 max-w-2xl text-center">
            <p className="font-[family-name:var(--font-display)] text-lg font-semibold text-[#0F172A] sm:text-xl">
              &ldquo;{COMPANION_SECTION.quote}&rdquo;
            </p>
            <p className="mt-2 text-sm text-[#94A3B8]">— {COMPANION_SECTION.quoteAttribution}</p>
          </div>
        </ScrollReveal>

        <div className="mt-14 grid grid-cols-1 gap-6 lg:mt-16 lg:grid-cols-3 lg:gap-8">
          {VOICE_EXCHANGES.map((exchange, index) => (
            <ScrollReveal key={exchange.question} delay={0.08 * index}>
              <article className={cn("flex h-full flex-col p-6 sm:p-8", landingCard)}>
                <div className="ml-auto w-fit max-w-full rounded-3xl rounded-br-md bg-[#F5F5F7] px-5 py-4">
                  <p className="text-sm font-medium text-[#0F172A]">{exchange.question}</p>
                </div>
                <div className="mt-3 flex items-start gap-3">
                  <span className="mt-2 size-2 shrink-0 rounded-full bg-[#2563EB]" aria-hidden />
                  <div className="rounded-3xl rounded-tl-md bg-white px-5 py-4 shadow-[0_8px_30px_rgba(15,23,42,0.05)]">
                    <p className="mb-1 font-mono text-[9px] font-semibold uppercase tracking-[0.25em] text-[#2563EB]">
                      Exur
                    </p>
                    <p className="text-sm leading-relaxed text-[#64748B]">{exchange.answer}</p>
                  </div>
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
