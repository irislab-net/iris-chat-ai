/** Cubic-bezier twin of the GSAP `heroDemo` ease registered in `ensureGsapScroll`. */
export const LANDING_EASE = [0.16, 1, 0.3, 1] as const

export const landingDisplay =
  '[font-family:var(--font-display),var(--font-sans)]'

/** Apple-like display titles — regular weight, tight tracking, soft leading. */
export const landingTitleHero =
  `${landingDisplay} text-[2.35rem] font-normal leading-[1.06] tracking-[-0.025em] text-foreground sm:text-5xl lg:text-[3.25rem]`

export const landingTitleSection =
  `${landingDisplay} text-3xl font-normal leading-[1.08] tracking-[-0.025em] text-foreground sm:text-4xl lg:text-[2.75rem]`

export const landingTitleCard =
  `${landingDisplay} text-lg font-normal leading-snug tracking-[-0.015em] text-foreground`

export const landingTitleCardLg =
  `${landingDisplay} text-2xl font-normal leading-[1.12] tracking-[-0.02em] text-foreground sm:text-[1.75rem]`

export const landingTitleBrand =
  `${landingDisplay} text-lg font-normal tracking-[-0.02em] text-foreground`

export const landingTitleFooter =
  `${landingDisplay} text-2xl font-normal tracking-[-0.02em] text-foreground sm:text-3xl`

export const landingTitleFooterLg =
  `${landingDisplay} text-[1.65rem] font-normal leading-[1.12] tracking-[-0.025em] text-foreground sm:text-3xl lg:text-[2.25rem]`

export const landingTitleQuote =
  `${landingDisplay} text-lg font-normal leading-snug tracking-[-0.015em] text-foreground sm:text-xl`

export const landingTitlePlan =
  `${landingDisplay} text-xl font-normal tracking-[-0.02em] text-foreground`

export const landingTitlePrice =
  `${landingDisplay} text-5xl font-normal tracking-[-0.03em] text-foreground`

export const landingSection = "scroll-mt-24"

/** Rounded section shell + vertical padding (use on main content blocks). */
export const landingSectionBody =
  "relative isolate overflow-hidden rounded-[2.5rem] py-16 sm:py-20 lg:py-24"

/** White space between sections inside main (min 50px). */
export const landingMainStack = "flex flex-col gap-12.5 sm:gap-20 lg:gap-24"

/** White space between nav, hero, main, and footer (min 50px). */
export const landingPageStack = "flex flex-col gap-12.5 sm:gap-16 lg:gap-20"

/** Extra space between hero card and first section (on top of page stack gap). */
export const landingHeroToMain = "mt-32 sm:mt-32 lg:mt-40"

/** Viewport edge spacing — padding keeps mx-auto centering intact (margin gutters break it). */
export const landingFrame = "px-4.5 sm:px-3 lg:px-4"

/** Centered page column: hero card, sections, and footer card share this width. */
export const landingOuter = "mx-auto w-full max-w-6xl"

/** Frame + centered column — single shell for the whole landing page. */
export const landingShell = `${landingFrame} ${landingOuter}`

export const landingInner = "px-4.5 sm:px-5 lg:px-6"

/** Shared gap between `SectionHeader` and the section body. */
export const landingAfterHeader = "mt-12 lg:mt-14"

export const landingContainer = `${landingOuter} ${landingInner}`

/**
 * Shared content measure inside `landingInner`.
 * Section headers (`max-w-3xl`) and editorial bodies share this so columns align.
 */
export const landingContent = "mx-auto w-full max-w-3xl"

/** Full inner width for multi-column grids (how-it-works, markets, pricing). */
export const landingContentWide = "mx-auto w-full"

export const landingCardRadius = "rounded-[2.5rem]"

export const landingCardShell = `relative isolate overflow-hidden ${landingCardRadius}`

/** Hero card — no overflow clip so compose bubble shadows stay visible. */
export const landingHeroCard = `relative isolate ${landingCardRadius} mt-3 mb-6 sm:mt-5 sm:mb-0`

export const landingFooterCard = `${landingCardShell} mb-3 sm:mb-5 lg:mb-8`

export const landingBadge =
  "inline-flex items-center rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-muted-foreground"

export const landingHeading = landingTitleSection

export const landingSubheading =
  "mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg"

export const landingGlass =
  "bg-white/12 backdrop-blur-xl dark:bg-white/6"

export const landingGlassLight =
  "bg-white/70 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:bg-white/8 dark:shadow-[0_20px_60px_rgba(0,0,0,0.35)]"

export const landingCard =
  "rounded-[1.75rem] bg-card text-card-foreground shadow-[0_24px_60px_rgba(15,23,42,0.07)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.35)]"

export const landingSurfaceMuted = "bg-muted"

/** Liquid glass surface — shared sheen + depth (no borders). */
export const landingGlassSurface =
  "relative isolate overflow-hidden bg-white/38 backdrop-blur-2xl shadow-[0_16px_48px_rgba(15,23,42,0.08),inset_0_1px_1px_rgba(255,255,255,0.92),inset_0_-1px_2px_rgba(255,255,255,0.28)] dark:bg-white/8 dark:shadow-[0_16px_48px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.12),inset_0_-1px_2px_rgba(255,255,255,0.04)]"

/** Frosted glass pill — hero composer */
export const landingGlassPill =
  `${landingGlassSurface} rounded-full bg-white/44 shadow-[0_20px_56px_rgba(15,23,42,0.09),inset_0_1px_1px_rgba(255,255,255,0.96),inset_0_-1px_2px_rgba(255,255,255,0.3)] dark:bg-white/10 dark:shadow-[0_20px_56px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.14),inset_0_-1px_2px_rgba(255,255,255,0.04)]`

export const landingGlassSheen =
  "pointer-events-none absolute inset-0 bg-[linear-gradient(145deg,rgba(255,255,255,0.72)_0%,rgba(255,255,255,0.18)_38%,rgba(255,255,255,0.04)_62%,rgba(255,255,255,0)_100%)] dark:bg-[linear-gradient(145deg,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0.05)_38%,rgba(255,255,255,0.02)_62%,transparent_100%)]"

/** Desktop nav link group — frosted pill */
export const landingNavPill =
  "flex items-center gap-0.5 rounded-full bg-white/42 p-1 shadow-[0_8px_28px_rgba(15,23,42,0.05),inset_0_1px_1px_rgba(255,255,255,0.85)] backdrop-blur-xl dark:bg-white/8 dark:shadow-[0_8px_28px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.1)]"

export const landingNavLinkActive =
  "bg-white font-semibold text-foreground shadow-[0_2px_10px_rgba(15,23,42,0.07)] dark:bg-white/12 dark:shadow-[0_2px_10px_rgba(0,0,0,0.3)]"

export const landingNavLinkInactive =
  "font-medium text-muted-foreground hover:bg-white/45 hover:text-foreground dark:hover:bg-white/8"

/** Nav icon button — liquid glass */
export const landingGlassNavIcon =
  `${landingGlassSurface} size-10 shrink-0 rounded-full bg-white/50 shadow-[0_12px_36px_rgba(15,23,42,0.08),inset_0_1px_1px_rgba(255,255,255,0.95),inset_0_-1px_2px_rgba(255,255,255,0.32)] dark:bg-white/10 dark:shadow-[0_12px_36px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.12),inset_0_-1px_2px_rgba(255,255,255,0.04)]`

export const landingGlassBlueSheen =
  "pointer-events-none absolute inset-0 bg-[linear-gradient(145deg,rgba(255,255,255,0.42)_0%,rgba(255,255,255,0.14)_40%,rgba(255,255,255,0.05)_62%,transparent_100%)] dark:bg-[linear-gradient(145deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0.06)_40%,transparent_100%)]"

/** Circular liquid-glass chip — chat avatars beside hero bubbles. */
export const landingGlassOrb =
  `${landingGlassSurface} inline-flex size-8 items-center justify-center rounded-full bg-white/52 shadow-[0_10px_28px_rgba(15,23,42,0.08),inset_0_1px_1px_rgba(255,255,255,0.96),inset_0_-1px_2px_rgba(255,255,255,0.32)] dark:bg-white/10 dark:shadow-[0_10px_28px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.12),inset_0_-1px_2px_rgba(255,255,255,0.04)]`

export const landingGlassBubbleUser =
  `${landingGlassSurface} rounded-3xl rounded-br-md bg-white/48 dark:bg-white/10`

export const landingGlassBubbleAi =
  `${landingGlassSurface} rounded-3xl rounded-tl-md bg-white/52 dark:bg-white/10`

export const landingGlassBubbleThinking =
  `${landingGlassSurface} rounded-3xl rounded-tl-md bg-white/46 dark:bg-white/8`

export const landingHeroGlass =
  "relative flex min-h-[30rem] flex-col bg-white/40 text-foreground shadow-[0_28px_80px_rgba(15,23,42,0.07)] backdrop-blur-2xl dark:bg-white/6 dark:shadow-[0_28px_80px_rgba(0,0,0,0.45)] sm:min-h-[32rem] lg:min-h-[36rem]"

/**
 * Compose block — fixed rows + gaps (no layout shift).
 * Height comes from the grid itself (rows + gaps), not a separate wrapper.
 * Mobile rows are taller: narrow width wraps to more lines.
 */
export const landingHeroComposeGrid =
  "grid overflow-visible grid-rows-[5.5rem_10rem_3.5rem] gap-3 sm:grid-rows-[4rem_9.5rem_3.5rem] sm:gap-3.5"

/**
 * Signal/wait demo — fixed rows (mobile-safe).
 * [chat: user + optional EX] [result] [composer]
 */
export const landingSignalWaitComposeGrid =
  "grid h-full grid-rows-[auto_minmax(0,1fr)_3.5rem] gap-2.5 sm:gap-3"

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
    "bg-muted text-foreground shadow-[0_8px_30px_rgba(15,23,42,0.06)] hover:bg-muted/80 hover:shadow-[0_12px_40px_rgba(15,23,42,0.1)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.28)] dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)]",
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
