import type { ComponentType, ReactNode } from "react"

import type {
  FeaturesAdvantageKey,
  FeaturesComposerKey,
  FeaturesDeskKey,
} from "@/lib/features-overview-data"

/**
 * Geometric marks for the features page — same hairline circle vocabulary as
 * how-it-works / signals marks so stroke-draw animation stays consistent.
 */

function Mark({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      stroke="currentColor"
      strokeWidth={0.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-full overflow-visible"
    >
      {children}
    </svg>
  )
}

/** News — lead story framed, quiet feed around it. */
function NewsMark() {
  return (
    <Mark>
      <circle cx="20" cy="20" r="13" />
      <circle cx="20" cy="20" r="5.5" />
      <circle cx="20" cy="20" r="2.2" fill="currentColor" stroke="none" />
    </Mark>
  )
}

/** Copilot — layers of context resolving into one reading. */
function CopilotMark() {
  return (
    <Mark>
      <circle cx="14.15" cy="20" r="10.5" strokeOpacity={0.2} />
      <circle cx="18.05" cy="20" r="10.5" strokeOpacity={0.4} />
      <circle cx="21.95" cy="20" r="10.5" strokeOpacity={0.65} />
      <circle cx="25.85" cy="20" r="10.5" />
    </Mark>
  )
}

/** Setup — structured levels settling on one side. */
function SetupMark() {
  return (
    <Mark>
      <circle cx="20" cy="20" r="13" />
      <path d="M12 24.5h16" strokeOpacity={0.35} />
      <path d="M14 20h12" strokeOpacity={0.55} />
      <path d="M16 15.5h8" />
      <circle cx="20" cy="15.5" r="1.6" fill="currentColor" stroke="none" />
    </Mark>
  )
}

/** Wait — two options, neither forced. */
function WaitMark() {
  return (
    <Mark>
      <circle cx="14.5" cy="20" r="10.5" strokeOpacity={0.4} />
      <circle cx="25.5" cy="20" r="10.5" />
      <circle cx="14.5" cy="20" r="3.2" strokeOpacity={0.55} />
      <circle cx="25.5" cy="20" r="3.2" strokeOpacity={0.55} />
    </Mark>
  )
}

/** Signal — aim on the asset. */
function SignalMark() {
  return (
    <Mark>
      <circle cx="20" cy="20" r="13" />
      <circle cx="20" cy="20" r="4.5" />
      <path d="M20 7v5.5M20 27.5V33M7 20h5.5M27.5 20H33" />
    </Mark>
  )
}

/** Correlation — linked assets. */
function CorrelationMark() {
  return (
    <Mark>
      <circle cx="13.5" cy="20" r="7.5" />
      <circle cx="26.5" cy="20" r="7.5" />
      <path d="M18.5 16.5c1.2-1.8 3.8-1.8 5 0M18.5 23.5c1.2 1.8 3.8 1.8 5 0" />
    </Mark>
  )
}

/** Volatility — expected move band. */
function VolatilityMark() {
  return (
    <Mark>
      <circle cx="20" cy="20" r="13" />
      <path d="M10 22.5c2.5-6 5-8 10-8s7.5 2 10 8" />
      <path d="M12 25.5c2-3.5 4-4.5 8-4.5s6 1 8 4.5" strokeOpacity={0.45} />
    </Mark>
  )
}

/** Markets — live desks. */
function MarketsMark() {
  return (
    <Mark>
      <circle cx="20" cy="20" r="13" />
      <circle cx="20" cy="20" r="7.5" strokeOpacity={0.45} />
      <path d="M20 7v26M7 20h26" strokeOpacity={0.35} />
    </Mark>
  )
}

/** Languages — two readings, one core. */
function LanguagesMark() {
  return (
    <Mark>
      <circle cx="15" cy="18" r="9" strokeOpacity={0.45} />
      <circle cx="25" cy="22" r="9" />
      <circle cx="20" cy="20" r="3" fill="currentColor" stroke="none" />
    </Mark>
  )
}

/** Guest — open start. */
function GuestMark() {
  return (
    <Mark>
      <circle cx="20" cy="20" r="13" strokeOpacity={0.35} />
      <circle cx="20" cy="20" r="8" />
      <circle cx="20" cy="20" r="2.4" fill="currentColor" stroke="none" />
    </Mark>
  )
}

/** Google / account — verified ring. */
function GoogleMark() {
  return (
    <Mark>
      <circle cx="20" cy="20" r="13" />
      <path d="M13.5 20.5l3.8 3.8 9.2-9.2" />
    </Mark>
  )
}

/** Crypto pay — transfer settling. */
function CryptoMark() {
  return (
    <Mark>
      <circle cx="20" cy="14" r="6.5" />
      <circle cx="20" cy="26" r="6.5" strokeOpacity={0.45} />
      <path d="M20 20.5v5.5" />
    </Mark>
  )
}

/** Honest outcomes — setup or wait. */
function HonestMark() {
  return (
    <Mark>
      <circle cx="14.5" cy="20" r="10.5" strokeOpacity={0.4} />
      <circle cx="25.5" cy="20" r="10.5" />
      <circle cx="25.5" cy="20" r="3.6" fill="currentColor" stroke="none" />
    </Mark>
  )
}

export const FEATURES_DESK_MARKS: Record<
  FeaturesDeskKey,
  ComponentType
> = {
  news: NewsMark,
  copilot: CopilotMark,
  setup: SetupMark,
  wait: WaitMark,
}

export const FEATURES_COMPOSER_MARKS: Record<
  FeaturesComposerKey,
  ComponentType
> = {
  signal: SignalMark,
  correlation: CorrelationMark,
  volatility: VolatilityMark,
}

export const FEATURES_ADVANTAGE_MARKS: Record<
  FeaturesAdvantageKey,
  ComponentType
> = {
  markets: MarketsMark,
  languages: LanguagesMark,
  guest: GuestMark,
  google: GoogleMark,
  crypto: CryptoMark,
  honest: HonestMark,
}
