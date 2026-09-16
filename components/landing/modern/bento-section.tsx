"use client"

import { ArrowRightIcon, BrainIcon, EyeIcon, ScaleIcon } from "lucide-react"
import { useState } from "react"

import { ScrollReveal } from "@/components/landing/modern/scroll-reveal"
import { SectionHeader, SphereCta, SphereOrb } from "@/components/landing/modern/sphere-ui"
import { Button } from "@/components/ui/button"
import {
  ARCHITECTURE_SECTION,
  BENTO_DEMO_SECTION,
  DEMO_SCENARIOS,
  HOW_IT_WORKS_STEPS,
} from "@/lib/landing-modern-data"
import { landingCard, landingInner, landingSection, landingSectionBody } from "@/lib/landing-modern-styles"
import { APP_NEWS_PATH } from "@/lib/site"
import { cn } from "@/lib/utils"

const STEP_ICONS = [EyeIcon, BrainIcon, ScaleIcon]

export function BentoSection() {
  const [activeScenario, setActiveScenario] = useState(DEMO_SCENARIOS[0])

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
              className="absolute top-10 right-[16%] left-[16%] hidden h-px bg-linear-to-r from-transparent via-black/10 to-transparent md:block"
            />
            {HOW_IT_WORKS_STEPS.map((item, index) => {
              const Icon = STEP_ICONS[index]
              return (
                <article
                  key={item.step}
                  className={cn(
                    "relative flex flex-col items-center text-center",
                    landingCard,
                    "px-6 py-8 sm:px-7 sm:py-9"
                  )}
                >
                  <div className="relative mb-5 flex size-14 items-center justify-center">
                    <span
                      className="absolute inset-0 rounded-full bg-[#F1F5F9]"
                      aria-hidden
                    />
                    <Icon className="relative size-6 text-[#475569]" strokeWidth={1.75} />
                    <span
                      className="absolute -top-1 -right-1 flex size-6 items-center justify-center rounded-full bg-[#0F172A] font-mono text-[10px] font-semibold text-white"
                    >
                      {item.step}
                    </span>
                  </div>
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-[#94A3B8]">
                    {item.title}
                  </p>
                  <h3 className="mt-2 font-(family-name:--font-display) text-lg font-semibold text-[#0F172A]">
                    {item.headline}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#64748B]">{item.desc}</p>
                </article>
              )
            })}
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.12} className="mt-14 lg:mt-16">
          <div className="mb-6 flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-between sm:text-left">
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.3em] text-[#94A3B8]">
                {BENTO_DEMO_SECTION.badge}
              </p>
              <h3 className="mt-2 font-(family-name:--font-display) text-xl font-semibold text-[#0F172A] sm:text-2xl">
                {BENTO_DEMO_SECTION.title}
              </h3>
              <p className="mt-1 max-w-md text-sm text-[#64748B]">
                {BENTO_DEMO_SECTION.subtitle}
              </p>
            </div>
            <SphereOrb size="md" className="hidden shrink-0 sm:flex" />
          </div>

          <article className={cn("overflow-hidden", landingCard)}>
            <div className="flex flex-wrap gap-2 bg-[#F1F5F9] p-4 sm:gap-2.5 sm:p-5">
              {DEMO_SCENARIOS.map((scenario) => (
                <Button
                  key={scenario.id}
                  type="button"
                  variant="ghost"
                  onClick={() => setActiveScenario(scenario)}
                  className={cn(
                    "h-auto rounded-full px-4 py-2 text-xs font-medium sm:text-sm",
                    activeScenario.id === scenario.id
                      ? "bg-[#0F172A] text-white hover:bg-[#0F172A] hover:text-white"
                      : "bg-white text-[#64748B] shadow-[0_4px_14px_rgba(15,23,42,0.05)] hover:bg-white hover:text-[#0F172A]"
                  )}
                >
                  {scenario.label}
                </Button>
              ))}
            </div>

            <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
              <div className="bg-white p-6 sm:p-8">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-[#94A3B8]">
                  {BENTO_DEMO_SECTION.situationLabel}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-[#0F172A] sm:text-base">
                  {activeScenario.trigger}
                </p>
                <div className="mt-6 flex items-center gap-2 text-xs text-[#64748B]">
                  <span className="size-1.5 rounded-full bg-[#94A3B8]" aria-hidden />
                  {BENTO_DEMO_SECTION.analyzing}
                </div>
              </div>

              <div className="relative bg-[#F1F5F9] p-6 sm:p-8">
                <div className="flex items-start gap-3">
                  <SphereOrb size="sm" className="mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.25em] text-[#94A3B8]">
                      Exur
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-[#475569] sm:text-base">
                      {activeScenario.verdict}
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                  <span className="text-xs font-medium text-[#64748B]">{BENTO_DEMO_SECTION.verdictLabel}</span>
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-[#0F172A]">
                    {BENTO_DEMO_SECTION.verdictValue}
                    <ArrowRightIcon className="size-3.5 text-[#64748B]" />
                  </span>
                </div>
              </div>
            </div>
          </article>
        </ScrollReveal>

        <ScrollReveal delay={0.1} className="mt-10 flex justify-center lg:mt-12">
          <SphereCta href={APP_NEWS_PATH}>{BENTO_DEMO_SECTION.cta}</SphereCta>
        </ScrollReveal>
      </div>
    </section>
  )
}
