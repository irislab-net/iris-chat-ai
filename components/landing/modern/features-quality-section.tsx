"use client"

import { useTranslations } from "next-intl"

import { ChatNoTradeCard } from "@/components/app-shell/chat-no-trade-card"
import { ChatThinkingTrace } from "@/components/app-shell/chat-thinking-trace"
import { FeaturesDemoStage } from "@/components/landing/modern/features-stage"
import { ScrollReveal } from "@/components/landing/modern/scroll-reveal"
import { SectionHeader } from "@/components/landing/modern/sphere-ui"
import {
  FEATURES_QUALITY_THINKING_DURATION_SEC,
  FEATURES_QUALITY_THINKING_STEPS,
  FEATURES_QUALITY_WAIT_REASON,
} from "@/lib/features-showcase-fixtures"
import {
  landingAfterHeader,
  landingContentWide,
  landingSection,
  landingSectionBody,
} from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

export function FeaturesQualitySection() {
  const t = useTranslations("featuresPage.quality")

  return (
    <section
      id="quality"
      className={cn(landingSection, landingSectionBody, "scroll-mt-28")}
      aria-labelledby="features-quality-heading"
    >
      <ScrollReveal>
        <SectionHeader
          title={
            <span id="features-quality-heading">{t("title")}</span>
          }
          subtitle={t("subtitle")}
        />
      </ScrollReveal>

      <ScrollReveal className={cn(landingContentWide, landingAfterHeader)}>
        <FeaturesDemoStage contentClassName="mx-auto w-full max-w-2xl lg:max-w-3xl">
          <div className="space-y-5">
            <div className="space-y-2 px-3.5">
              <p className="text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
                {t("traceLabel")}
              </p>
              <ChatThinkingTrace
                steps={FEATURES_QUALITY_THINKING_STEPS}
                durationSec={FEATURES_QUALITY_THINKING_DURATION_SEC}
                defaultOpen
                className="mt-0"
              />
            </div>
            <div className="space-y-2 px-3.5">
              <p className="text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
                {t("outcomeLabel")}
              </p>
              <ChatNoTradeCard
                reason={FEATURES_QUALITY_WAIT_REASON}
                className="mt-0"
              />
            </div>
          </div>
        </FeaturesDemoStage>
      </ScrollReveal>
    </section>
  )
}
