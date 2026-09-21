import type { AppLocale } from "@/i18n/routing"

/** Must match next-intl default (`routing/config.js`). */
export const LOCALE_COOKIE_NAME = "NEXT_LOCALE"

const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

const LOCALE_LABEL_KEYS = {
  en: "english",
  nl: "dutch",
  pt: "portuguese",
  es: "spanish",
  ar: "arabic",
  ru: "russian",
  tr: "turkish",
} as const satisfies Record<AppLocale, string>

const SPEECH_LOCALES: Record<AppLocale, string> = {
  en: "en-US",
  nl: "nl-NL",
  pt: "pt-BR",
  es: "es-ES",
  ar: "ar-SA",
  ru: "ru-RU",
  tr: "tr-TR",
}

const OPEN_GRAPH_LOCALES: Record<AppLocale, string> = {
  en: "en_US",
  nl: "nl_NL",
  pt: "pt_BR",
  es: "es_ES",
  ar: "ar_SA",
  ru: "ru_RU",
  tr: "tr_TR",
}

/** Sync middleware locale detection before a hard navigation. */
export function persistLocaleChoice(locale: AppLocale) {
  document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`
}

export function localeDirection(locale: string): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr"
}

export function speechLocale(locale: string): string {
  if (locale in SPEECH_LOCALES) {
    return SPEECH_LOCALES[locale as AppLocale]
  }
  return SPEECH_LOCALES.en
}

export function openGraphLocale(locale: AppLocale): string {
  return OPEN_GRAPH_LOCALES[locale] ?? OPEN_GRAPH_LOCALES.en
}

export function localeLabelKey(locale: AppLocale): string {
  return LOCALE_LABEL_KEYS[locale] ?? LOCALE_LABEL_KEYS.en
}
