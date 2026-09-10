import { getTranslations } from "next-intl/server"

import { Link } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import { APP_NEWS_PATH } from "@/lib/site"

export default async function LocaleNotFound() {
  const t = await getTranslations("notFound")
  const common = await getTranslations("common")

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <p className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">
        404
      </p>
      <div className="flex max-w-md flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {t("title")}
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground">{t("body")}</p>
      </div>
      <Button
        nativeButton={false}
        render={<Link href={APP_NEWS_PATH} />}
        size="lg"
        className="rounded-2xl border-0 px-6"
      >
        {common("launchApp")}
      </Button>
    </main>
  )
}
