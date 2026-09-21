import { getTranslations } from "next-intl/server"
import type { Metadata } from "next"

import {
  StatusPage,
  statusHomeAction,
  statusLaunchAppAction,
} from "@/components/status/status-page"

export const metadata: Metadata = {
  robots: { index: false, follow: true },
}

export default async function NotFound() {
  const t = await getTranslations("notFound")
  const common = await getTranslations("common")

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
