import { hasLocale } from "next-intl"
import { getRequestConfig } from "next-intl/server"

import { deepMergeMessages } from "@/lib/i18n/merge-messages"

import { routing } from "./routing"

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale

  if (!locale || !hasLocale(routing.locales, locale)) {
    locale = routing.defaultLocale
  }

  const enMessages = (await import("../messages/en.json")).default as Record<
    string,
    unknown
  >

  if (locale === "en") {
    return { locale, messages: enMessages }
  }

  const localeMessages = (
    await import(`../messages/${locale}.json`)
  ).default as Record<string, unknown>

  return {
    locale,
    messages: deepMergeMessages(enMessages, localeMessages),
  }
})
