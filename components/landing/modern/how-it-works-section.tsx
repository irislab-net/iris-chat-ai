"use client"

import { AnimatePresence, motion } from "motion/react"
import { useState } from "react"

import { ScrollReveal } from "@/components/landing/modern/scroll-reveal"
import { Button } from "@/components/ui/button"
import { DEMO_SCENARIOS, PILLARS } from "@/lib/landing-modern-data"
import {
  LANDING_EASE,
  landingChapter,
  landingContainer,
  landingHeading,
  landingSection,
} from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

export function HowItWorksSection() {
  const [activeScenario, setActiveScenario] = useState(DEMO_SCENARIOS[0])

  return (
    <section id="how-it-works" className={cn("relative bg-[#FBFBFD]", landingSection)}>
      <div className={landingContainer}>
        <ScrollReveal>
          <p className={landingChapter}>Chapter 02 / The Architecture</p>
          <h2 className={cn("max-w-2xl", landingHeading)}>How Exur thinks.</h2>
        </ScrollReveal>

        <div className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-3">
          {PILLARS.map((pillar, index) => {
            const Icon = pillar.icon
            return (
              <ScrollReveal key={pillar.num} delay={0.12 * index}>
                <div className="group h-full rounded-3xl border border-black/[0.06] bg-white p-8 transition-colors duration-300 hover:border-[#2563EB]/30">
                  <div className="mb-6 flex items-center justify-between">
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-[#868C98]">
                      {pillar.num}
                    </span>
                    <div className="flex size-10 items-center justify-center rounded-2xl bg-[#EAF1FE] text-[#2563EB] transition-transform duration-300 group-hover:scale-110">
                      <Icon className="size-5" strokeWidth={1.8} />
                    </div>
                  </div>
                  <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[#0F172A]">
                    {pillar.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#525866]">
                    {pillar.desc}
                  </p>
                </div>
              </ScrollReveal>
            )
          })}
        </div>

        <ScrollReveal delay={0.1} className="mt-20">
          <div className="overflow-hidden rounded-[2rem] border border-black/[0.06] bg-white shadow-[0_30px_80px_rgba(15,23,42,0.06)]">
            <div className="border-b border-black/[0.06] px-8 py-5 sm:px-10">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-[#868C98]">
                Live Demo — Exur&apos;s Response Engine
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5">
              <div className="flex flex-col gap-2 p-8 sm:p-10 lg:col-span-2">
                {DEMO_SCENARIOS.map((scenario) => (
                  <Button
                    key={scenario.id}
                    type="button"
                    variant="outline"
                    onClick={() => setActiveScenario(scenario)}
                    className={cn(
                      "h-auto justify-start rounded-full border px-5 py-3 text-left text-sm font-medium transition-colors duration-300",
                      activeScenario.id === scenario.id
                        ? "border-[#2563EB] bg-[#2563EB] text-white hover:bg-[#2563EB] hover:text-white"
                        : "border-black/10 bg-transparent text-[#525866] hover:border-[#2563EB]/40 hover:bg-transparent hover:text-[#0F172A]"
                    )}
                  >
                    {scenario.label}
                  </Button>
                ))}
              </div>

              <div className="relative bg-[#0F172A] p-8 sm:p-10 lg:col-span-3">
                <AnimatePresence initial={false}>
                  <motion.div
                    key={activeScenario.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.45, ease: LANDING_EASE }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="size-1.5 animate-pulse-dot rounded-full bg-[#A78BFA]" />
                      <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-[#A78BFA]">
                        {activeScenario.signal}
                      </span>
                    </div>
                    <p className="mt-6 font-[family-name:var(--font-display)] text-3xl font-semibold text-[#F8FAFC] sm:text-4xl">
                      {activeScenario.verdict}
                    </p>
                    <p className="mt-4 max-w-md text-sm leading-relaxed text-[#94A3B8]">
                      {activeScenario.detail}
                    </p>
                    <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.25em] text-[#64748B]">
                      Calm is a feature. Not a failure.
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
