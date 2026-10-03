import { z } from "zod"

export const TRADING_PROFILE_STORAGE_KEY = "exur_trading_profile"
export const TRADING_PROFILE_CHANGED_EVENT = "exur:trading-profile-changed"

export const EXPERIENCE_LEVELS = [
  "beginner",
  "intermediate",
  "advanced",
] as const

export const TARGET_MARKETS = [
  "crypto",
  "forex",
  "commodities",
  "multi",
] as const

export const RISK_TOLERANCES = ["low", "medium", "high"] as const

export const tradingProfileSchema = z.object({
  experience_level: z.enum(EXPERIENCE_LEVELS),
  country: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((value) => (value ? value : undefined)),
  target_market: z.enum(TARGET_MARKETS),
  risk_tolerance: z.enum(RISK_TOLERANCES),
})

export type TradingProfile = z.infer<typeof tradingProfileSchema>
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number]
export type TargetMarket = (typeof TARGET_MARKETS)[number]
export type RiskTolerance = (typeof RISK_TOLERANCES)[number]

export type TradingProfileDraft = {
  experience_level: ExperienceLevel
  country: string
  target_market: TargetMarket
  risk_tolerance: RiskTolerance
}

export const DEFAULT_TRADING_PROFILE_DRAFT: TradingProfileDraft = {
  experience_level: "intermediate",
  country: "",
  target_market: "crypto",
  risk_tolerance: "medium",
}

let profileVersion = 0

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined"
}

function notifyTradingProfileChanged() {
  profileVersion += 1
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event(TRADING_PROFILE_CHANGED_EVENT))
}

export function getTradingProfileVersion() {
  return profileVersion
}

export function subscribeTradingProfile(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {}
  window.addEventListener(TRADING_PROFILE_CHANGED_EVENT, onStoreChange)
  return () => {
    window.removeEventListener(TRADING_PROFILE_CHANGED_EVENT, onStoreChange)
  }
}

/** Parse + validate a stored profile. Returns `null` when missing or invalid. */
export function parseTradingProfile(raw: unknown): TradingProfile | null {
  const parsed = tradingProfileSchema.safeParse(raw)
  if (!parsed.success) return null
  return parsed.data
}

export function readTradingProfile(): TradingProfile | null {
  if (!canUseLocalStorage()) return null
  try {
    const raw = localStorage.getItem(TRADING_PROFILE_STORAGE_KEY)
    if (!raw) return null
    return parseTradingProfile(JSON.parse(raw) as unknown)
  } catch {
    return null
  }
}

export function tradingProfileToDraft(
  profile: TradingProfile | null
): TradingProfileDraft {
  if (!profile) return { ...DEFAULT_TRADING_PROFILE_DRAFT }
  return {
    experience_level: profile.experience_level,
    country: profile.country ?? "",
    target_market: profile.target_market,
    risk_tolerance: profile.risk_tolerance,
  }
}

export function writeTradingProfile(
  draft: TradingProfileDraft
): TradingProfile | null {
  const parsed = parseTradingProfile({
    experience_level: draft.experience_level,
    country: draft.country.trim() || undefined,
    target_market: draft.target_market,
    risk_tolerance: draft.risk_tolerance,
  })
  if (!parsed) return null

  if (canUseLocalStorage()) {
    try {
      localStorage.setItem(
        TRADING_PROFILE_STORAGE_KEY,
        JSON.stringify(parsed)
      )
    } catch {
      // Private mode / quota — still notify so in-memory readers refresh.
    }
  }

  notifyTradingProfileChanged()
  return parsed
}

export function clearTradingProfile() {
  if (canUseLocalStorage()) {
    try {
      localStorage.removeItem(TRADING_PROFILE_STORAGE_KEY)
    } catch {
      // ignore
    }
  }
  notifyTradingProfileChanged()
}
