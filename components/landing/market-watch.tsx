import { BellRingIcon, RadarIcon, ScanEyeIcon, SparklesIcon } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { MarketWatchScene } from "@/components/landing/market-watch-scene"
import { ScrollReveal } from "@/components/landing/scroll-reveal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import {
  LANDING_CONTAINER,
  LANDING_SECTION_PY,
  LANDING_SECTION_TITLE,
} from "@/lib/landing-layout"
import { APP_NEWS_PATH } from "@/lib/site"
import { cn } from "@/lib/utils"

const PILLAR_ICONS = [ScanEyeIcon, SparklesIcon, BellRingIcon] as const
const PILLAR_KEYS = ["watching", "filter", "alert"] as const

export async function LandingMarketWatch() {
  const t = await getTranslations("landing.watch")

  return (
    <section
      id="watch"
      aria-labelledby="landing-watch-heading"
      className={cn("bg-background", LANDING_SECTION_PY)}
    >
      <ScrollReveal className={LANDING_CONTAINER}>
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:gap-16">
          <div data-reveal className="max-w-xl text-center lg:text-left">
            <Badge variant="outline" className="rounded-full px-3">
              {t("badge")}
            </Badge>

            <h2
              id="landing-watch-heading"
              className={cn("mt-3 text-pretty leading-[1.15]", LANDING_SECTION_TITLE)}
            >
              {t("title")}{" "}
              <span className="text-muted-foreground">{t("titleMuted")}</span>
            </h2>

            <ul className="mt-6 space-y-2.5 text-start text-sm text-muted-foreground">
              {PILLAR_KEYS.map((key, index) => {
                const Icon = PILLAR_ICONS[index]
                const title = t(`pillars.${key}Title`)
                return (
                  <li key={key} className="flex gap-2.5">
                    <Icon
                      className="mt-0.5 size-4 shrink-0 text-foreground/80"
                      strokeWidth={1.75}
                    />
                    <span>
                      <span className="font-medium text-foreground">{title}.</span>{" "}
                      {t(`pillars.${key}Body`)}
                    </span>
                  </li>
                )
              })}
            </ul>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Button
                className="rounded-xl"
                nativeButton={false}
                render={<Link href={APP_NEWS_PATH} />}
              >
                <RadarIcon className="size-4" aria-hidden />
                {t("cta")}
              </Button>
              <p className="text-xs text-muted-foreground">{t("ctaHint")}</p>
            </div>
          </div>

          <MarketWatchScene />
        </div>
      </ScrollReveal>
    </section>
  )
}
