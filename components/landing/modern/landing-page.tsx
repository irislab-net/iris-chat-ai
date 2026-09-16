"use client"

import { AboutSection } from "@/components/landing/modern/about-section"
import { BentoSection } from "@/components/landing/modern/bento-section"
import { GoalsSection } from "@/components/landing/modern/goals-section"
import { HeroLiquidGlassBg } from "@/components/landing/modern/hero-liquid-glass-bg"
import { HeroSection } from "@/components/landing/modern/hero-section"
import { LandingNav } from "@/components/landing/modern/landing-nav"
import { LandingScrollProvider } from "@/components/landing/modern/landing-scroll-context"
import { LandingSectionDots } from "@/components/landing/modern/landing-section-dots"
import { ModernFooter } from "@/components/landing/modern/modern-footer"
import { PricingSection } from "@/components/landing/modern/pricing-section"
import { TestimonialsSection } from "@/components/landing/modern/testimonials-section"
import { jetbrainsMono, plusJakarta } from "@/components/landing/modern/fonts"
import {
  landingHeroCard,
  landingHeroGlass,
  landingMainStack,
  landingPageStack,
  landingShell,
} from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

export function ModernLandingPage() {
  return (
    <LandingScrollProvider>
    <div
      id="top"
      className={cn(
        plusJakarta.variable,
        jetbrainsMono.variable,
        "light landing-modern min-h-dvh bg-[#FAFBFC] font-sans text-[#0F172A] antialiased selection:bg-[#0F172A]/10 selection:text-[#0F172A]",
        "scheme-light"
      )}
    >
      <LandingSectionDots />
      <div
        className={cn(
          landingShell,
          landingPageStack,
          "relative z-10 pb-3 sm:pb-5 lg:pb-8"
        )}
      >
        <LandingNav />

          <div className={cn(landingHeroCard, landingHeroGlass)}>
            <HeroLiquidGlassBg />
            <div className="relative z-10 flex min-h-0 flex-1 flex-col">
              <HeroSection />
            </div>
          </div>

          <main className={landingMainStack}>
            <GoalsSection />
            <BentoSection />
            <AboutSection />
            <TestimonialsSection />
            <PricingSection />
          </main>

        <ModernFooter />
      </div>
    </div>
    </LandingScrollProvider>
  )
}
