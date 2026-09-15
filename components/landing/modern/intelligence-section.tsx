"use client"

import { ScrollReveal } from "@/components/landing/modern/scroll-reveal"
import { PROBLEM_CARDS } from "@/lib/landing-modern-data"
import {
  landingBody,
  landingChapter,
  landingContainer,
  landingHeading,
  landingSection,
} from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

export function IntelligenceSection() {
  return (
    <section id="intelligence" className={cn("relative", landingSection)}>
      <div className={cn("grid grid-cols-1 gap-16 lg:grid-cols-12 lg:gap-12", landingContainer)}>
        <div className="lg:col-span-6">
          <ScrollReveal>
            <p className={landingChapter}>Chapter 01 / The Noise</p>
            <h2 className={landingHeading}>
              Your money shouldn&apos;t require a team of experts.
            </h2>
          </ScrollReveal>

          <ScrollReveal delay={0.15}>
            <p className={cn("mt-8 max-w-lg", landingBody)}>
              Institutions solved this years ago — with analysts, risk managers, data
              scientists, and infrastructure watching their capital around the clock.
              Individuals got apps, charts, and notifications.
            </p>
            <p className={cn("mt-5 max-w-lg", landingBody)}>
              Exur compresses that institutional capability into one intelligent personal
              system.{" "}
              <span className="font-semibold text-[#0F172A]">
                Institutional-grade financial intelligence — personal, conversational,
                autonomous, always available.
              </span>
            </p>
          </ScrollReveal>
        </div>

        <div className="flex flex-col justify-center gap-5 lg:col-span-6 lg:pl-10">
          {PROBLEM_CARDS.map((card, index) => {
            const Icon = card.icon
            return (
              <ScrollReveal key={card.title} delay={0.1 + index * 0.12}>
                <div className="group flex items-start gap-5 rounded-3xl border border-black/[0.06] bg-white p-7 transition-colors duration-300 hover:border-[#2563EB]/30">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#EAF1FE] text-[#2563EB] transition-transform duration-300 group-hover:scale-110">
                    <Icon className="size-5" strokeWidth={1.8} />
                  </div>
                  <div>
                    <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[#0F172A]">
                      {card.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#525866]">
                      {card.desc}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
