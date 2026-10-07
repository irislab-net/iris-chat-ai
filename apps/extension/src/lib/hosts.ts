import { routing } from "@/i18n/routing"

/** Apex — desk at `/`, landing at `/home`, plus public marketing pages. */
export const MARKETING_ORIGIN = "https://exur.ai"
export const MARKETING_HOST = "exur.ai"
export const MARKETING_WWW_HOST = "www.exur.ai"

/** Alternate chat desk host (same app as apex `/`). */
export const CHAT_APP_ORIGIN = "https://chat.exur.ai"
export const CHAT_APP_HOST = "chat.exur.ai"

const MARKETING_HOSTS = new Set([MARKETING_HOST, MARKETING_WWW_HOST])

/** Locales that appear as a URL prefix (`as-needed` skips the default). */
const PREFIX_LOCALES = routing.locales.filter(
  (locale) => locale !== routing.defaultLocale
)

export function isMarketingHost(hostname: string): boolean {
  return MARKETING_HOSTS.has(hostname)
}

export function isProductionChatHost(hostname: string): boolean {
  return hostname === CHAT_APP_HOST
}

/** Hosts that participate in the apex / chat split (not local or preview). */
export function isSplitHost(hostname: string): boolean {
  return isMarketingHost(hostname) || isProductionChatHost(hostname)
}

export function splitLocalePath(pathname: string): {
  localePrefix: string | null
  pathnameWithoutLocale: string
} {
  for (const locale of PREFIX_LOCALES) {
    if (pathname === `/${locale}`) {
      return { localePrefix: locale, pathnameWithoutLocale: "/" }
    }
    if (pathname.startsWith(`/${locale}/`)) {
      return {
        localePrefix: locale,
        pathnameWithoutLocale: pathname.slice(locale.length + 1) || "/",
      }
    }
  }
  return { localePrefix: null, pathnameWithoutLocale: pathname || "/" }
}

export function withLocalePrefix(
  localePrefix: string | null,
  path: string
): string {
  const normalized = path.startsWith("/") ? path : `/${path}`
  if (!localePrefix) {
    return normalized === "" ? "/" : normalized
  }
  if (normalized === "/") return `/${localePrefix}`
  return `/${localePrefix}${normalized}`
}

/** Paths that belong on chat.exur.ai (desk + account utilities). */
export function isChatOnlyPath(pathnameWithoutLocale: string): boolean {
  if (pathnameWithoutLocale === "/app") return true
  if (pathnameWithoutLocale.startsWith("/app/")) return true
  if (pathnameWithoutLocale === "/upgrade") return true
  if (pathnameWithoutLocale.startsWith("/upgrade/")) return true
  if (pathnameWithoutLocale === "/billing") return true
  if (pathnameWithoutLocale.startsWith("/billing/")) return true
  return false
}

/** Marketing-only paths; on chat they redirect to the apex. */
export function isMarketingOnlyPath(pathnameWithoutLocale: string): boolean {
  if (pathnameWithoutLocale === "/home") return true
  if (pathnameWithoutLocale.startsWith("/home/")) return true
  if (pathnameWithoutLocale === "/about") return true
  if (pathnameWithoutLocale.startsWith("/about/")) return true
  if (pathnameWithoutLocale === "/what-is-exur") return true
  if (pathnameWithoutLocale.startsWith("/what-is-exur/")) return true
  if (pathnameWithoutLocale === "/ai-trading-signals") return true
  if (pathnameWithoutLocale.startsWith("/ai-trading-signals/")) return true
  if (pathnameWithoutLocale === "/privacy") return true
  if (pathnameWithoutLocale.startsWith("/privacy/")) return true
  if (pathnameWithoutLocale === "/security") return true
  if (pathnameWithoutLocale.startsWith("/security/")) return true
  if (pathnameWithoutLocale === "/terms") return true
  if (pathnameWithoutLocale.startsWith("/terms/")) return true
  if (pathnameWithoutLocale === "/refund") return true
  if (pathnameWithoutLocale.startsWith("/refund/")) return true
  return false
}

/**
 * Desk entry query on `/` — landing chat handoff (`q`), plus legacy `tab` bookmarks.
 * Apex and chat.exur.ai both serve the desk, so these stay on the current host.
 */
export function isChatDeskSearch(search: string): boolean {
  const raw = search.startsWith("?") ? search.slice(1) : search
  if (!raw) return false
  const params = new URLSearchParams(raw)
  return params.has("tab") || params.has("q")
}
