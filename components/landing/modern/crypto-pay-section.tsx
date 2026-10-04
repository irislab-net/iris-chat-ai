"use client"

import { CheckIcon } from "lucide-react"
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
  landingTitleCard,
  landingTitleSection,
} from "@/lib/landing-modern-styles"
import { UPGRADE_PATH } from "@/lib/site"
import { cn } from "@/lib/utils"

const PERKS = ["stable", "wallet", "auto"] as const

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
              "relative z-10 grid items-center gap-8 py-10 sm:gap-10 sm:py-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-12 lg:py-14"
            )}
          >
            <div className="text-center sm:text-start">
              <h2
                id="crypto-pay-heading"
                className={landingTitleSection}
              >
                {t("title")}
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">
                {t("subtitle")}
              </p>

              <ul className="mt-8 m-0 flex list-none flex-col items-center gap-3.5 p-0 text-center sm:items-start sm:text-start">
                {PERKS.map((key) => (
                  <li key={key} className="flex items-start justify-center gap-3 sm:justify-start">
                    <span
                      className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#2563EB]/12 text-[#1D4ED8] dark:bg-[#2563EB]/22 dark:text-[#93C5FD]"
                      aria-hidden
                    >
                      <CheckIcon className="size-3" strokeWidth={2.5} />
                    </span>
                    <span className="text-[0.9375rem] leading-relaxed text-foreground/85">
                      {t(`perks.${key}`)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col items-center text-center lg:items-end lg:text-end">
              <div className="flex items-center" aria-hidden>
                <ShimmerToken currency="USDT" className="relative z-10 scale-125" />
                <ShimmerToken
                  currency="USDC"
                  className="relative z-0 -ms-4 scale-125"
                />
              </div>
              <p className={cn(landingTitleCard, "mt-6 text-xl")}>
                {t("cardTitle")}
              </p>
              <p className="mt-2 max-w-72 text-sm leading-relaxed text-muted-foreground">
                {t("cardBody")}
              </p>
              <p className="mt-3 font-(family-name:--font-mono-modern) text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
                {t("network")}
              </p>
              <div className="mt-6 flex w-full max-w-xs flex-col items-stretch gap-2">
                <SphereCta href={href} variant="glass" className="w-full">
                  {t("cta")}
                </SphereCta>
                <p className="text-center text-xs text-muted-foreground">
                  {t("note")}
                </p>
              </div>
            </div>
          </div>
        </article>
      </ScrollReveal>
    </section>
  )
}
