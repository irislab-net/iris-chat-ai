"use client"

import { PlayIcon } from "lucide-react"

import { ScrollReveal } from "@/components/landing/modern/scroll-reveal"
import { SectionHeader, SphereCta, SphereOrb } from "@/components/landing/modern/sphere-ui"
import { MEET_EXUR_SECTION } from "@/lib/landing-modern-data"
import { landingInner, landingSection, landingSectionBody } from "@/lib/landing-modern-styles"
import { APP_NEWS_PATH } from "@/lib/site"
import { cn } from "@/lib/utils"

export function AboutSection() {
  return (
    <section id="about" className={cn(landingSection, landingSectionBody)}>
      <div className={landingInner}>
        <ScrollReveal>
          <SectionHeader
            badge={MEET_EXUR_SECTION.badge}
            title={MEET_EXUR_SECTION.title}
            subtitle={MEET_EXUR_SECTION.subtitle}
          />
        </ScrollReveal>

        <ScrollReveal delay={0.12} className="mx-auto mt-12 max-w-4xl lg:mt-14">
          <div className="relative overflow-hidden rounded-[2rem] bg-[#0F172A] shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
            <div
              aria-hidden
              className="aspect-video w-full bg-[radial-gradient(ellipse_at_50%_40%,rgba(56,189,248,0.35),rgba(37,99,235,0.15)_45%,#0F172A_80%)]"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <SphereOrb size="xl" className="scale-125 opacity-90" />
              <button
                type="button"
                className="absolute flex size-16 items-center justify-center rounded-full border border-white/25 bg-white/15 text-white backdrop-blur-md transition-transform hover:scale-105"
                aria-label="Play demo"
              >
                <PlayIcon className="ml-0.5 size-6 fill-white" />
              </button>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.18} className="mt-10 text-center lg:mt-12">
          <p className="font-[family-name:var(--font-display)] text-lg font-medium leading-snug text-[#0F172A] sm:text-xl">
            &ldquo;{MEET_EXUR_SECTION.quote}&rdquo;
          </p>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.25em] text-[#94A3B8]">
            {MEET_EXUR_SECTION.tagline}
          </p>
          <div className="mt-8 flex justify-center">
            <SphereCta href={APP_NEWS_PATH}>Meet Exur</SphereCta>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
