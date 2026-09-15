"use client"

import { ScrollReveal } from "@/components/landing/modern/scroll-reveal"
import { GoalOrbIcon, SectionHeader, SphereCta } from "@/components/landing/modern/sphere-ui"
import { FEATURES_SECTION, GOAL_CARDS } from "@/lib/landing-modern-data"
import { landingCard, landingInner, landingSection, landingSectionBody } from "@/lib/landing-modern-styles"
import { APP_NEWS_PATH } from "@/lib/site"
import { cn } from "@/lib/utils"

export function GoalsSection() {
  return (
    <section id="features" className={cn(landingSection, landingSectionBody)}>
      <div className={landingInner}>
        <ScrollReveal>
          <SectionHeader
            badge={FEATURES_SECTION.badge}
            title={FEATURES_SECTION.title}
            subtitle={FEATURES_SECTION.subtitle}
          />
          <p className="mx-auto mt-6 max-w-3xl text-center text-sm leading-relaxed text-[#64748B] sm:text-base">
            {FEATURES_SECTION.highlight}
          </p>
        </ScrollReveal>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3 lg:mt-16 lg:gap-8">
          {GOAL_CARDS.map((card, index) => {
            const Icon = card.icon
            return (
              <ScrollReveal key={card.title} delay={0.1 * index}>
                <article className={cn("h-full p-8 sm:p-9", landingCard)}>
                  <GoalOrbIcon icon={Icon} />
                  <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[#0F172A]">
                    {card.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#64748B] sm:text-base">
                    {card.desc}
                  </p>
                </article>
              </ScrollReveal>
            )
          })}
        </div>

        <ScrollReveal delay={0.15} className="mt-12 flex justify-center lg:mt-14">
          <SphereCta href={APP_NEWS_PATH}>Meet Exur</SphereCta>
        </ScrollReveal>
      </div>
    </section>
  )
}
