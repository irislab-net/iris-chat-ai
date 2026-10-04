import { defineRouting } from "next-intl/routing"

/**
 * Supported UI locales.
 * `as-needed` omits the default (`en`) prefix from URLs.
 *
 * Locale negotiation (first visit without a prefix / cookie):
 * browser `Accept-Language` → matching locale below, else `en`.
 * Manual switcher writes `NEXT_LOCALE` and takes priority afterward.
 */
export const routing = defineRouting({
  locales: ["en", "nl", "pt", "es", "ar", "fa", "ru", "tr"],
  defaultLocale: "en",
  localePrefix: "as-needed",
  localeDetection: true,
})

export type AppLocale = (typeof routing.locales)[number]
