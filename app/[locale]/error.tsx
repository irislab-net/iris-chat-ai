"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"
import { useTranslations } from "next-intl"

import {
  StatusPage,
  statusLaunchAppAction,
} from "@/components/status/status-page"

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations("error")
  const common = useTranslations("common")

  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <StatusPage
      code={t("code")}
      title={t("title")}
      body={t("body")}
      primary={{
        label: t("retry"),
        onClick: reset,
        tone: "glass",
      }}
      secondary={statusLaunchAppAction(common("launchApp"))}
    />
  )
}
