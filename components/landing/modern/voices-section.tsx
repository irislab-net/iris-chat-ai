"use client"

import { ScrollReveal } from "@/components/landing/modern/scroll-reveal"
import { VOICE_EXCHANGES } from "@/lib/landing-modern-data"
import {
  landingBody,
  landingChapter,
  landingContainer,
  landingHeading,
  landingSection,
} from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

export function VoicesSection() {
  return (
    <section id="voices" className={cn("relative", landingSection)}>
      <div className={cn("grid grid-cols-1 gap-16 lg:grid-cols-12 lg:gap-12", landingContainer)}>
        <div className="lg:col-span-5">
          <ScrollReveal>
            <p className={landingChapter}>Chapter 03 / The Relationship</p>
            <h2 className={landingHeading}>
              Not a terminal.
              <br />
              A companion.
            </h2>
          </ScrollReveal>

          <ScrollReveal delay={0.15}>
            <p className={cn("mt-8 max-w-md", landingBody)}>
              You will never see a model name, an API, or a data pipeline. You talk. Exur
              understands the infrastructure underneath — and answers like an intelligent
              friend who happens to watch every market, all the time.
            </p>
            <p className="mt-5 max-w-md font-[family-name:var(--font-display)] text-lg font-semibold leading-snug text-[#0F172A]">
              &quot;Exur is watching this for me.&quot;
            </p>
            <p className="mt-2 max-w-md text-sm text-[#868C98]">
              — how it should feel, every day
            </p>
          </ScrollReveal>
        </div>

        <div className="flex flex-col justify-center gap-8 lg:col-span-7 lg:pl-10">
          {VOICE_EXCHANGES.map((exchange, index) => (
            <ScrollReveal key={exchange.q} delay={0.1 + index * 0.12}>
              <div>
                <div className="ml-auto w-fit max-w-[85%] rounded-3xl rounded-br-md bg-[#F5F5F7] px-6 py-4">
                  <p className="text-sm font-medium text-[#0F172A]">{exchange.q}</p>
                </div>
                <div className="mt-3 flex max-w-[92%] items-start gap-3">
                  <span className="mt-2 size-2 shrink-0 rounded-full bg-[#2563EB]" />
                  <div className="rounded-3xl rounded-tl-md border border-black/[0.06] bg-white px-6 py-4 shadow-[0_8px_30px_rgba(15,23,42,0.05)]">
                    <p className="mb-1 font-mono text-[9px] font-semibold uppercase tracking-[0.25em] text-[#2563EB]">
                      Exur
                    </p>
                    <p className="text-sm leading-relaxed text-[#525866]">{exchange.a}</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
