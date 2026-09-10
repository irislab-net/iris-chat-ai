import { ArrowRightIcon } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { HeroDeskLazy } from "@/components/landing/hero-desk-lazy"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { LANDING_CONTAINER, LANDING_HERO_SHELL } from "@/lib/landing-layout"
import { APP_NEWS_PATH } from "@/lib/site"
import { cn } from "@/lib/utils"

export async function LandingHero() {
  const t = await getTranslations("landing.hero")
  const brand = await getTranslations("common")

  return (
    <section className="relative isolate w-full overflow-x-clip bg-background sm:overflow-visible">
      <div
        className={cn(
          "relative z-10 flex w-full flex-col items-center justify-center text-center min-h-0 lg:min-h-[calc(100svh-4rem)] xl:min-h-0",
          LANDING_CONTAINER,
          LANDING_HERO_SHELL
        )}
      >
        <p className="mb-5 text-sm font-semibold tracking-[0.28em] text-foreground uppercase md:text-base">
          {brand("brand")}
        </p>

        <h1 className="max-w-2xl text-3xl leading-[1.08] font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl xl:text-[2.75rem]">
          {t("title")}
        </h1>

        <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base md:mt-6">
          {t("subtitle")}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 md:mt-10">
          <Button
            size="lg"
            className="h-11 rounded-2xl px-5"
            nativeButton={false}
            render={<Link href={APP_NEWS_PATH} />}
          >
            {brand("launchApp")}
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-11 rounded-2xl px-5"
            nativeButton={false}
            render={<Link href="#features" />}
          >
            {t("seeInside")}
          </Button>
        </div>

        <HeroDeskLazy />
      </div>
    </section>
  )
}
