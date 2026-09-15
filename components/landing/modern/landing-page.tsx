"use client"

import { FutureSection } from "@/components/landing/modern/future-section"
import { HeroSection } from "@/components/landing/modern/hero-section"
import { HowItWorksSection } from "@/components/landing/modern/how-it-works-section"
import { IntelligenceSection } from "@/components/landing/modern/intelligence-section"
import { LandingNav } from "@/components/landing/modern/landing-nav"
import { MeetExurSection } from "@/components/landing/modern/meet-exur-section"
import { ModernFooter } from "@/components/landing/modern/modern-footer"
import { VoicesSection } from "@/components/landing/modern/voices-section"
import { jetbrainsMono, plusJakarta } from "@/components/landing/modern/fonts"
import { cn } from "@/lib/utils"

const NOISE_BG =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

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
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[90] opacity-[0.035]"
        style={{ backgroundImage: NOISE_BG }}
      />

      <LandingNav />

      <main className="relative z-10">
        <HeroSection />
        <IntelligenceSection />
        <HowItWorksSection />
        <VoicesSection />
        <FutureSection />
        <MeetExurSection />
      </main>

      <ModernFooter />
    </div>
  )
}
