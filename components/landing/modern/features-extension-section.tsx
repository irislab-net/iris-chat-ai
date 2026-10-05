"use client"

import Image from "next/image"
import { useTranslations } from "next-intl"

import { FeaturesDemoStage } from "@/components/landing/modern/features-stage"
import { ScrollReveal } from "@/components/landing/modern/scroll-reveal"
import { SectionHeader, SphereCta } from "@/components/landing/modern/sphere-ui"
import { Button } from "@/components/ui/button"
import {
  landingAfterHeader,
  landingContentWide,
  landingCta,
  landingSection,
  landingSectionBody,
  landingTitleCard,
} from "@/lib/landing-modern-styles"
import {
  CHROME_WEB_STORE_URL,
  FEATURES_EXTENSION_SCREENSHOT,
} from "@/lib/site"
import { cn } from "@/lib/utils"

export function FeaturesExtensionSection() {
  const t = useTranslations("featuresPage.extension")
  const storeUrl = CHROME_WEB_STORE_URL

  return (
    <section
      id="extension"
      className={cn(
        landingSection,
        landingSectionBody,
        "scroll-mt-24 py-12 sm:scroll-mt-28 sm:py-20 lg:py-24"
      )}
      aria-labelledby="features-extension-heading"
    >
      <ScrollReveal>
        <SectionHeader
          title={
            <span id="features-extension-heading">{t("title")}</span>
          }
          subtitle={t("subtitle")}
        />
      </ScrollReveal>

      <ScrollReveal className={cn(landingContentWide, landingAfterHeader)}>
        <FeaturesDemoStage contentClassName="px-3 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
          <div className="grid items-center gap-6 sm:gap-8 lg:grid-cols-12 lg:gap-10">
            <div className="min-w-0 space-y-5 px-1.5 sm:px-3.5 lg:col-span-5">
              <h3 className={landingTitleCard}>{t("chromeLabel")}</h3>
              <ul className="list-none space-y-3 p-0">
                {(["0", "1", "2"] as const).map((key) => (
                  <li
                    key={key}
                    className="flex gap-3 text-[0.975rem] leading-relaxed text-foreground/80"
                  >
                    <span className="font-(family-name:--font-mono-modern) text-sm text-muted-foreground/55 tabular-nums">
                      0{Number(key) + 1}
                    </span>
                    <span>{t(`point${key}`)}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-1">
                {storeUrl ? (
                  <SphereCta href={storeUrl} variant="glass" size="sm">
                    {t("cta")}
                  </SphereCta>
                ) : (
                  <Button
                    type="button"
                    disabled
                    className={cn(
                      landingCta("light", "sm"),
                      "pointer-events-none opacity-70"
                    )}
                  >
                    {t("comingSoon")}
                  </Button>
                )}
              </div>
            </div>

            <div className="min-w-0 lg:col-span-7">
              <div
                className={cn(
                  "mx-auto max-w-md overflow-hidden rounded-[1.25rem] bg-white/90 shadow-[0_20px_56px_rgba(15,23,42,0.12)] dark:bg-white/12 lg:ms-auto lg:me-0 lg:max-w-lg",
                  "md:bg-white/55 md:backdrop-blur-2xl dark:md:bg-white/10"
                )}
              >
                <div className="flex items-center gap-1.5 border-b border-foreground/6 px-3.5 py-2.5">
                  <span className="size-2 rounded-full bg-foreground/15" />
                  <span className="size-2 rounded-full bg-foreground/15" />
                  <span className="size-2 rounded-full bg-foreground/15" />
                  <span className="ms-2 truncate font-(family-name:--font-mono-modern) text-[10px] tracking-[0.08em] text-muted-foreground uppercase">
                    {t("chromeLabel")}
                  </span>
                </div>
                <Image
                  src={FEATURES_EXTENSION_SCREENSHOT}
                  alt=""
                  width={720}
                  height={1280}
                  className="h-auto w-full object-cover object-top"
                  sizes="(max-width: 1024px) 90vw, 32rem"
                />
              </div>
            </div>
          </div>
        </FeaturesDemoStage>
      </ScrollReveal>
    </section>
  )
}
