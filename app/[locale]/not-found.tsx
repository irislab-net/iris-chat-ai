import { getLocale, getTranslations } from "next-intl/server"
import type { Metadata } from "next"

import { StatusPage } from "@/components/status/status-page"
import {
  statusHomeAction,
  statusLaunchAppAction,
} from "@/components/status/status-page-actions"
import { routing } from "@/i18n/routing"

export const metadata: Metadata = {
  robots: { index: false, follow: true },
}

export default async function LocaleNotFound() {
  let locale = routing.defaultLocale
  try {
    locale = await getLocale()
  } catch {
    // Invalid locale segments may reach not-found before request locale is set.
  }
  const t = await getTranslations({ locale, namespace: "notFound" })
  const common = await getTranslations({ locale, namespace: "common" })

  return (
    <StatusPage
      code={t("code")}
      title={t("title")}
      body={t("body")}
      primary={statusHomeAction(t("home"))}
      secondary={statusLaunchAppAction(common("launchApp"))}
    />
  )
}
