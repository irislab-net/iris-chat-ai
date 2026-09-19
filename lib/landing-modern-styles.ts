/** Cubic-bezier twin of the GSAP `heroDemo` ease registered in `ensureGsapScroll`. */
export const LANDING_EASE = [0.16, 1, 0.3, 1] as const

export const landingDisplay = "font-[family-name:var(--font-display)]"

/** Apple-like display titles — regular weight, tight tracking, soft leading. */
export const landingTitleHero =
  `${landingDisplay} text-[2.35rem] font-normal leading-[1.06] tracking-[-0.025em] text-[#0F172A] sm:text-5xl lg:text-[3.25rem]`

export const landingTitleSection =
  `${landingDisplay} text-3xl font-normal leading-[1.08] tracking-[-0.025em] text-[#0F172A] sm:text-4xl lg:text-[2.75rem]`

export const landingTitleCard =
  `${landingDisplay} text-lg font-normal leading-snug tracking-[-0.015em] text-[#0F172A]`

export const landingTitleCardLg =
  `${landingDisplay} text-2xl font-normal leading-[1.12] tracking-[-0.02em] text-[#0F172A] sm:text-[1.75rem]`

export const landingTitleBrand =
  `${landingDisplay} text-lg font-normal tracking-[-0.02em] text-[#0F172A]`

export const landingTitleFooter =
  `${landingDisplay} text-2xl font-normal tracking-[-0.02em] text-[#0F172A] sm:text-3xl`

export const landingTitleFooterLg =
  `${landingDisplay} text-[1.65rem] font-normal leading-[1.12] tracking-[-0.025em] text-[#0F172A] sm:text-3xl lg:text-[2.25rem]`

export const landingTitleQuote =
  `${landingDisplay} text-lg font-normal leading-snug tracking-[-0.015em] text-[#0F172A] sm:text-xl`

export const landingTitlePlan =
  `${landingDisplay} text-xl font-normal tracking-[-0.02em] text-[#0F172A]`

export const landingTitlePrice =
  `${landingDisplay} text-5xl font-normal tracking-[-0.03em] text-[#0F172A]`

export const landingSection = "scroll-mt-24"

/** Rounded section shell + vertical padding (use on main content blocks). */
export const landingSectionBody =
  "relative isolate overflow-hidden rounded-[2.5rem] py-16 sm:py-20 lg:py-24"

/** White space between sections inside main (min 50px). */
export const landingMainStack = "flex flex-col gap-[50px] sm:gap-20 lg:gap-24"

/** White space between nav, hero, main, and footer (min 50px). */
export const landingPageStack = "flex flex-col gap-[50px] sm:gap-16 lg:gap-20"

/** Extra space between hero card and first section (on top of page stack gap). */
export const landingHeroToMain = "mt-32 sm:mt-32 lg:mt-40"

/** Viewport edge spacing — padding keeps mx-auto centering intact (margin gutters break it). */
export const landingFrame = "px-4.5 sm:px-3 lg:px-4"

/** Centered page column: hero card, sections, and footer card share this width. */
export const landingOuter = "mx-auto w-full max-w-6xl"

/** Frame + centered column — single shell for the whole landing page. */
export const landingShell = `${landingFrame} ${landingOuter}`

export const landingInner = "px-4.5 sm:px-5 lg:px-6"

export const landingContainer = `${landingOuter} ${landingInner}`

export const landingCardRadius = "rounded-[2.5rem]"

export const landingCardShell = `relative isolate overflow-hidden ${landingCardRadius}`

/** Hero card — no overflow clip so compose bubble shadows stay visible. */
export const landingHeroCard = `relative isolate ${landingCardRadius} mt-3 mb-6 sm:mt-5 sm:mb-0`

export const landingFooterCard = `${landingCardShell} mb-3 sm:mb-5 lg:mb-8`

export const landingBadge =
  "inline-flex items-center rounded-full bg-[#F1F5F9] px-4 py-1.5 text-sm font-medium text-[#64748B]"

export const landingHeading = landingTitleSection

export const landingSubheading =
  "mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#64748B] sm:text-lg"

export const landingGlass =
  "bg-white/12 backdrop-blur-xl"

export const landingGlassLight =
  "bg-white/70 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur-xl"

export const landingCard =
  "rounded-[1.75rem] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.07)]"

export const landingSurfaceMuted = "bg-[#F1F5F9]"

/** Liquid glass surface — shared sheen + depth (no borders). */
export const landingGlassSurface =
  "relative isolate overflow-hidden bg-white/38 backdrop-blur-2xl shadow-[0_16px_48px_rgba(15,23,42,0.08),inset_0_1px_1px_rgba(255,255,255,0.92),inset_0_-1px_2px_rgba(255,255,255,0.28)]"

/** Frosted glass pill — hero composer */
export const landingGlassPill =
  `${landingGlassSurface} rounded-full bg-white/44 shadow-[0_20px_56px_rgba(15,23,42,0.09),inset_0_1px_1px_rgba(255,255,255,0.96),inset_0_-1px_2px_rgba(255,255,255,0.3)]`

export const landingGlassSheen =
  "pointer-events-none absolute inset-0 bg-[linear-gradient(145deg,rgba(255,255,255,0.72)_0%,rgba(255,255,255,0.18)_38%,rgba(255,255,255,0.04)_62%,rgba(255,255,255,0)_100%)]"

/** Desktop nav link group — frosted pill */
export const landingNavPill =
  "flex items-center gap-0.5 rounded-full bg-white/42 p-1 shadow-[0_8px_28px_rgba(15,23,42,0.05),inset_0_1px_1px_rgba(255,255,255,0.85)] backdrop-blur-xl"

export const landingNavLinkActive =
  "bg-white font-semibold text-[#0F172A] shadow-[0_2px_10px_rgba(15,23,42,0.07)]"

export const landingNavLinkInactive =
  "font-medium text-[#94A3B8] hover:bg-white/45 hover:text-[#475569]"

/** Nav icon button — liquid glass */
export const landingGlassNavIcon =
  `${landingGlassSurface} size-10 shrink-0 rounded-full bg-white/50 shadow-[0_12px_36px_rgba(15,23,42,0.08),inset_0_1px_1px_rgba(255,255,255,0.95),inset_0_-1px_2px_rgba(255,255,255,0.32)]`

export const landingGlassBlueSheen =
  "pointer-events-none absolute inset-0 bg-[linear-gradient(145deg,rgba(255,255,255,0.42)_0%,rgba(255,255,255,0.14)_40%,rgba(255,255,255,0.05)_62%,transparent_100%)]"

/** Circular liquid-glass chip — chat avatars beside hero bubbles. */
export const landingGlassOrb =
  `${landingGlassSurface} inline-flex size-8 items-center justify-center rounded-full bg-white/52 shadow-[0_10px_28px_rgba(15,23,42,0.08),inset_0_1px_1px_rgba(255,255,255,0.96),inset_0_-1px_2px_rgba(255,255,255,0.32)]`

export const landingGlassBubbleUser =
  `${landingGlassSurface} rounded-3xl rounded-br-md bg-white/48`

export const landingGlassBubbleAi =
  `${landingGlassSurface} rounded-3xl rounded-tl-md bg-white/52`

export const landingGlassBubbleThinking =
  `${landingGlassSurface} rounded-3xl rounded-tl-md bg-white/46`

export const landingHeroGlass =
  "relative flex min-h-[30rem] flex-col bg-white/40 text-[#0F172A] shadow-[0_28px_80px_rgba(15,23,42,0.07)] backdrop-blur-2xl sm:min-h-[32rem] lg:min-h-[36rem]"

/**
 * Compose block — fixed rows + gaps (no layout shift).
 * Height comes from the grid itself (rows + gaps), not a separate wrapper.
 * Mobile rows are taller: narrow width wraps to more lines.
 */
export const landingHeroComposeGrid =
  "grid overflow-visible grid-rows-[5.5rem_10rem_3.5rem] gap-3 sm:grid-rows-[4rem_9.5rem_3.5rem] sm:gap-3.5"

/**
 * Landing CTAs.
 *
 * Height is set by the size token and nothing else. The previous recipe was
 * `h-auto` plus vertical padding, which let the content decide — so the same
 * "primary" CTA rendered at five different heights across the page depending on
 * whether it carried an arrow chip and which call site had overridden padding.
 *
 * Two sizes only: `sm` for chrome (nav, footer), `md` for section and plan CTAs.
 */

const landingCtaBase =
  "group relative isolate inline-flex shrink-0 items-center justify-center gap-2 overflow-hidden rounded-full font-semibold whitespace-nowrap transition-all"

export const LANDING_CTA_SIZES = {
  sm: "h-10 px-5 text-sm",
  md: "h-12 px-6 text-sm",
} as const

export type LandingCtaSize = keyof typeof LANDING_CTA_SIZES

const LANDING_CTA_TONES = {
  /** Blue is reserved for call-to-action buttons only. */
  primary:
    "bg-[#2563EB] text-white shadow-[0_8px_30px_rgba(37,99,235,0.28)] hover:bg-[#1D4ED8] hover:shadow-[0_12px_40px_rgba(37,99,235,0.35)]",
  light:
    "bg-[#F1F5F9] text-[#0F172A] shadow-[0_8px_30px_rgba(15,23,42,0.06)] hover:bg-[#E2E8F0] hover:shadow-[0_12px_40px_rgba(15,23,42,0.1)]",
  glass:
    "bg-[#2563EB]/90 text-white shadow-[0_12px_40px_rgba(37,99,235,0.34),inset_0_1px_1px_rgba(255,255,255,0.38),inset_0_-1px_2px_rgba(29,78,216,0.28)] backdrop-blur-2xl hover:bg-[#2563EB]/96 hover:shadow-[0_16px_48px_rgba(37,99,235,0.42)]",
} as const

export type LandingCtaTone = keyof typeof LANDING_CTA_TONES

export function landingCta(
  tone: LandingCtaTone = "primary",
  size: LandingCtaSize = "md"
): string {
  return `${landingCtaBase} ${LANDING_CTA_SIZES[size]} ${LANDING_CTA_TONES[tone]}`
}
