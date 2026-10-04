"use client"

import { useTranslations } from "next-intl"

import { PaymentTokenLogo } from "@/components/billing/payment-token-logo"
import { HeroLiquidGlassBg } from "@/components/landing/modern/hero-liquid-glass-bg"
import { ScrollReveal } from "@/components/landing/modern/scroll-reveal"
import { SphereCta } from "@/components/landing/modern/sphere-ui"
import { CHAT_APP_ORIGIN } from "@/lib/hosts"
import {
  landingGlassSheen,
  landingGlassSurface,
  landingInner,
  landingSection,
  landingTitleSection,
} from "@/lib/landing-modern-styles"
import { UPGRADE_PATH } from "@/lib/site"
import { cn } from "@/lib/utils"

function upgradeHref() {
  if (process.env.NODE_ENV === "development") return UPGRADE_PATH
  return `${CHAT_APP_ORIGIN}${UPGRADE_PATH}`
}

function ShimmerToken({
  currency,
  className,
}: {
  currency: "USDT" | "USDC"
  className?: string
}) {
  return (
    <span
      className={cn(
        "relative isolate inline-flex shrink-0 overflow-hidden rounded-full",
        className
      )}
    >
      <PaymentTokenLogo
        currency={currency}
        size="lg"
        className="ring-2 ring-white/80 dark:ring-white/20"
      />
      <span className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-[inherit]">
        <span
          className={cn(
            "absolute inset-y-[-12%] left-0 w-[62%]",
            "bg-linear-to-r from-transparent via-white/55 to-transparent",
            "animate-exur-logo-shimmer will-change-transform",
            "dark:via-white/70"
          )}
        />
      </span>
    </span>
  )
}

export function CryptoPaySection() {
  const t = useTranslations("modern.cryptoPay")
  const href = upgradeHref()

  return (
    <section
      id="pay"
      className={cn(landingSection, "scroll-mt-28")}
      aria-labelledby="crypto-pay-heading"
    >
      <ScrollReveal>
        <article
          className={cn(
            landingGlassSurface,
            "relative overflow-hidden rounded-[2rem] sm:rounded-[2.5rem]"
          )}
        >
          <HeroLiquidGlassBg tone="blue" />
          <span
            aria-hidden
            className={cn(
              landingGlassSheen,
              "pointer-events-none absolute inset-0 rounded-[2rem] sm:rounded-[2.5rem]"
            )}
          />

          <div
            className={cn(
              landingInner,
              "relative z-10 flex flex-col items-center gap-8 py-10 text-center sm:gap-9 sm:py-12 lg:flex-row lg:items-center lg:justify-between lg:gap-12 lg:py-14 lg:text-start"
            )}
          >
            <div className="max-w-xl">
              <div
                className="mb-5 flex items-center justify-center lg:justify-start"
                aria-hidden
              >
                <ShimmerToken currency="USDT" className="relative z-10" />
                <ShimmerToken
                  currency="USDC"
                  className="relative z-0 -ms-2.5"
                />
              </div>
              <h2 id="crypto-pay-heading" className={landingTitleSection}>
                {t("title")}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">
                {t("subtitle")}
              </p>
              <p className="mt-3 font-(family-name:--font-mono-modern) text-[11px] tracking-[0.14em] text-muted-foreground/70 uppercase">
                {t("network")}
              </p>
            </div>

            <div className="flex w-full max-w-xs flex-col items-stretch gap-2.5 lg:shrink-0">
              <SphereCta href={href} variant="glass" className="w-full">
                {t("cta")}
              </SphereCta>
              <p className="text-center text-xs text-muted-foreground">
                {t("note")}
              </p>
            </div>
          </div>
        </article>
      </ScrollReveal>
    </section>
  )
}
