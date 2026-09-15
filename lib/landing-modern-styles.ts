export const LANDING_EASE = [0.16, 1, 0.3, 1] as const

export const landingDisplay = "font-[family-name:var(--font-display)]"

export const landingSection = "scroll-mt-24"

/** Rounded section shell + vertical padding (use on main content blocks). */
export const landingSectionBody =
  "relative isolate overflow-hidden rounded-[2.5rem] py-16 sm:py-20 lg:py-24"

/** White space between hero, sections, and footer. */
export const landingMainStack = "flex flex-col gap-4 sm:gap-5 lg:gap-6"

export const landingPageStack = `${landingMainStack}`

/** Viewport edge spacing — padding keeps mx-auto centering intact (margin gutters break it). */
export const landingFrame = "px-2 sm:px-3 lg:px-4"

/** Centered page column: hero card, sections, and footer card share this width. */
export const landingOuter = "mx-auto w-full max-w-7xl"

/** Frame + centered column — single shell for the whole landing page. */
export const landingShell = `${landingFrame} ${landingOuter}`

export const landingInner = "px-4 sm:px-5 lg:px-6"

export const landingContainer = `${landingOuter} ${landingInner}`

export const landingCardRadius = "rounded-[2.5rem]"

export const landingCardShell = `relative isolate overflow-hidden ${landingCardRadius}`

export const landingHeroCard = `${landingCardShell} mt-3 sm:mt-5`

export const landingFooterCard = `${landingCardShell} mb-3 sm:mb-5 lg:mb-8`

export const landingBadge =
  "inline-flex items-center rounded-full border border-black/8 bg-white px-4 py-1.5 text-sm font-medium text-[#64748B] shadow-sm"

export const landingHeading =
  `${landingDisplay} text-3xl font-semibold leading-[1.15] tracking-tight text-[#0F172A] sm:text-4xl lg:text-[2.75rem]`

export const landingSubheading =
  "mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#64748B] sm:text-lg"

export const landingGlass =
  "border border-white/25 bg-white/12 backdrop-blur-xl"

export const landingGlassLight =
  "border border-black/6 bg-white/70 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur-xl"

export const landingCard =
  "rounded-[1.75rem] bg-white shadow-[0_20px_50px_rgba(15,23,42,0.05)]"

export const landingCtaDark =
  "group inline-flex h-auto items-center gap-2 rounded-full bg-[#0F172A] px-6 py-3 text-sm font-semibold text-white shadow-[0_0_0_1px_rgba(56,189,248,0.35),0_8px_30px_rgba(15,23,42,0.25)] transition-all hover:bg-[#1E293B] hover:shadow-[0_0_0_1px_rgba(56,189,248,0.55),0_12px_40px_rgba(15,23,42,0.3)]"

export const landingCtaLight =
  "group inline-flex h-auto items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#0F172A] shadow-[0_8px_30px_rgba(15,23,42,0.12)] transition-all hover:bg-white/95 hover:shadow-[0_12px_40px_rgba(15,23,42,0.16)]"
