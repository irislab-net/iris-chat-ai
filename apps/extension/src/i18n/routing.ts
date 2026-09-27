export const routing = {
  locales: ["en", "nl", "pt", "es", "ar", "fa", "ru", "tr"] as const,
  defaultLocale: "en" as const,
  localePrefix: "as-needed" as const,
}

export type AppLocale = (typeof routing.locales)[number]
