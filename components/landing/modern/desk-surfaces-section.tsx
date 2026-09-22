"use client"

import { useTranslations } from "next-intl"

import { ScrollReveal, ScrollRevealGroup } from "@/components/landing/modern/scroll-reveal"
import { SectionHeader } from "@/components/landing/modern/sphere-ui"
import { DESK_NEWS_META } from "@/lib/landing-modern-data"
import {
  landingAfterHeader,
  landingContent,
  landingGlassBubbleAi,
  landingGlassBubbleUser,
  landingGlassOrb,
  landingInner,
  landingSection,
  landingSectionBody,
} from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

export function DeskSurfacesSection() {
  const t = useTranslations("modern.desk")

  return (
    <section id="desk" className={cn(landingSection, landingSectionBody)}>
      <div className={landingInner}>
        <ScrollReveal>
          <SectionHeader title={t("title")} subtitle={t("subtitle")} />
        </ScrollReveal>

        <div className={cn(landingContent, landingAfterHeader)}>
          <ScrollRevealGroup stagger={0.1} className="flex flex-col gap-3.5">
            <div className="flex items-end justify-end gap-2.5">
              <div
                className={cn(
                  landingGlassBubbleUser,
                  "max-w-[min(100%,22rem)] px-4 py-3.5 text-left text-[13px] leading-relaxed text-foreground sm:text-sm"
                )}
              >
                {t("ask.question")}
              </div>
              <span
                className={cn(
                  landingGlassOrb,
                  "mb-0.5 size-8 shrink-0 text-[10px] font-medium text-muted-foreground"
                )}
              >
                {t("you")}
              </span>
            </div>

            <div className="flex items-end gap-2.5">
              <span
                className={cn(
                  landingGlassOrb,
                  "mb-0.5 size-8 shrink-0 text-[9px] font-semibold tracking-wide text-muted-foreground"
                )}
              >
                EX
              </span>
              <div
                className={cn(
                  landingGlassBubbleAi,
                  "max-w-[min(100%,24rem)] px-4 py-3.5 text-left text-[13px] leading-relaxed text-foreground/90 sm:text-sm"
                )}
              >
                {t("ask.answer")}
              </div>
            </div>
          </ScrollRevealGroup>

          <ScrollReveal className={landingAfterHeader}>
            <p className="mb-4 text-center font-[family-name:var(--font-mono-modern)] text-[9px] tracking-[0.2em] text-muted-foreground/60 uppercase">
              {t("onTheDesk")}
            </p>
            <ul className="flex flex-col gap-2.5">
              {DESK_NEWS_META.map((item) => (
                <li
                  key={item.id}
                  className="text-center text-[13px] leading-snug text-muted-foreground/65 sm:text-sm"
                >
                  <span className="text-foreground/55">
                    {t(`news.${item.id}.headline`)}
                  </span>
                  <span className="mt-1 block font-[family-name:var(--font-mono-modern)] text-[9px] tracking-[0.14em] text-muted-foreground/45 uppercase">
                    {t(`news.${item.id}.source`)} · {t(`news.${item.id}.time`)}
                  </span>
                </li>
              ))}
            </ul>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
