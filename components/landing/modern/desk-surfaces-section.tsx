"use client"

import { useTranslations } from "next-intl"

import {
  ScrollReveal,
  ScrollRevealGroup,
} from "@/components/landing/modern/scroll-reveal"
import { SectionHeader } from "@/components/landing/modern/sphere-ui"
import { DESK_NEWS_META } from "@/lib/landing-modern-data"
import {
  landingAfterHeader,
  landingContentWide,
  landingGlassSheen,
  landingGlassSurface,
  landingSection,
  landingSectionBody,
  landingTitleCard,
} from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

const LEAD = DESK_NEWS_META[0]
const REST = DESK_NEWS_META.slice(1)

function ImpactScore({
  score,
  label,
  featured,
}: {
  score: number
  label: string
  featured?: boolean
}) {
  return (
    <div className="shrink-0 text-end">
      <p
        className={cn(
          "font-(family-name:--font-mono-modern) tabular-nums leading-none tracking-tight text-foreground",
          featured
            ? "text-2xl font-normal sm:text-[1.75rem]"
            : "text-base font-normal text-foreground/80 sm:text-lg"
        )}
      >
        {score}
      </p>
      <p className="mt-1.5 font-(family-name:--font-mono-modern) text-[9px] tracking-[0.18em] text-muted-foreground uppercase">
        {label}
      </p>
    </div>
  )
}

export function DeskSurfacesSection() {
  const t = useTranslations("modern.desk")

  return (
    <section id="desk" className={cn(landingSection, landingSectionBody)}>
      <ScrollReveal>
        <SectionHeader title={t("title")} subtitle={t("subtitle")} />
      </ScrollReveal>

      <ScrollRevealGroup
        stagger={0.08}
        className={cn(landingContentWide, landingAfterHeader)}
      >
        <article
          className={cn(
            landingGlassSurface,
            "relative overflow-hidden rounded-[1.75rem] bg-white/42 dark:bg-white/8"
          )}
        >
          <span
            aria-hidden
            className={cn(
              landingGlassSheen,
              "pointer-events-none absolute inset-0 rounded-[1.75rem]"
            )}
          />

          <ul className="relative z-10 m-0 list-none divide-y divide-foreground/6 p-0 dark:divide-white/8">
            <li className="flex items-start gap-4 px-5 py-5 sm:gap-5 sm:px-7 sm:py-6">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="rounded-full bg-white/75 px-2.5 py-1 font-(family-name:--font-mono-modern) text-[9px] font-medium tracking-[0.18em] text-muted-foreground uppercase shadow-[0_4px_12px_rgba(15,23,42,0.04)] dark:bg-white/10 dark:shadow-none">
                    {t("lead")}
                  </span>
                  <span className="font-(family-name:--font-mono-modern) text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                    {t(`news.${LEAD.id}.source`)} · {t(`news.${LEAD.id}.time`)}
                  </span>
                </div>
                <h3 className={cn(landingTitleCard, "mt-3 text-left sm:text-xl")}>
                  {t(`news.${LEAD.id}.headline`)}
                </h3>
              </div>
              <ImpactScore
                score={LEAD.impact}
                label={t("impactLabel")}
                featured
              />
            </li>

            {REST.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-4 px-5 py-4 sm:gap-5 sm:px-7 sm:py-4.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-(family-name:--font-mono-modern) text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                    {t(`news.${item.id}.source`)} · {t(`news.${item.id}.time`)}
                  </p>
                  <h3 className="mt-1.5 text-left text-sm font-normal leading-snug tracking-[-0.01em] text-foreground/80 sm:text-[0.9375rem]">
                    {t(`news.${item.id}.headline`)}
                  </h3>
                </div>
                <ImpactScore score={item.impact} label={t("impactLabel")} />
              </li>
            ))}
          </ul>
        </article>
      </ScrollRevealGroup>
    </section>
  )
}
