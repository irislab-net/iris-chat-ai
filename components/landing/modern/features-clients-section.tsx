"use client"

import { useTranslations } from "next-intl"

import { ChatNoTradeCard } from "@/components/app-shell/chat-no-trade-card"
import { DeskNewsBoardPreview } from "@/components/landing/modern/desk-news-board"
import {
  FeaturesDemoStage,
  FeaturesGlassSheen,
} from "@/components/landing/modern/features-stage"
import { ScrollReveal } from "@/components/landing/modern/scroll-reveal"
import { SectionHeader } from "@/components/landing/modern/sphere-ui"
import { FEATURES_QUALITY_WAIT_REASON } from "@/lib/features-showcase-fixtures"
import {
  landingAfterHeader,
  landingContentWide,
  landingGlassPill,
  landingSection,
  landingSectionBody,
} from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

export function FeaturesClientsSection() {
  const t = useTranslations("featuresPage.clients")

  return (
    <section
      id="clients"
      className={cn(
        landingSection,
        landingSectionBody,
        "scroll-mt-24 py-12 sm:scroll-mt-28 sm:py-20 lg:py-24"
      )}
      aria-labelledby="features-clients-heading"
    >
      <ScrollReveal>
        <SectionHeader
          title={
            <span id="features-clients-heading">{t("title")}</span>
          }
          subtitle={t("subtitle")}
        />
      </ScrollReveal>

      <ScrollReveal
        className={cn(
          landingContentWide,
          landingAfterHeader,
          "grid items-start gap-5 lg:grid-cols-12 lg:gap-6"
        )}
      >
        <div className="min-w-0 lg:col-span-7">
          <p className="mb-3 px-1.5 text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase sm:px-3.5">
            {t("desktopLabel")}
          </p>
          <FeaturesDemoStage contentClassName="px-2.5 py-3.5 sm:px-5 sm:py-5">
            <div className="mb-3 flex items-center gap-1.5 px-1.5 sm:px-3.5">
              <span className="size-2 rounded-full bg-foreground/12" />
              <span className="size-2 rounded-full bg-foreground/12" />
              <span className="size-2 rounded-full bg-foreground/12" />
            </div>
            <DeskNewsBoardPreview
              stageWash
              className="pointer-events-none bg-white/40 dark:bg-white/6"
            />
          </FeaturesDemoStage>
        </div>

        <div className="mx-auto w-full max-w-80 min-w-0 lg:col-span-5 lg:mx-0 lg:max-w-none">
          <p className="mb-3 px-1.5 text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase sm:px-3.5">
            {t("mobileLabel")}
          </p>
          <FeaturesDemoStage
            contentClassName="px-2.5 py-3.5 sm:px-3.5 sm:py-4"
            className="rounded-[1.75rem] sm:rounded-[2rem]"
          >
            <div className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-foreground/10" />
            <ChatNoTradeCard
              reason={FEATURES_QUALITY_WAIT_REASON}
              className="mt-0 pointer-events-none"
            />
            <div
              className={cn(
                landingGlassPill,
                "relative mt-4 flex items-center gap-2 px-3.5 py-3"
              )}
            >
              <FeaturesGlassSheen className="rounded-full" />
              <span className="relative z-10 flex-1 truncate text-start text-xs text-muted-foreground/70">
                {t("composerPlaceholder")}
              </span>
              <span
                aria-hidden
                className="relative z-10 size-7 shrink-0 rounded-full bg-foreground/90"
              />
            </div>
          </FeaturesDemoStage>
        </div>
      </ScrollReveal>
    </section>
  )
}
