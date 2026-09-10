import { GlobeIcon, PuzzleIcon, SmartphoneIcon, TabletSmartphoneIcon } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { ScrollReveal } from "@/components/landing/scroll-reveal"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Link } from "@/i18n/navigation"
import {
  LANDING_CONTAINER_NARROW,
  LANDING_SECTION_CONTENT_MT,
  LANDING_SECTION_PY_COMPACT,
  LANDING_SECTION_TITLE,
} from "@/lib/landing-layout"
import { APP_NEWS_PATH } from "@/lib/site"
import { cn } from "@/lib/utils"

const SURFACES = [
  { id: "web", ready: true, icon: GlobeIcon },
  { id: "extension", ready: false, icon: PuzzleIcon },
  { id: "android", ready: false, icon: SmartphoneIcon },
  { id: "ios", ready: false, icon: TabletSmartphoneIcon },
] as const

export async function LandingComingSoon() {
  const t = await getTranslations("landing.comingSoon")
  const common = await getTranslations("common")

  return (
    <section
      id="coming-soon"
      aria-labelledby="landing-coming-soon-heading"
      className={cn("bg-background", LANDING_SECTION_PY_COMPACT)}
    >
      <ScrollReveal className={LANDING_CONTAINER_NARROW}>
        <div data-reveal className="mx-auto max-w-xl text-center">
          <p className="mb-2 text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            {t("eyebrow")}
          </p>
          <h2 id="landing-coming-soon-heading" className={LANDING_SECTION_TITLE}>
            {t("title")}
          </h2>
        </div>

        <div className={cn("grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4", LANDING_SECTION_CONTENT_MT)}>
          {SURFACES.map((surface) => {
            const Icon = surface.icon

            return (
              <Card
                key={surface.id}
                data-reveal
                size="sm"
                className="border-0 bg-transparent shadow-none ring-0"
              >
                <CardContent className="flex flex-col items-center px-2 py-4 text-center">
                  <Icon className="size-9 text-foreground" strokeWidth={1.25} />
                  <h3 className="mt-3 text-sm font-medium md:text-base">
                    {t(surface.id)}
                  </h3>
                  <div className="mt-3 flex h-7 items-center">
                    {surface.ready ? (
                      <Badge
                        variant="default"
                        className="h-6 min-w-28 rounded-full px-3"
                        render={<Link href={APP_NEWS_PATH} />}
                      >
                        {common("ready")}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="h-6 min-w-28 rounded-full px-3">
                        {common("comingSoon")}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </ScrollReveal>
    </section>
  )
}
