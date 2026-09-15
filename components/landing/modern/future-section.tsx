"use client"

import { AnimatePresence, motion } from "motion/react"
import { useState } from "react"

import { ScrollReveal } from "@/components/landing/modern/scroll-reveal"
import { Button } from "@/components/ui/button"
import {
  ROADMAP_STAGES,
  roadmapStatusClass,
} from "@/lib/landing-modern-data"
import {
  LANDING_EASE,
  landingChapter,
  landingContainer,
  landingHeading,
  landingSection,
} from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

export function FutureSection() {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeStage = ROADMAP_STAGES[activeIndex]
  const ActiveIcon = activeStage.icon

  return (
    <section id="future" className={cn("relative bg-[#FBFBFD]", landingSection)}>
      <div className={landingContainer}>
        <ScrollReveal>
          <p className={landingChapter}>Chapter 04 / The Horizon</p>
          <h2 className={cn("max-w-2xl", landingHeading)}>
            The path to financial autonomy.
          </h2>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-[#525866]">
            Not a timeline — a direction. From market intelligence to a continuously
            operating financial system dedicated to one person. Walk the path.
          </p>
        </ScrollReveal>

        <div className="mt-20 grid grid-cols-1 gap-14 lg:grid-cols-12 lg:gap-12">
          <ScrollReveal className="relative lg:col-span-7">
            <div
              aria-hidden
              className="absolute top-6 bottom-6 left-[19px] w-px bg-black/10"
            />
            <motion.div
              aria-hidden
              className="absolute top-6 left-[19px] w-px bg-[#2563EB]"
              animate={{
                height: `${(activeIndex / (ROADMAP_STAGES.length - 1)) * 100}%`,
              }}
              transition={{ duration: 0.6, ease: LANDING_EASE }}
              style={{ maxHeight: "calc(100% - 3rem)" }}
            />

            <div className="flex flex-col">
              {ROADMAP_STAGES.map((stage, index) => {
                const Icon = stage.icon
                const isActive = index === activeIndex
                return (
                  <Button
                    key={stage.name}
                    type="button"
                    variant="ghost"
                    onMouseEnter={() => setActiveIndex(index)}
                    onFocus={() => setActiveIndex(index)}
                    onClick={() => setActiveIndex(index)}
                    className="group relative h-auto items-center justify-start gap-6 rounded-2xl px-2 py-5 text-left hover:bg-white"
                  >
                    <span
                      className={cn(
                        "relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border transition-all duration-300",
                        isActive
                          ? "border-[#2563EB] bg-[#2563EB] text-white shadow-[0_0_0_6px_rgba(37,99,235,0.12)]"
                          : "border-black/15 bg-white text-[#868C98] group-hover:border-[#2563EB]/50 group-hover:text-[#2563EB]"
                      )}
                    >
                      <Icon className="size-[17px]" strokeWidth={1.9} />
                    </span>
                    <span
                      className={cn(
                        "block flex-1 font-[family-name:var(--font-display)] text-lg font-semibold transition-colors duration-300 sm:text-xl",
                        isActive
                          ? "text-[#0F172A]"
                          : "text-[#525866] group-hover:text-[#0F172A]"
                      )}
                    >
                      {stage.name}
                    </span>
                    <span
                      className={cn(
                        "hidden w-fit rounded-full px-3.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] sm:block",
                        roadmapStatusClass(stage.status)
                      )}
                    >
                      {stage.status}
                    </span>
                  </Button>
                )
              })}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.15} className="lg:col-span-5">
            <div className="lg:sticky lg:top-32">
              <div className="overflow-hidden rounded-3xl border border-black/[0.06] bg-white shadow-[0_30px_80px_rgba(15,23,42,0.07)]">
                <div className="border-b border-black/[0.06] px-8 py-4">
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-[#868C98]">
                    Stage 0{activeIndex + 1} / 0{ROADMAP_STAGES.length}
                  </p>
                </div>

                <AnimatePresence initial={false}>
                  <motion.div
                    key={activeStage.name}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.4, ease: LANDING_EASE }}
                    className="p-8 sm:p-10"
                  >
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-[#EAF1FE] text-[#2563EB]">
                      <ActiveIcon className="size-6" strokeWidth={1.8} />
                    </div>
                    <h3 className="mt-7 font-[family-name:var(--font-display)] text-2xl font-semibold text-[#0F172A] sm:text-3xl">
                      {activeStage.name}
                    </h3>
                    <span
                      className={cn(
                        "mt-4 inline-block rounded-full px-3.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.15em]",
                        roadmapStatusClass(activeStage.status)
                      )}
                    >
                      {activeStage.status}
                    </span>
                    <p className="mt-5 text-sm leading-relaxed text-[#525866] sm:text-base">
                      {activeStage.desc}
                    </p>
                    <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.25em] text-[#7C3AED]">
                      → {activeStage.tag}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>

      <div className={cn(landingContainer, "pt-0")}>
        <ScrollReveal>
          <div className="relative overflow-hidden rounded-[2.5rem] bg-[#0F172A] px-8 py-16 sm:px-14 sm:py-24 lg:px-20">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(124,58,237,0.22),transparent_55%)]"
            />
            <p className="relative font-mono text-xs font-semibold uppercase tracking-[0.3em] text-[#A78BFA]">
              The Visionary Moment
            </p>
            <h3 className="relative mt-8 max-w-3xl font-[family-name:var(--font-display)] text-3xl font-semibold leading-[1.12] tracking-tight text-[#F8FAFC] sm:text-5xl">
              Exur may look early today.
              <br />
              <span className="text-[#A78BFA]">So did Bitcoin in 2012.</span>
            </h3>
            <p className="relative mt-8 max-w-2xl text-base leading-relaxed text-[#94A3B8]">
              Some technologies don&apos;t look inevitable when they begin. They look
              strange. Too early. Too ambitious. Until the world catches up.
            </p>
            <p className="relative mt-4 max-w-2xl text-base leading-relaxed text-[#94A3B8]">
              Not because Exur is another asset — but because the financial system is
              about to become programmable, intelligent, and personal.{" "}
              <span className="font-semibold text-[#F8FAFC]">
                We&apos;re building that future now.
              </span>
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
