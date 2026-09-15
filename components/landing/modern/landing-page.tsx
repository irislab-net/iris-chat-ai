"use client"

import { AboutSection } from "@/components/landing/modern/about-section"
import { BentoSection } from "@/components/landing/modern/bento-section"
import { GoalsSection } from "@/components/landing/modern/goals-section"
import { HeroFluidBg } from "@/components/landing/modern/hero-fluid-bg"
import { HeroSection } from "@/components/landing/modern/hero-section"
import { LandingNav } from "@/components/landing/modern/landing-nav"
import { ModernFooter } from "@/components/landing/modern/modern-footer"
import { PricingSection } from "@/components/landing/modern/pricing-section"
import { TestimonialsSection } from "@/components/landing/modern/testimonials-section"
import { jetbrainsMono, plusJakarta } from "@/components/landing/modern/fonts"
import { landingHeroCard, landingMainStack, landingPageStack, landingShell } from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

export function ModernLandingPage() {
  return (
    <div
      id="top"
      className={cn(
        plusJakarta.variable,
        jetbrainsMono.variable,
        "light landing-modern min-h-dvh bg-white font-sans text-[#0F172A] antialiased selection:bg-[#2563EB] selection:text-white",
        "[color-scheme:light]"
      )}
    >
      <div
        className={cn(
          landingShell,
          landingPageStack,
          "relative z-10 pb-3 sm:pb-5 lg:pb-8"
        )}
      >
        <div className={cn(landingHeroCard, "text-white")}>
            <div aria-hidden className="sphere-hero-bg pointer-events-none absolute inset-0 z-0" />
            <HeroFluidBg />
            <div className="relative z-10">
              <LandingNav />
              <HeroSection />
            </div>
          </div>

          <main className={landingMainStack}>
            <GoalsSection />
            <AboutSection />
            <BentoSection />
            <PricingSection />
            <TestimonialsSection />
          </main>

        <ModernFooter />
      </div>
    </div>
  )
}
