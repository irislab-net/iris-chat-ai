import type { AppLocale } from "@/i18n/routing"
import { routing } from "@/i18n/routing"

/** Must match next-intl default (`routing/config.js`). */
export const LOCALE_COOKIE_NAME = "NEXT_LOCALE"
/** Extension-only durable locale (MV3 has no reliable cross-reload cookies). */
export const LOCALE_STORAGE_KEY = "exur_ext_locale"

const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

const LOCALE_LABEL_KEYS = {
  en: "english",
  nl: "dutch",
  pt: "portuguese",
  es: "spanish",
  ar: "arabic",
  fa: "persian",
  ru: "russian",
  tr: "turkish",
} as const satisfies Record<AppLocale, string>

const SPEECH_LOCALES: Record<AppLocale, string> = {
  en: "en-US",
  nl: "nl-NL",
  pt: "pt-BR",
  es: "es-ES",
  ar: "ar-SA",
  fa: "fa-IR",
  ru: "ru-RU",
  tr: "tr-TR",
}

/** ISO 3166-1 alpha-2 used for locale flag icons (`country-flag-icons`). */
export const LOCALE_FLAG_CODES = {
  en: "US",
  nl: "NL",
  pt: "BR",
  es: "ES",
  ar: "SA",
  fa: "IR",
  ru: "RU",
  tr: "TR",
} as const satisfies Record<AppLocale, string>

export type LocaleFlagCode = (typeof LOCALE_FLAG_CODES)[AppLocale]

export function localeFlagCode(locale: AppLocale): LocaleFlagCode {
  return LOCALE_FLAG_CODES[locale] ?? LOCALE_FLAG_CODES.en
}

const OPEN_GRAPH_LOCALES: Record<AppLocale, string> = {
  en: "en_US",
  nl: "nl_NL",
  pt: "pt_BR",
  es: "es_ES",
  ar: "ar_SA",
  fa: "fa_IR",
  ru: "ru_RU",
  tr: "tr_TR",
}

const RTL_LOCALES = new Set<string>(["ar", "fa"])

export function isAppLocale(value: unknown): value is AppLocale {
  return (
    typeof value === "string" &&
    (routing.locales as readonly string[]).includes(value)
  )
}

export async function readStoredLocale(): Promise<AppLocale> {
  try {
    const data = await chrome.storage.local.get(LOCALE_STORAGE_KEY)
    const value = data[LOCALE_STORAGE_KEY]
    if (isAppLocale(value)) return value
  } catch {
    // ignore
  }
  return routing.defaultLocale
}

/** Persist locale for the next side-panel / login load. */
export function persistLocaleChoice(locale: AppLocale) {
  const secure =
    typeof location !== "undefined" && location.protocol === "https:"
      ? "; Secure"
      : ""
  document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax${secure}`
  try {
    void chrome.storage.local.set({ [LOCALE_STORAGE_KEY]: locale })
  } catch {
    // ignore
  }
}

/** Apply `lang` / `dir` on the document for the active locale. */
export function applyLocaleToDocument(locale: AppLocale) {
  document.documentElement.lang = locale
  document.documentElement.dir = localeDirection(locale)
}

export function localeDirection(locale: string): "ltr" | "rtl" {
  return RTL_LOCALES.has(locale) ? "rtl" : "ltr"
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
