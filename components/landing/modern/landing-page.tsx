"use client"

import dynamic from "next/dynamic"

import { HeroLiquidGlassBg } from "@/components/landing/modern/hero-liquid-glass-bg"
import { HeroSection } from "@/components/landing/modern/hero-section"
import { LandingNav } from "@/components/landing/modern/landing-nav"
import { LandingScrollProvider } from "@/components/landing/modern/landing-scroll-context"
import { jetbrainsMono, plusJakarta } from "@/components/landing/modern/fonts"
import {
  landingHeroCard,
  landingHeroGlass,
  landingMainStack,
  landingPageStack,
  landingShell,
} from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

const GoalsSection = dynamic(
  () =>
    import("@/components/landing/modern/goals-section").then(
      (m) => m.GoalsSection
    ),
  { ssr: true }
)
const BentoSection = dynamic(
  () =>
    import("@/components/landing/modern/bento-section").then(
      (m) => m.BentoSection
    ),
  { ssr: true }
)
const AboutSection = dynamic(
  () =>
    import("@/components/landing/modern/about-section").then(
      (m) => m.AboutSection
    ),
  { ssr: true }
)
const CtaSection = dynamic(
  () =>
    import("@/components/landing/modern/cta-section").then((m) => m.CtaSection),
  { ssr: true }
)
const FaqSection = dynamic(
  () =>
    import("@/components/landing/modern/faq-section").then((m) => m.FaqSection),
  { ssr: true }
)
const PricingSection = dynamic(
  () =>
    import("@/components/landing/modern/pricing-section").then(
      (m) => m.PricingSection
    ),
  { ssr: true }
)
const ModernFooter = dynamic(
  () =>
    import("@/components/landing/modern/modern-footer").then(
      (m) => m.ModernFooter
    ),
  { ssr: true }
)

export function ModernLandingPage() {
  return (
    <LandingScrollProvider>
      <div
        id="top"
        className={cn(
          plusJakarta.variable,
          jetbrainsMono.variable,
          "landing-modern min-h-dvh bg-background font-sans text-foreground antialiased selection:bg-foreground/10 selection:text-foreground"
        )}
      >
        <div
          className={cn(
            landingShell,
            landingPageStack,
            "relative z-10 pb-3 sm:pb-5 lg:pb-8"
          )}
        >
          <LandingNav />

          {/* `#top` is the page root, so scroll-spy tracks the hero card itself. */}
          <div id="hero" className={cn(landingHeroCard, landingHeroGlass)}>
            <HeroLiquidGlassBg tone="blue" />
            <div className="relative z-10 flex min-h-0 flex-1 flex-col">
              <HeroSection />
            </div>
          </div>

          <main className={landingMainStack}>
            <GoalsSection />
            <BentoSection />
            <AboutSection />
            {/* Testimonials hidden until we have real X posts — see X_POSTS in
                lib/landing-modern-data.ts. Re-enable together with the "Reviews"
                entries in NAV_LINKS and LANDING_SCROLL_SECTIONS. */}
            {/* <TestimonialsSection /> */}
            <CtaSection />
            <FaqSection />
            <PricingSection />
          </main>

          <ModernFooter />
        </div>
      </div>
    </LandingScrollProvider>
  )
}
