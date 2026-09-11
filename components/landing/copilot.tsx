import {
  ArrowRightIcon,
  CrosshairIcon,
  LayersIcon,
  MonitorDotIcon,
} from "lucide-react"
import { getTranslations } from "next-intl/server"

import { CopilotScene } from "@/components/landing/copilot-scene"
import { ScrollReveal } from "@/components/landing/scroll-reveal"
import { Badge } from "@/components/ui/badge"
import { LANDING_CONTAINER, LANDING_SECTION_PY, LANDING_SECTION_TITLE } from "@/lib/landing-layout"
import { cn } from "@/lib/utils"

const PILLAR_ICONS = [LayersIcon, CrosshairIcon, MonitorDotIcon] as const
const PILLAR_KEYS = ["context", "ask", "focused"] as const
const SIGNAL_KEYS = ["headlines", "context", "market", "analysis"] as const

export async function LandingCopilot() {
  const t = await getTranslations("landing.copilot")

  return (
    <section
      id="copilot"
      aria-labelledby="landing-copilot-heading"
      className={cn("bg-background", LANDING_SECTION_PY)}
    >
      <ScrollReveal className={LANDING_CONTAINER}>
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:gap-16">
          <div data-reveal className="max-w-xl text-center lg:text-left">
            <Badge variant="outline" className="rounded-full px-3">
              {t("badge")}
            </Badge>

            <h2
              id="landing-copilot-heading"
              className={cn("mt-3 text-pretty leading-[1.15]", LANDING_SECTION_TITLE)}
            >
              {t("titleNot")}{" "}
              <span className="text-muted-foreground/75 line-through decoration-muted-foreground/35">
                {t("titleStrike")}
              </span>
              .{" "}
              <span className="text-muted-foreground">{t("titleRest")}</span>
            </h2>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5 lg:justify-start">
              {SIGNAL_KEYS.map((signal) => (
                <Badge
                  key={signal}
                  variant="secondary"
                  className="rounded-full px-2.5 py-0.5 text-[11px] font-normal"
                >
                  {t(`signals.${signal}`)}
                </Badge>
              ))}
              <ArrowRightIcon
                aria-hidden
                className="mx-0.5 size-3.5 shrink-0 text-muted-foreground rtl:rotate-180"
              />
              <Badge className="rounded-full px-2.5 py-0.5 text-[11px] font-medium">
                {t("signals.answer")}
              </Badge>
            </div>

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
          </div>

          <CopilotScene />
        </div>
      </ScrollReveal>
    </section>
  )
}
