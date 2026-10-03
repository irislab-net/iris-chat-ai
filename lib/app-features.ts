/**
 * App-wide UI feature / tool visibility registry.
 * Toggles control whether surfaces render — not plan entitlements.
 */

export const APP_FEATURE_IDS = [
  "signal",
  "correlation",
  "volatility",
  "watchlist",
  "voice",
] as const

export type AppFeatureId = (typeof APP_FEATURE_IDS)[number]

export type AppFeaturePrefs = Record<AppFeatureId, boolean>

/** Default: every registered surface is visible. */
export const APP_FEATURE_DEFAULTS: AppFeaturePrefs = {
  signal: true,
  correlation: true,
  volatility: true,
  watchlist: true,
  voice: true,
}

/** Settings / docs order. */
export const APP_FEATURE_SETTINGS_ORDER: AppFeatureId[] = [
  "signal",
  "correlation",
  "volatility",
  "watchlist",
  "voice",
]

export function isAppFeatureId(value: unknown): value is AppFeatureId {
  return (
    typeof value === "string" &&
    (APP_FEATURE_IDS as readonly string[]).includes(value)
  )
}

export function createDefaultAppFeaturePrefs(): AppFeaturePrefs {
  return { ...APP_FEATURE_DEFAULTS }
}
