"use client"

import dynamic from "next/dynamic"
import { useLocale } from "next-intl"

import { HeroLiquidGlassBg } from "@/components/landing/modern/hero-liquid-glass-bg"
import { HeroSection } from "@/components/landing/modern/hero-section"
import { LandingNav } from "@/components/landing/modern/landing-nav"
import { LandingScrollProvider } from "@/components/landing/modern/landing-scroll-context"
import {
  MAIN_CONTENT_ID,
  SkipToContent,
} from "@/components/landing/modern/skip-to-content"
import { jetbrainsMono, plusJakarta } from "@/components/landing/modern/fonts"
import { localeDirection } from "@/lib/i18n/locale"
import {
  landingHeroCard,
  landingHeroGlass,
  landingHeroToMain,
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
const DeskSurfacesSection = dynamic(
  () =>
    import("@/components/landing/modern/desk-surfaces-section").then(
      (m) => m.DeskSurfacesSection
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
const SignalWaitSection = dynamic(
  () =>
    import("@/components/landing/modern/signal-wait-section").then(
      (m) => m.SignalWaitSection
    ),
  { ssr: true }
)
const SignalsMarketsSection = dynamic(
  () =>
    import("@/components/landing/modern/signals-markets-section").then(
      (m) => m.SignalsMarketsSection
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
const GuestTrialSection = dynamic(
  () =>
    import("@/components/landing/modern/guest-trial-section").then(
      (m) => m.GuestTrialSection
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
  const locale = useLocale()
  // next/font injects a size-adjusted "Fallback" face that covers Arabic glyphs
  // and steals Persian/Arabic from IRIS Sans (Vazirmatn). Override the variable:
  // RTL → IRIS Sans; LTR → Plus Jakarta primary only (no Fallback).
  const displayFont =
    localeDirection(locale) === "rtl"
      ? '"IRIS Sans"'
      : (plusJakarta.style.fontFamily.split(",")[0]?.trim() ??
        '"Plus Jakarta Sans"')

  return (
    <LandingScrollProvider>
      <div
        id="top"
        className={cn(
          plusJakarta.variable,
          jetbrainsMono.variable,
          "landing-modern min-h-dvh bg-background font-sans text-foreground antialiased selection:bg-foreground/10 selection:text-foreground"
        )}
        style={{ ["--font-display" as string]: displayFont }}
      >
        <SkipToContent />
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

          <main
            id={MAIN_CONTENT_ID}
            tabIndex={-1}
            className={cn(landingMainStack, landingHeroToMain, "outline-none")}
          >
            <GoalsSection />
            <BentoSection />
            <DeskSurfacesSection />
            <SignalWaitSection />
            <SignalsMarketsSection />
            <AboutSection />
            {/* Testimonials hidden until we have real X posts — see X_POSTS in
                lib/landing-modern-data.ts. Re-enable together with the "Reviews"
                entries in NAV_LINKS and LANDING_SCROLL_SECTIONS. */}
            {/* <TestimonialsSection /> */}
            <GuestTrialSection />
            <PricingSection />
            <FaqSection />
            <CtaSection />
          </main>

          <ModernFooter />
        </div>
      </div>
    </LandingScrollProvider>
  )
}
