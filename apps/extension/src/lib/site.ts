import { CHAT_APP_ORIGIN, MARKETING_ORIGIN } from "@/lib/hosts"

/**
 * Production chat app origin for OAuth / desk metadata.
 * Prefer NEXT_PUBLIC_APP_URL; fallback matches chat.exur.ai.
 */
export const PRODUCTION_ORIGIN = "https://chat.exur.ai"

export function getSiteOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "")
  if (fromEnv) return fromEnv
  return PRODUCTION_ORIGIN
}

export const SITE_NAME = "Exur"

export const SITE_DESCRIPTION =
  "Exur is your AI financial assistant. Ask about news and price action in plain language. Get a clear setup, or a reason to sit out — not another feed."

export const ABOUT_DESCRIPTION =
  "Exur is an AI financial assistant. Ask about news and price action in your own words, and get a clear setup — or a reason to sit out."

export const PRIVACY_DESCRIPTION =
  "How Exur collects, uses, and protects personal data. Privacy Policy and GDPR Notice."

export const TERMS_DESCRIPTION =
  "Terms of Service for Exur: eligibility, no financial advice, accounts, liability, and contact."

export const REFUND_DESCRIPTION =
  "Refund Policy for Exur premium subscriptions: non-refundable payments, cancellation, and billing support."

export {
  SECURITY_DESCRIPTION,
  SECURITY_PATH,
  SECURITY_TITLE,
} from "@/lib/security"

/** Verified public contact from product UI (`website-toolbar` CONTACT.x). */
export const SOCIAL_X_URL = "https://x.com/exur_ai"

/** Public Telegram channel. */
export const SOCIAL_TELEGRAM_URL = "https://t.me/exur_ai"

/** Authenticated / public market desk (Launch App target on chat.exur.ai). */
export const APP_PATH = "/"

/**
 * Marketing landing path.
 * On production apex this is `/`. Local / preview still uses `/home`.
 */
export const LANDING_PATH = "/"

/** Absolute marketing home — always external in the extension. */
export function getLandingHref(): string {
  return MARKETING_ORIGIN
}

/**
 * Marketing page href for links that may render on chat.exur.ai.
 * Extension always uses absolute apex URLs (no in-extension marketing routes).
 */
export function getMarketingPageHref(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`
  return `${MARKETING_ORIGIN}${normalized}`
}

/** Marketing home path fragment for FAQ anchors — always apex. */
export function getMarketingHomePath(): string {
  return "/"
}

/** Canonical in-app desk entry (news workspace at `/`). */
export const APP_NEWS_PATH = APP_PATH

/**
 * Cross-host Launch App href.
 * Relative on local so `local.exur.ai` keeps same-origin desk; absolute in production.
 */
export function getLaunchAppHref(): string {
  if (process.env.NODE_ENV === "development") return APP_NEWS_PATH
  return `${CHAT_APP_ORIGIN}${APP_NEWS_PATH}`
}

/** Desk routes — root chat app and legacy `/app` redirect target. */
export function isAppDeskPath(pathname: string | null | undefined): boolean {
  return pathname === APP_PATH || pathname === "/app"
}

/** Plan picker on the web chat app (opens in a new tab from the extension). */
export const UPGRADE_PATH = `${PRODUCTION_ORIGIN}/upgrade`

/** Billing status on the web chat app (opens in a new tab from the extension). */
export const BILLING_PATH = `${PRODUCTION_ORIGIN}/billing`

/** Public indexable paths (sitemap + IA) — keep in sync with INDEXABLE_ROUTES. */
export const PUBLIC_INDEXABLE_PATHS = [
  APP_PATH,
  "/what-is-exur",
  "/about",
  "/ai-trading-signals",
  "/privacy",
  "/security",
  "/terms",
  "/refund",
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

/** Account billing — signed-in utility page. */
export const BILLING_ROBOTS = AUTH_SUCCESS_ROBOTS
