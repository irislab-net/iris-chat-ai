"use client"

import { ArrowUpRightIcon } from "lucide-react"
import { useState } from "react"

import { ScrollReveal } from "@/components/landing/modern/scroll-reveal"
import { SectionHeader, SphereCta, SphereOrb } from "@/components/landing/modern/sphere-ui"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import {
  ARCHITECTURE_SECTION,
  BENTO_INTEGRATION,
  BENTO_MULTIMODAL,
  DEMO_SCENARIOS,
  PILLAR_CARDS,
} from "@/lib/landing-modern-data"
import {
  landingCard,
  landingGlassLight,
  landingInner,
  landingSection,
  landingSectionBody,
} from "@/lib/landing-modern-styles"
import { APP_NEWS_PATH } from "@/lib/site"
import { cn } from "@/lib/utils"

export function BentoSection() {
  const [activeScenario, setActiveScenario] = useState(DEMO_SCENARIOS[0])

  return (
    <section id="how-it-works" className={cn(landingSection, landingSectionBody)}>
      <div className={landingInner}>
        <ScrollReveal>
          <SectionHeader
            badge={ARCHITECTURE_SECTION.badge}
            title={ARCHITECTURE_SECTION.title}
          />
        </ScrollReveal>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3 lg:mt-12">
          {PILLAR_CARDS.map((pillar, index) => (
            <ScrollReveal key={pillar.num} delay={0.08 * index}>
              <article className={cn("h-full p-6 sm:p-7", landingCard)}>
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-[#2563EB]">
                  {pillar.num}
                </p>
                <h3 className="mt-4 font-[family-name:var(--font-display)] text-lg font-semibold text-[#0F172A]">
                  {pillar.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#64748B]">{pillar.desc}</p>
              </article>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={0.1} className="mt-14 lg:mt-16">
          <p className="mb-6 text-center font-mono text-xs font-semibold uppercase tracking-[0.3em] text-[#2563EB]">
            Live Demo — Exur&apos;s Response Engine
          </p>
        </ScrollReveal>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
          <ScrollReveal className="lg:row-span-2">
            <article className={cn("flex h-full flex-col p-8 sm:p-10", landingCard)}>
              <div className="flex flex-col gap-2">
                {DEMO_SCENARIOS.map((scenario) => (
                  <Button
                    key={scenario.id}
                    type="button"
                    variant="ghost"
                    onClick={() => setActiveScenario(scenario)}
                    className={cn(
                      "h-auto justify-start rounded-full border px-5 py-3 text-left text-sm font-medium transition-colors",
                      activeScenario.id === scenario.id
                        ? "border-[#2563EB] bg-[#2563EB] text-white hover:bg-[#2563EB] hover:text-white"
                        : "border-black/10 text-[#64748B] hover:border-[#2563EB]/30 hover:bg-[#F8FAFC] hover:text-[#0F172A]"
                    )}
                  >
                    {scenario.label}
                  </Button>
                ))}
              </div>

              <div className="relative mt-8 flex-1 overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-[#2563EB] to-[#38BDF8] p-5 sm:p-6">
                <div className="rounded-2xl bg-white/20 px-4 py-3 text-sm text-white/95 backdrop-blur-sm">
                  {activeScenario.trigger}
                </div>
                <div className={cn("relative -mt-2 ml-4 rounded-2xl p-5 sm:ml-8", landingGlassLight)}>
                  <p className="mb-1 font-mono text-[9px] font-semibold uppercase tracking-[0.25em] text-[#2563EB]">
                    Exur
                  </p>
                  <p className="text-sm leading-relaxed text-[#475569]">{activeScenario.verdict}</p>
                  <SphereOrb size="md" className="absolute -right-2 -bottom-3 sm:right-4 sm:bottom-4" />
                </div>
              </div>
            </article>
          </ScrollReveal>

          <ScrollReveal delay={0.08}>
            <article className={cn("h-full p-8 sm:p-10", landingCard)}>
              <div className="mb-8 flex flex-wrap items-center gap-3 rounded-full bg-[#EFF6FF] px-4 py-3">
                {BENTO_INTEGRATION.icons.map((label) => (
                  <span
                    key={label}
                    className="flex size-10 items-center justify-center rounded-full border border-white/80 bg-white/80 text-xs font-semibold text-[#2563EB] shadow-sm"
                  >
                    {label}
                  </span>
                ))}
              </div>
              <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[#0F172A] sm:text-2xl">
                {BENTO_INTEGRATION.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[#64748B] sm:text-base">
                {BENTO_INTEGRATION.desc}
              </p>
            </article>
          </ScrollReveal>

          <ScrollReveal delay={0.14}>
            <article
              className="relative h-full overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#2563EB] via-[#3B82F6] to-[#7DD3FC] p-8 text-white sm:p-10"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -top-10 -right-10 size-40 rounded-full bg-white/15 blur-3xl"
              />
              <h3 className="relative font-[family-name:var(--font-display)] text-xl font-semibold sm:text-2xl">
                {BENTO_MULTIMODAL.title}
              </h3>
              <p className="relative mt-3 max-w-md text-sm leading-relaxed text-white/85 sm:text-base">
                {BENTO_MULTIMODAL.desc}
              </p>
              <Button
                nativeButton={false}
                render={<Link href={APP_NEWS_PATH} />}
                className="relative mt-8 h-auto gap-2 rounded-full bg-[#0F172A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1E293B]"
              >
                Get Started
                <ArrowUpRightIcon className="size-4" />
              </Button>
            </article>
          </ScrollReveal>
        </div>

        <ScrollReveal delay={0.1} className="mt-12 flex justify-center">
          <SphereCta href={APP_NEWS_PATH}>Try the co-pilot</SphereCta>
        </ScrollReveal>
      </div>
    </section>
  )
}
