/** Feature overview page keys — copy lives in `featuresPage` i18n. */

export const FEATURES_PATH = "/features"

export const FEATURES_DESK_KEYS = [
  "news",
  "copilot",
  "setup",
  "wait",
] as const

export const FEATURES_COMPOSER_KEYS = [
  "signal",
  "correlation",
  "volatility",
] as const

export const FEATURES_ADVANTAGE_KEYS = [
  "markets",
  "languages",
  "guest",
  "google",
  "crypto",
  "honest",
] as const

export type FeaturesDeskKey = (typeof FEATURES_DESK_KEYS)[number]
export type FeaturesComposerKey = (typeof FEATURES_COMPOSER_KEYS)[number]
export type FeaturesAdvantageKey = (typeof FEATURES_ADVANTAGE_KEYS)[number]
