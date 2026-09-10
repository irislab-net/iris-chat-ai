import type { AppLocale } from "@/i18n/routing"

/** Must match next-intl default (`routing/config.js`). */
export const LOCALE_COOKIE_NAME = "NEXT_LOCALE"

const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

/** Sync middleware locale detection before a hard navigation. */
export function persistLocaleChoice(locale: AppLocale) {
  document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`
}

export function localeDirection(locale: string): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr"
}

export function tradingViewLocale(locale: string): string {
  return locale === "ar" ? "ar" : "en"
}

export function speechLocale(locale: string): string {
  return locale === "ar" ? "ar-SA" : "en-US"
}

export function openGraphLocale(locale: AppLocale): string {
  return locale === "ar" ? "ar_SA" : "en_US"
}
