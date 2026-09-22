"use client"

import dynamic from "next/dynamic"

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
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[28rem] w-full" aria-hidden />
    ),
  }
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

/** Below-fold landing sections — client boundary for code-splitting + deferred About orb. */
export function LandingBelowFold() {
  return (
    <>
      <GoalsSection />
      <BentoSection />
      <DeskSurfacesSection />
      <SignalWaitSection />
      <SignalsMarketsSection />
      <AboutSection />
      {/* Testimonials hidden until we have real X posts — see X_POSTS in
          lib/landing-modern-data.ts. Re-enable together with the "Reviews"
          entries in NAV_LINKS and LANDING_SCROLL_SECTIONS. */}
      <GuestTrialSection />
      <PricingSection />
      <FaqSection />
      <CtaSection />
    </>
  )
}
