"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"
import { useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import { APP_NEWS_PATH } from "@/lib/site"

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
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <p className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">
        Error
      </p>
      <div className="flex max-w-md flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {t("title")}
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground">{t("body")}</p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button size="lg" className="rounded-2xl border-0 px-6" onClick={reset}>
          {t("retry")}
        </Button>
        <Button
          nativeButton={false}
          render={<Link href={APP_NEWS_PATH} />}
          size="lg"
          variant="outline"
          className="rounded-2xl px-6"
        >
          {common("launchApp")}
        </Button>
      </div>
    </main>
  )
}
