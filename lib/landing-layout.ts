/** Fluid side gutters — more air on wide monitors, still comfortable on laptop. */
export const LANDING_GUTTER = "px-[clamp(1.25rem,4vw,3rem)]"

/** Shared horizontal frame — laptop stays readable; xl+ uses full desk width. */
export const LANDING_CONTAINER = [
  "mx-auto w-full max-w-5xl",
  LANDING_GUTTER,
  "xl:max-w-6xl",
  "2xl:max-w-7xl",
].join(" ")

/** Dense grids (features bento). */
export const LANDING_CONTAINER_WIDE = [
  "mx-auto w-full max-w-6xl",
  LANDING_GUTTER,
  "xl:max-w-7xl",
  "2xl:max-w-[84rem]",
].join(" ")

/** Compact prose sections (coming soon, FAQ). */
export const LANDING_CONTAINER_NARROW = [
  "mx-auto w-full max-w-4xl",
  LANDING_GUTTER,
  "xl:max-w-5xl",
  "2xl:max-w-6xl",
].join(" ")

/** Hero desk mock — wider on large displays, still capped on laptop. */
export const LANDING_DESK_MAX =
  "mx-auto w-full max-w-[40rem] lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl"

/** Section headings — capped so xl monitors do not inflate type. */
export const LANDING_SECTION_TITLE =
  "text-3xl font-semibold tracking-tight text-foreground md:text-4xl xl:text-4xl"

/** Outer vertical padding for landing sections. */
export const LANDING_SECTION_PY = "py-20 md:py-28 lg:py-36 xl:py-32 2xl:py-36"

/** Slightly tighter rhythm for compact sections (surfaces grid). */
export const LANDING_SECTION_PY_COMPACT = "py-16 md:py-24 lg:py-32 xl:py-28 2xl:py-32"

/** Hero shell padding — no forced full viewport on xl+ (avoids floating on tall monitors). */
export const LANDING_HERO_SHELL =
  "pt-24 pb-16 sm:pt-28 sm:pb-20 md:pt-32 md:pb-24 lg:pt-36 lg:pb-28 xl:pt-28 xl:pb-20 2xl:pt-32 2xl:pb-24"

/** Space between section intro and following content. */
export const LANDING_SECTION_HEADER_MB = "mb-10 md:mb-14 lg:mb-16"

/** Space between section intro text and following block. */
export const LANDING_SECTION_CONTENT_MT = "mt-10 md:mt-14 lg:mt-16"
