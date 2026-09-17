/**
 * Production site origin for canonical / metadataBase / robots.
 * Prefer NEXT_PUBLIC_APP_URL; fallback matches OAuth destination default in lib/api/config.ts.
 */
export const PRODUCTION_ORIGIN = "https://chat.irislab.info"

export function getSiteOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "")
  if (fromEnv) return fromEnv
  return PRODUCTION_ORIGIN
}

export const SITE_NAME = "Exur"

export const SITE_DESCRIPTION =
  "Exur is your AI financial assistant. Ask about spending, savings, and what’s next."

export const ABOUT_DESCRIPTION =
  "Exur is an AI financial assistant. Ask about spending, savings, and what’s next, in your own words."

export const PRIVACY_DESCRIPTION =
  "How Exur collects, uses, and protects personal data. Privacy Policy and GDPR Notice."

export const TERMS_DESCRIPTION =
  "Terms of Service for Exur: eligibility, no financial advice, accounts, liability, and contact."

/** Verified public contact from product UI (`website-toolbar` CONTACT.x). */
export const SOCIAL_X_URL = "https://x.com/TheIrisLab"

/** Authenticated / public market desk (Launch App target). */
export const APP_PATH = "/"

/** Marketing landing page. */
export const LANDING_PATH = "/home"

/** Launch App lands on the news tab (canonical in-app entry). */
export const APP_NEWS_PATH = `${APP_PATH}?tab=news`

/** Desk routes — root chat app and legacy `/app` redirect target. */
export function isAppDeskPath(pathname: string | null | undefined): boolean {
  return pathname === APP_PATH || pathname === "/app"
}

/** Full-screen plan picker → crypto invoice checkout. */
export const UPGRADE_PATH = "/upgrade"

/** Public indexable paths (sitemap + IA) — keep in sync with INDEXABLE_ROUTES. */
export const PUBLIC_INDEXABLE_PATHS = [
  APP_PATH,
  LANDING_PATH,
  "/about",
  "/ai-trading-signals",
  "/privacy",
  "/terms",
] as const

/** Root homepage — intentional public acquisition URL. */
export const ROOT_ROBOTS = {
  index: true,
  follow: true,
} as const

/** OAuth callback — never a search landing page. */
export const AUTH_SUCCESS_ROBOTS = {
  index: false,
  follow: false,
} as const

/** Plan picker / checkout — conversion page, not a search landing. */
export const UPGRADE_ROBOTS = AUTH_SUCCESS_ROBOTS
