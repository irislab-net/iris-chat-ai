import { defineRouting } from "next-intl/routing"

/**
 * Supported UI locales.
 * `as-needed` omits the default (`en`) prefix from URLs.
 */
export const routing = defineRouting({
  locales: ["en", "nl", "pt", "es", "ar", "ru", "tr"],
  defaultLocale: "en",
  localePrefix: "as-needed",
})

export type AppLocale = (typeof routing.locales)[number]
