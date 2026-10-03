"use client"

import { ArrowUpIcon, PlusIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import type { ComponentType } from "react"

import { ChatSignalCard } from "@/components/app-shell/chat-signal-card"
import { PaymentTokenLogo } from "@/components/billing/payment-token-logo"
import { AnimatedSvgIcon } from "@/components/landing/modern/animated-svg-icon"
import {
  FEATURES_ADVANTAGE_MARKS,
  FEATURES_COMPOSER_MARKS,
  FEATURES_DESK_MARKS,
} from "@/components/landing/modern/features-marks"
import { HeroLiquidGlassBg } from "@/components/landing/modern/hero-liquid-glass-bg"
import {
  ScrollReveal,
  ScrollRevealGroup,
} from "@/components/landing/modern/scroll-reveal"
import { SectionHeader, SphereCta } from "@/components/landing/modern/sphere-ui"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import {
  FEATURES_ADVANTAGE_KEYS,
  FEATURES_COMPOSER_KEYS,
  FEATURES_DESK_KEYS,
  type FeaturesDeskKey,
} from "@/lib/features-overview-data"
import { SIGNAL_WAIT_TICKET } from "@/lib/landing-modern-data"
import {
  landingAfterHeader,
  landingContentWide,
  landingCta,
  landingDisplay,
  landingGlassBubbleUser,
  landingGlassOrb,
  landingGlassPill,
  landingGlassSheen,
  landingGlassSurface,
  landingHeroGlass,
  landingInner,
  landingSection,
  landingSectionBody,
  landingTitleBrand,
  landingTitleCard,
  landingTitleCardLg,
  landingTitleSection,
} from "@/lib/landing-modern-styles"
import { APP_NEWS_PATH, getLaunchAppHref, SITE_NAME, UPGRADE_PATH } from "@/lib/site"
import { cn } from "@/lib/utils"

const JUMP_LINKS = [
  { href: "#desk", key: "desk" },
  { href: "#composer", key: "composer" },
  { href: "#advantages", key: "advantages" },
  { href: "#boundaries", key: "boundaries" },
] as const

const DEMO_TICKET = {
  ...SIGNAL_WAIT_TICKET,
  setup: "Long ETH into spot strength",
  thesis: "Spot leads while funding stays soft.",
  timeHorizon: "4-12h",
  entryReason: "Above prior VWAP",
  stopLossReason: "Under prior low",
  takeProfitReason: "Into supply",
}

function GlassSheen({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        landingGlassSheen,
        "pointer-events-none absolute inset-0",
        className
      )}
    />
  )
}

function FeatureDrawMark({
  Mark,
  className,
  sizeClass = "size-14 sm:size-16",
}: {
  Mark: ComponentType
  className?: string
  sizeClass?: string
}) {
  return (
    <AnimatedSvgIcon
      scrollTrigger
      replayOnHover
      className={cn(
        "relative z-10 shrink-0 text-foreground/70",
        sizeClass,
        className
      )}
    >
      <Mark />
    </AnimatedSvgIcon>
  )
}

function JumpNav({ labelFor }: { labelFor: (key: string) => string }) {
  return (
    <nav aria-label={labelFor("aria")} className="flex flex-wrap gap-2">
      {JUMP_LINKS.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className={cn(
            landingGlassPill,
            "px-3.5 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          )}
        >
          {labelFor(link.key)}
        </a>
      ))}
    </nav>
  )
}

/** Static desk mock — bubble, signal card, composer. No nested outer card. */
function SignalComposerMock({
  prompt,
  userMessage,
  youLabel,
}: {
  prompt: string
  userMessage: string
  youLabel: string
}) {
  return (
    <div className="mt-6 flex flex-col gap-3" aria-hidden>
      <div className="flex items-end justify-end gap-2.5">
        <div
          className={cn(
            landingGlassBubbleUser,
            "max-w-[min(100%,18rem)] px-3.5 py-2.5 text-start text-[13px] leading-snug text-foreground"
          )}
        >
          {userMessage}
        </div>
        <span
          className={cn(
            landingGlassOrb,
            "mb-0.5 size-8 shrink-0 text-[10px] font-medium text-muted-foreground"
          )}
        >
          {youLabel}
        </span>
      </div>

      <div
        className={cn(
          "pointer-events-none select-none",
          "[&_article]:rounded-[1.25rem] [&_article]:bg-white/72 [&_article]:shadow-none dark:[&_article]:bg-white/8",
          "[&_article_header_h3]:text-[1.15rem] sm:[&_article_header_h3]:text-[1.35rem]",
          "[&_.grid.grid-cols-3_p.tabular-nums]:text-[1.15rem] sm:[&_.grid.grid-cols-3_p.tabular-nums]:text-[1.45rem]",
          "[&_.grid.grid-cols-3_p.tabular-nums]:leading-none [&_.grid.grid-cols-3_p.tabular-nums]:font-bold",
          "[&_.grid.grid-cols-3>div]:px-2 [&_.grid.grid-cols-3>div]:py-2.5 sm:[&_.grid.grid-cols-3>div]:py-3"
        )}
      >
        <ChatSignalCard ticket={DEMO_TICKET} className="mt-0" tone="neutral" />
      </div>

      <div
        className={cn(
          landingGlassPill,
          "flex h-12 items-center gap-2.5 rounded-full px-2.5"
        )}
      >
        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-[#2563EB]/12 text-[#1D4ED8] dark:text-[#93C5FD]">
          <PlusIcon className="size-3.5" strokeWidth={2} />
        </span>
        <span className="min-w-0 flex-1 truncate text-start text-sm text-muted-foreground">
          {prompt}
        </span>
        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-[#2563EB] text-white shadow-[0_8px_20px_rgba(37,99,235,0.35)]">
          <ArrowUpIcon className="size-3.5" strokeWidth={2.4} aria-hidden />
        </span>
      </div>
    </div>
  )
}

function HeroFlowPreview({
  labels,
}: {
  labels: { key: FeaturesDeskKey; title: string }[]
}) {
  return (
    <ol className="relative m-0 flex list-none flex-col gap-0 p-0">
      <span
        aria-hidden
        className="absolute start-5 top-6 bottom-6 w-px bg-foreground/10"
      />
      {labels.map(({ key, title }) => {
        const Mark = FEATURES_DESK_MARKS[key]
        return (
          <li key={key} className="relative flex items-center gap-3.5 py-2.5">
            <FeatureDrawMark Mark={Mark} sizeClass="size-10" />
            <p className={cn(landingTitleCard, "relative z-10 text-[0.95rem]")}>
              {title}
            </p>
          </li>
        )
      })}
    </ol>
  )
}

export function FeaturesOverview() {
  const t = useTranslations("featuresPage")
  const common = useTranslations("common")
  const launchHref = getLaunchAppHref()
  const launchExternal = /^https?:\/\//i.test(launchHref)
  const launchRender = launchExternal ? (
    <a href={launchHref} />
  ) : (
    <Link href={launchHref} />
  )

  const deskPreview = FEATURES_DESK_KEYS.map((key) => ({
    key,
    title: t(`desk.items.${key}.title`),
  }))

  const advantageRows = FEATURES_ADVANTAGE_KEYS.filter((key) => key !== "crypto")
  const soonTools = FEATURES_COMPOSER_KEYS.filter((key) => key !== "signal")

  return (
    <div className="flex flex-col gap-16 sm:gap-20 lg:gap-24">
      {/* Hero */}
      <article
        className={cn(
          landingHeroGlass,
          "overflow-hidden rounded-[2rem] sm:rounded-[2.5rem]"
        )}
      >
        <HeroLiquidGlassBg tone="blue" />
        <div className={cn(landingInner, "relative z-10 py-12 sm:py-14 lg:py-16")}>
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-12">
            <ScrollReveal>
              <div className="text-center sm:text-start">
                <p className={cn(landingTitleBrand, "text-foreground/85")}>
                  {SITE_NAME}
                </p>
                <h1
                  className={cn(
                    landingTitleSection,
                    "mt-3 text-[2.35rem] sm:text-5xl lg:text-[3.1rem]"
                  )}
                >
                  {t("title")}
                </h1>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">
                  {t("intro")}
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5 sm:justify-start">
                  <Button
                    className={landingCta("primary", "md")}
                    nativeButton={false}
                    render={launchRender}
                  >
                    {common("launchApp")}
                  </Button>
                  <Button
                    className={landingCta("light", "md")}
                    nativeButton={false}
                    render={<Link href={UPGRADE_PATH} />}
                  >
                    {t("ctaUpgrade")}
                  </Button>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  {t("heroNote")}
                </p>
                <div className="mt-7 flex justify-center sm:justify-start">
                  <JumpNav labelFor={(key) => t(`jump.${key}`)} />
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.08}>
              <div
                className={cn(
                  landingGlassSurface,
                  "relative overflow-hidden rounded-[1.75rem] bg-white/42 px-5 py-5 dark:bg-white/8 sm:px-6 sm:py-6"
                )}
              >
                <GlassSheen className="rounded-[1.75rem]" />
                <div className="relative z-10">
                  <p
                    className={cn(
                      landingDisplay,
                      "text-[13px] text-muted-foreground"
                    )}
                  >
                    {t("heroFlowLabel")}
                  </p>
                  <div className="mt-3">
                    <HeroFlowPreview labels={deskPreview} />
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </article>

      {/* Desk */}
      <section
        id="desk"
        className={cn(landingSection, "scroll-mt-28")}
        aria-labelledby="features-desk-heading"
      >
        <ScrollReveal>
          <SectionHeader
            title={
              <span id="features-desk-heading">{t("desk.title")}</span>
            }
            subtitle={t("desk.subtitle")}
            className="mx-0 max-w-2xl text-center sm:text-start [&_p]:mx-0 sm:[&_p]:mx-0"
          />
        </ScrollReveal>

        <ScrollRevealGroup
          className={cn(landingContentWide, landingAfterHeader)}
        >
          <ol className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES_DESK_KEYS.map((key) => {
              const Mark = FEATURES_DESK_MARKS[key]
              return (
                <li key={key}>
                  <article
                    className={cn(
                      landingGlassSurface,
                      "group relative flex h-full flex-col items-start overflow-visible rounded-[1.75rem] bg-white/42 px-5 py-7 dark:bg-white/8 sm:px-6"
                    )}
                  >
                    <GlassSheen className="rounded-[1.75rem]" />
                    <FeatureDrawMark Mark={Mark} sizeClass="size-20 sm:size-24" />
                    <h3 className={cn(landingTitleCard, "relative z-10 mt-5")}>
                      {t(`desk.items.${key}.title`)}
                    </h3>
                    <p className="relative z-10 mt-2 text-sm leading-relaxed text-muted-foreground">
                      {t(`desk.items.${key}.body`)}
                    </p>
                  </article>
                </li>
              )
            })}
          </ol>
        </ScrollRevealGroup>
      </section>

      {/* Composer */}
      <section
        id="composer"
        className={cn(landingSection, landingSectionBody, "scroll-mt-28")}
        aria-labelledby="features-composer-heading"
      >
        <ScrollReveal>
          <SectionHeader
            title={
              <span id="features-composer-heading">{t("composer.title")}</span>
            }
            subtitle={t("composer.subtitle")}
          />
        </ScrollReveal>

        <div
          className={cn(
            landingContentWide,
            landingAfterHeader,
            "grid gap-4 lg:grid-cols-12 lg:gap-5"
          )}
        >
          <ScrollReveal className="lg:col-span-7">
            <article
              className={cn(
                landingGlassSurface,
                "relative h-full overflow-hidden rounded-[1.75rem] bg-white/42 px-5 py-6 dark:bg-white/8 sm:px-7 sm:py-8"
              )}
            >
              <GlassSheen className="rounded-[1.75rem]" />
              <div className="relative z-10">
                <div className="flex flex-wrap items-center gap-3">
                  <FeatureDrawMark
                    Mark={FEATURES_COMPOSER_MARKS.signal}
                    sizeClass="size-12"
                  />
                  <h3 className={landingTitleCardLg}>
                    {t("composer.items.signal.title")}
                  </h3>
                  <span className="inline-flex items-center rounded-full bg-[#2563EB]/12 px-2.5 py-0.5 text-[11px] font-medium text-[#1D4ED8] dark:bg-[#2563EB]/22 dark:text-[#93C5FD]">
                    {t("composer.items.signal.badge")}
                  </span>
                </div>
                <p className="mt-3 max-w-lg text-[0.9375rem] leading-relaxed text-muted-foreground">
                  {t("composer.items.signal.body")}
                </p>

                <SignalComposerMock
                  prompt={t("composer.mockPrompt")}
                  userMessage={t("composer.mockUser")}
                  youLabel={t("composer.you")}
                />
              </div>
            </article>
          </ScrollReveal>

          <ScrollRevealGroup className="flex flex-col gap-4 lg:col-span-5">
            {soonTools.map((key) => {
              const Mark = FEATURES_COMPOSER_MARKS[key]
              return (
                <article
                  key={key}
                  className={cn(
                    landingGlassSurface,
                    "relative flex flex-1 flex-col overflow-hidden rounded-[1.75rem] bg-white/42 px-5 py-6 dark:bg-white/8 sm:px-6"
                  )}
                >
                  <GlassSheen className="rounded-[1.75rem]" />
                  <div className="relative z-10 flex h-full flex-col">
                    <div className="flex flex-wrap items-center gap-3">
                      <FeatureDrawMark Mark={Mark} sizeClass="size-12" />
                      <h3 className={landingTitleCard}>
                        {t(`composer.items.${key}.title`)}
                      </h3>
                      <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                        {t(`composer.items.${key}.badge`)}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {t(`composer.items.${key}.body`)}
                    </p>
                  </div>
                </article>
              )
            })}
          </ScrollRevealGroup>
        </div>
      </section>

      {/* Advantages */}
      <section
        id="advantages"
        className={cn(landingSection, "scroll-mt-28")}
        aria-labelledby="features-advantages-heading"
      >
        <ScrollReveal>
          <SectionHeader
            title={
              <span id="features-advantages-heading">
                {t("advantages.title")}
              </span>
            }
            subtitle={t("advantages.subtitle")}
            className="mx-0 max-w-2xl text-center sm:text-start [&_p]:mx-0"
          />
        </ScrollReveal>

        <ScrollReveal className={cn(landingAfterHeader)}>
          <article
            className={cn(
              "relative overflow-hidden rounded-[2rem] bg-white/40 px-6 py-8 shadow-[0_28px_80px_rgba(15,23,42,0.07)] backdrop-blur-2xl sm:px-8 sm:py-10 dark:bg-white/6 dark:shadow-[0_28px_80px_rgba(0,0,0,0.45)]"
            )}
          >
            <HeroLiquidGlassBg tone="blue" />
            <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between sm:gap-10">
              <div className="min-w-0 text-center sm:text-start">
                <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                  <span
                    className="relative z-10 flex items-center -space-x-2.5"
                    aria-hidden
                  >
                    {(["USDT", "USDC"] as const).map((currency) => (
                      <span
                        key={currency}
                        className="relative isolate inline-flex overflow-hidden rounded-full"
                      >
                        <PaymentTokenLogo
                          currency={currency}
                          size="lg"
                          className="ring-2 ring-white/80 dark:ring-white/20"
                        />
                        <span className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-full">
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
                    ))}
                  </span>
                  <h3 className={landingTitleCardLg}>
                    {t("advantages.items.crypto.title")}
                  </h3>
                </div>
                <p className="mt-3 max-w-xl text-[0.9375rem] leading-relaxed text-muted-foreground sm:text-base">
                  {t("advantages.items.crypto.body")}
                </p>
                <div className="mt-5 flex justify-center sm:justify-start">
                  <Button
                    className={landingCta("primary", "sm")}
                    nativeButton={false}
                    render={<Link href={UPGRADE_PATH} />}
                  >
                    {t("ctaUpgrade")}
                  </Button>
                </div>
              </div>
              <p
                className={cn(
                  landingDisplay,
                  "shrink-0 text-center text-sm tracking-[-0.01em] text-muted-foreground sm:text-end"
                )}
              >
                USDT · USDC
                <span className="mt-1 block text-xs text-muted-foreground/80">
                  Ethereum
                </span>
              </p>
            </div>
          </article>
        </ScrollReveal>

        <ScrollRevealGroup className={cn(landingContentWide, "mt-5 sm:mt-6")}>
          <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {advantageRows.map((key) => {
              const Mark = FEATURES_ADVANTAGE_MARKS[key]
              return (
                <li key={key}>
                  <article
                    className={cn(
                      landingGlassSurface,
                      "relative flex h-full flex-col overflow-visible rounded-[1.75rem] bg-white/42 px-5 py-6 dark:bg-white/8"
                    )}
                  >
                    <GlassSheen className="rounded-[1.75rem]" />
                    <FeatureDrawMark Mark={Mark} sizeClass="size-14" />
                    <h3 className={cn(landingTitleCard, "relative z-10 mt-4")}>
                      {t(`advantages.items.${key}.title`)}
                    </h3>
                    <p className="relative z-10 mt-2 text-sm leading-relaxed text-muted-foreground">
                      {t(`advantages.items.${key}.body`)}
                    </p>
                  </article>
                </li>
              )
            })}
          </ul>
        </ScrollRevealGroup>
      </section>

      {/* Boundaries */}
      <section
        id="boundaries"
        className={cn(landingSection, "scroll-mt-28")}
        aria-labelledby="features-boundaries-heading"
      >
        <ScrollReveal>
          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-14">
            <div className="text-center sm:text-start">
              <h2
                id="features-boundaries-heading"
                className={landingTitleSection}
              >
                {t("boundaries.title")}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                {t("boundaries.body")}
              </p>
            </div>
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {(["0", "1", "2"] as const).map((itemKey) => (
                <li
                  key={itemKey}
                  className={cn(
                    landingGlassSurface,
                    "relative overflow-hidden rounded-[1.5rem] bg-white/42 px-5 py-4 dark:bg-white/8"
                  )}
                >
                  <GlassSheen className="rounded-[1.5rem]" />
                  <p className="relative z-10 text-[0.9375rem] leading-relaxed text-foreground/80 sm:text-base">
                    {t(`boundaries.items.${itemKey}`)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </ScrollReveal>
      </section>

      {/* Closing CTA */}
      <section
        id="get-started"
        className={cn(
          landingSection,
          landingSectionBody,
          "bg-white/40 shadow-[0_28px_80px_rgba(15,23,42,0.07)] backdrop-blur-2xl dark:bg-white/6 dark:shadow-[0_28px_80px_rgba(0,0,0,0.45)]"
        )}
        aria-labelledby="features-cta-heading"
      >
        <HeroLiquidGlassBg tone="blue" />
        <div className={cn(landingInner, "relative z-10")}>
          <ScrollReveal>
            <div className="mx-auto max-w-2xl text-center">
              <h2 id="features-cta-heading" className={landingTitleSection}>
                {t("cta.title")}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                {t("cta.subtitle")}
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
                <SphereCta href={launchHref} variant="glass">
                  {t("cta.openDesk")}
                </SphereCta>
                <Button
                  className={landingCta("light", "md")}
                  nativeButton={false}
                  render={<Link href={APP_NEWS_PATH} />}
                >
                  {t("cta.readNews")}
                </Button>
              </div>
              <p className="mt-5 text-xs text-muted-foreground">{t("cta.note")}</p>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  )
}
