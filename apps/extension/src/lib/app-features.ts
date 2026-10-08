/**
 * App-wide UI feature / tool visibility registry.
 * Deploy-time env flags control whether surfaces render — not plan entitlements.
 * Missing env → off.
 *
 * Next.js only inlines `process.env.NEXT_PUBLIC_*` with static property access.
 * Never read these via `process.env[dynamicKey]` on the client.
 */

export const APP_FEATURE_IDS = [
  "signal",
  "correlation",
  "volatility",
  "watchlist",
  "voice",
  "staking",
] as const

export type AppFeatureId = (typeof APP_FEATURE_IDS)[number]

export type AppFeaturePrefs = Record<AppFeatureId, boolean>

/** Settings-sheet row order (tools, then surfaces). */
export const APP_FEATURE_SETTINGS_ORDER: readonly AppFeatureId[] =
  APP_FEATURE_IDS

/** Public env keys for each feature (Vercel / .env.local). */
export const APP_FEATURE_ENV_KEYS: Record<AppFeatureId, string> = {
  signal: "NEXT_PUBLIC_FEATURE_SIGNAL",
  correlation: "NEXT_PUBLIC_FEATURE_CORRELATION",
  volatility: "NEXT_PUBLIC_FEATURE_VOLATILITY",
  watchlist: "NEXT_PUBLIC_FEATURE_WATCHLIST",
  voice: "NEXT_PUBLIC_FEATURE_VOICE",
  staking: "NEXT_PUBLIC_FEATURE_STAKING",
}

/** `true` / `1` / `yes` (case-insensitive) → on; anything else or unset → off. */
export function parseAppFeatureEnvFlag(
  value: string | undefined | null
): boolean {
  if (value == null) return false
  const normalized = value.trim().toLowerCase()
  return normalized === "true" || normalized === "1" || normalized === "yes"
}

/** Static reads so Next/Turbopack can inline `NEXT_PUBLIC_*` into the client bundle. */
export function readProcessAppFeatureEnv(): Record<string, string | undefined> {
  return {
    NEXT_PUBLIC_FEATURE_SIGNAL: process.env.NEXT_PUBLIC_FEATURE_SIGNAL,
    NEXT_PUBLIC_FEATURE_CORRELATION: process.env.NEXT_PUBLIC_FEATURE_CORRELATION,
    NEXT_PUBLIC_FEATURE_VOLATILITY: process.env.NEXT_PUBLIC_FEATURE_VOLATILITY,
    NEXT_PUBLIC_FEATURE_WATCHLIST: process.env.NEXT_PUBLIC_FEATURE_WATCHLIST,
    NEXT_PUBLIC_FEATURE_VOICE: process.env.NEXT_PUBLIC_FEATURE_VOICE,
    NEXT_PUBLIC_FEATURE_STAKING: process.env.NEXT_PUBLIC_FEATURE_STAKING,
  }
}

export function createAppFeaturePrefsFromEnv(
  env: Record<string, string | undefined> = readProcessAppFeatureEnv()
): AppFeaturePrefs {
  return {
    signal: parseAppFeatureEnvFlag(env.NEXT_PUBLIC_FEATURE_SIGNAL),
    correlation: parseAppFeatureEnvFlag(env.NEXT_PUBLIC_FEATURE_CORRELATION),
    volatility: parseAppFeatureEnvFlag(env.NEXT_PUBLIC_FEATURE_VOLATILITY),
    watchlist: parseAppFeatureEnvFlag(env.NEXT_PUBLIC_FEATURE_WATCHLIST),
    voice: parseAppFeatureEnvFlag(env.NEXT_PUBLIC_FEATURE_VOICE),
    staking: parseAppFeatureEnvFlag(env.NEXT_PUBLIC_FEATURE_STAKING),
  }
}

/**
 * Resolved at module load from `NEXT_PUBLIC_FEATURE_*`.
 * Unset keys are off.
 */
export const APP_FEATURE_DEFAULTS: AppFeaturePrefs =
  createAppFeaturePrefsFromEnv()

export function isAppFeatureId(value: unknown): value is AppFeatureId {
  return (
    typeof value === "string" &&
    (APP_FEATURE_IDS as readonly string[]).includes(value)
  )
}

export function createDefaultAppFeaturePrefs(): AppFeaturePrefs {
  return { ...APP_FEATURE_DEFAULTS }
}
