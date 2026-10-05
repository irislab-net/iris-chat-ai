"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"

import {
  chatComposerLiquidSheetRowActiveClass,
  chatComposerLiquidSheetRowClass,
  chatComposerLiquidSheetRowIconClass,
  chatMobileSheetCardClass,
  chatMobileSheetSectionLabelClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
import { ChatNoTradeCard } from "@/components/app-shell/chat-no-trade-card"
import { ChatSignalCard } from "@/components/app-shell/chat-signal-card"
import { PaymentTokenLogo } from "@/components/billing/payment-token-logo"
import { MarketAssetLogo } from "@/components/dashboard/market-asset-logo"
import { FeaturesClientsSection } from "@/components/landing/modern/features-clients-section"
import { FeaturesExtensionSection } from "@/components/landing/modern/features-extension-section"
import { FeaturesNewsShowcase } from "@/components/landing/modern/features-news-showcase"
import { FeaturesQualitySection } from "@/components/landing/modern/features-quality-section"
import {
  FeaturesDemoStage,
  FeaturesGlassSheen,
} from "@/components/landing/modern/features-stage"
import { HeroLiquidGlassBg } from "@/components/landing/modern/hero-liquid-glass-bg"
import {
  ScrollReveal,
  ScrollRevealGroup,
} from "@/components/landing/modern/scroll-reveal"
import { SectionHeader, SphereCta } from "@/components/landing/modern/sphere-ui"
import { LocaleSwitcher } from "@/components/i18n/locale-switcher"
import { Button } from "@/components/ui/button"
import {
  SelectionCheckBadge,
  SelectionCheckSpacer,
} from "@/components/ui/selection-check-badge"
import { Link } from "@/i18n/navigation"
import {
  formatSignalCommand,
  mentionTokenForTool,
} from "@/lib/chat/composer-mentions"
import { formatTradePrice } from "@/lib/chat/trade-signal"
import { FEATURES_JUMP_LINKS } from "@/lib/features-overview-data"
import {
  FEATURES_GOLD_ASK,
  FEATURES_TOOL_ASSETS,
  FEATURES_XAU_TICKET,
  FEATURES_XAU_WAIT_REASON,
  type FeaturesToolSymbol,
} from "@/lib/features-showcase-fixtures"
import { buildLandingChatHref } from "@/lib/landing-chat-handoff"
import { GUEST_TRIAL_STAT } from "@/lib/landing-modern-data"
import {
  landingAfterHeader,
  landingContent,
  landingContentWide,
  landingCta,
  landingDisplay,
  landingGlassPill,
  landingGlassSurface,
  landingInner,
  landingMainStack,
  landingSection,
  landingSectionBody,
  landingTitleBrand,
  landingTitleCard,
  landingTitleSection,
} from "@/lib/landing-modern-styles"
import {
  APP_NEWS_PATH,
  getLaunchAppHref,
  SITE_NAME,
  UPGRADE_PATH,
} from "@/lib/site"
import { cn } from "@/lib/utils"

function useLiveXauPrice() {
  const [price, setPrice] = useState<number | null | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()

    async function load() {
      try {
        const res = await fetch("/api/market/mids", {
          signal: controller.signal,
          cache: "no-store",
        })
        if (!res.ok) throw new Error("mids failed")
        const data = (await res.json()) as {
          prices?: Partial<Record<"XAU" | "BTC" | "ETH", number | null>>
        }
        if (!cancelled) setPrice(data.prices?.XAU ?? null)
      } catch {
        if (!cancelled && !controller.signal.aborted) setPrice(null)
      }
    }

    void load()
    const timer = window.setInterval(() => void load(), 30_000)
    return () => {
      cancelled = true
      controller.abort()
      window.clearInterval(timer)
    }
  }, [])

  return price
}

function JumpNav({ labelFor }: { labelFor: (key: string) => string }) {
  return (
    <nav
      aria-label={labelFor("aria")}
      className="-mx-1 flex items-center gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden"
    >
      {FEATURES_JUMP_LINKS.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className={cn(
            landingGlassPill,
            "relative shrink-0 px-3.5 py-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          )}
        >
          <FeaturesGlassSheen className="rounded-full" />
          <span className="relative z-10">{labelFor(link.key)}</span>
        </a>
      ))}
    </nav>
  )
}

export function FeaturesOverview() {
  const t = useTranslations("featuresPage")
  const tSignals = useTranslations("modern.signals")
  const tGuest = useTranslations("modern.guestTrial")
  const tPay = useTranslations("modern.cryptoPay")
  const common = useTranslations("common")
  const xauPrice = useLiveXauPrice()
  const [toolAsset, setToolAsset] = useState<FeaturesToolSymbol>("ETH")

  const launchHref = getLaunchAppHref()
  const launchExternal = /^https?:\/\//i.test(launchHref)
  const launchRender = launchExternal ? (
    <a href={launchHref} />
  ) : (
    <Link href={launchHref} />
  )

  const signalLabel = t("tools.signalLabel")
  const signalToken = mentionTokenForTool("signal", signalLabel).trimEnd()

  return (
    <div className={landingMainStack}>
      {/* Hero — brand first, no ScrollReveal, no jump clutter */}
      <article className="relative overflow-hidden rounded-[1.75rem] bg-white/42 shadow-[0_28px_80px_rgba(15,23,42,0.07)] backdrop-blur-2xl dark:bg-white/6 dark:shadow-[0_28px_80px_rgba(0,0,0,0.45)] sm:rounded-[2.5rem]">
        <HeroLiquidGlassBg tone="blue" />
        <div
          className={cn(landingInner, "relative z-10 py-12 sm:py-16 lg:py-20")}
        >
          <div className="mx-auto max-w-3xl text-center">
            <p className={cn(landingTitleBrand, "text-foreground/80")}>
              {SITE_NAME}
            </p>
            <h1
              className={cn(
                landingTitleSection,
                "mt-4 text-[2.15rem] leading-[1.08] text-balance sm:text-5xl sm:leading-[1.05] lg:text-[3.35rem]"
              )}
            >
              {t("title")}
            </h1>
            <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">
              {t("intro")}
            </p>
            <div className="mt-8 flex flex-col items-stretch justify-center gap-2.5 sm:mt-9 sm:flex-row sm:items-center">
              <Button
                className={cn(landingCta("primary", "md"), "w-full sm:w-auto")}
                nativeButton={false}
                render={launchRender}
              >
                {common("launchApp")}
              </Button>
              <Button
                className={cn(landingCta("light", "md"), "w-full sm:w-auto")}
                nativeButton={false}
                render={<Link href={UPGRADE_PATH} />}
              >
                {t("ctaUpgrade")}
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground/80">
              {t("heroNote")}
            </p>
          </div>
        </div>
      </article>

      {/* Quiet jump strip — outside hero */}
      <ScrollReveal>
        <JumpNav labelFor={(key) => t(`jump.${key}`)} />
      </ScrollReveal>

      {/* Gold — setup + wait */}
      <section
        id="gold"
        className={cn(
          landingSection,
          landingSectionBody,
          "scroll-mt-24 py-12 sm:scroll-mt-28 sm:py-20 lg:py-24"
        )}
        aria-labelledby="features-gold-heading"
      >
        <ScrollReveal>
          <SectionHeader
            title={
              <span id="features-gold-heading">{t("gold.title")}</span>
            }
            subtitle={t("gold.subtitle")}
          />
        </ScrollReveal>
        <ScrollReveal className={cn(landingContentWide, landingAfterHeader)}>
          <FeaturesDemoStage>
            <div className="mb-5 flex items-center justify-between gap-3 px-1.5 sm:px-3.5">
              <span className="font-(family-name:--font-mono-modern) text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                XAU
              </span>
              <span className="inline-flex min-w-0 items-center gap-1.5 font-(family-name:--font-mono-modern) text-sm tabular-nums text-foreground sm:gap-2">
                <span className="shrink-0 text-[10px] tracking-widest text-muted-foreground uppercase">
                  {t("gold.liveLabel")}
                </span>
                {xauPrice === undefined ? (
                  <span
                    aria-hidden
                    className="chat-skeleton-shimmer inline-block h-4 w-16 rounded-md"
                  />
                ) : typeof xauPrice === "number" && xauPrice > 0 ? (
                  <span className="truncate">${formatTradePrice(xauPrice)}</span>
                ) : (
                  <span className="text-muted-foreground/50">—</span>
                )}
              </span>
            </div>
            <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
              <div className="min-w-0">
                <p className="mb-3 px-1.5 text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase sm:px-3.5">
                  {t("gold.setupLabel")}
                </p>
                <ChatSignalCard
                  ticket={FEATURES_XAU_TICKET}
                  className="mt-0"
                  tone="neutral"
                />
              </div>
              <div className="min-w-0">
                <p className="mb-3 px-1.5 text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase sm:px-3.5">
                  {t("gold.waitLabel")}
                </p>
                <ChatNoTradeCard
                  reason={FEATURES_XAU_WAIT_REASON}
                  className="mt-0"
                />
              </div>
            </div>
            <div className="mt-7 flex justify-center px-1.5 sm:px-3.5">
              <SphereCta
                href={buildLandingChatHref(FEATURES_GOLD_ASK)}
                variant="glass"
                size="sm"
              >
                {t("gold.askCta")}
              </SphereCta>
            </div>
          </FeaturesDemoStage>
        </ScrollReveal>
      </section>

      {/* Tools — real guidance picker */}
      <section
        id="tools"
        className={cn(
          landingSection,
          landingSectionBody,
          "scroll-mt-24 py-12 sm:scroll-mt-28 sm:py-20 lg:py-24"
        )}
        aria-labelledby="features-tools-heading"
      >
        <ScrollReveal>
          <SectionHeader
            title={
              <span id="features-tools-heading">{t("tools.title")}</span>
            }
            subtitle={t("tools.subtitle")}
          />
        </ScrollReveal>
        <ScrollReveal className={cn(landingContentWide, landingAfterHeader)}>
          <FeaturesDemoStage contentClassName="mx-auto w-full max-w-xl sm:max-w-2xl">
            <div className="space-y-4">
              <div
                className={cn(
                  chatMobileSheetCardClass,
                  "flex items-center gap-3 py-3.5"
                )}
              >
                <MarketAssetLogo
                  symbol={toolAsset}
                  className="size-10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.75)]"
                  imageClassName="opacity-80 grayscale dark:opacity-85 dark:invert"
                  size={40}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium tracking-widest text-muted-foreground uppercase">
                    {t("tools.draftHint")}
                  </p>
                  <p
                    className="mt-0.5 text-[15px] font-medium tracking-[-0.016em] text-foreground"
                    dir="ltr"
                  >
                    <span className="font-semibold text-[#2563EB] dark:text-[#93C5FD]">
                      {signalToken}
                    </span>
                    <span className="ms-1.5 font-semibold tabular-nums">
                      {toolAsset}
                    </span>
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <p className={cn(chatMobileSheetSectionLabelClass, "px-3.5")}>
                  {t("tools.pickLabel")}
                </p>
                <div
                  className="flex flex-col gap-1.5"
                  role="radiogroup"
                  aria-label={t("tools.pickLabel")}
                >
                  {FEATURES_TOOL_ASSETS.map((asset) => {
                    const selected = asset.symbol === toolAsset
                    return (
                      <Button
                        key={asset.symbol}
                        type="button"
                        variant="ghost"
                        role="radio"
                        aria-checked={selected}
                        className={cn(
                          chatComposerLiquidSheetRowClass,
                          "h-auto min-h-14 justify-start gap-3.5 px-3.5 py-3 text-[15px] font-medium tracking-[-0.016em] whitespace-normal hover:bg-white/58 dark:hover:bg-white/12",
                          selected && chatComposerLiquidSheetRowActiveClass
                        )}
                        onClick={() => setToolAsset(asset.symbol)}
                      >
                        <span
                          className={cn(
                            chatComposerLiquidSheetRowIconClass,
                            "overflow-hidden p-0"
                          )}
                        >
                          <MarketAssetLogo
                            symbol={asset.symbol}
                            className="size-10 bg-transparent"
                            imageClassName="opacity-80 grayscale dark:opacity-85 dark:invert"
                            size={40}
                          />
                        </span>
                        <span className="min-w-0 flex-1 text-start">
                          <span className="block text-foreground">
                            {tSignals(`markets.${asset.nameKey}`)}
                          </span>
                          <span
                            className="block font-(family-name:--font-mono-modern) text-[13px] font-normal tracking-[0.08em] text-muted-foreground uppercase"
                            dir="ltr"
                          >
                            {asset.symbol}
                          </span>
                        </span>
                        {selected ? (
                          <SelectionCheckBadge />
                        ) : (
                          <SelectionCheckSpacer />
                        )}
                      </Button>
                    )
                  })}
                </div>
              </div>

              <div className="flex justify-center px-3.5 pt-2">
                <SphereCta
                  href={buildLandingChatHref(formatSignalCommand(toolAsset))}
                  variant="glass"
                  size="sm"
                >
                  {t("tools.askCta")}
                </SphereCta>
              </div>
            </div>
          </FeaturesDemoStage>
        </ScrollReveal>
      </section>

      {/* News */}
      <section
        id="news"
        className={cn(
          landingSection,
          landingSectionBody,
          "scroll-mt-24 py-12 sm:scroll-mt-28 sm:py-20 lg:py-24"
        )}
        aria-labelledby="features-news-heading"
      >
        <ScrollReveal>
          <SectionHeader
            title={
              <span id="features-news-heading">{t("news.title")}</span>
            }
            subtitle={t("news.subtitle")}
          />
        </ScrollReveal>
        <ScrollReveal className={cn(landingContentWide, landingAfterHeader)}>
          <FeaturesNewsShowcase />
        </ScrollReveal>
      </section>

      <FeaturesQualitySection />
      <FeaturesExtensionSection />
      <FeaturesClientsSection />

      {/* Access */}
      <section
        id="access"
        className={cn(
          landingSection,
          landingSectionBody,
          "scroll-mt-24 py-12 sm:scroll-mt-28 sm:py-20 lg:py-24"
        )}
        aria-labelledby="features-access-heading"
      >
        <ScrollReveal>
          <SectionHeader
            title={
              <span id="features-access-heading">{t("access.title")}</span>
            }
            subtitle={t("access.subtitle")}
          />
        </ScrollReveal>

        <ScrollRevealGroup
          className={cn(
            landingContentWide,
            landingAfterHeader,
            "grid gap-4 lg:grid-cols-12"
          )}
        >
            <article
            className={cn(
              landingGlassSurface,
              "relative overflow-hidden rounded-[1.5rem] bg-white/48 px-5 py-7 text-center dark:bg-white/8 sm:rounded-[1.75rem] sm:px-8 sm:py-8 lg:col-span-5"
            )}
          >
            <HeroLiquidGlassBg tone="blue" />
            <FeaturesGlassSheen className="rounded-[1.75rem]" />
            <div className="relative z-10">
              <p
                className={cn(
                  landingDisplay,
                  "text-[4.5rem] leading-none tracking-[-0.06em] text-foreground"
                )}
              >
                {GUEST_TRIAL_STAT}
              </p>
              <p className="mt-2 text-xs font-medium tracking-wide text-muted-foreground">
                {tGuest("statLabel")}
              </p>
              <p className="mx-auto mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
                {t("access.guestBody")}
              </p>
              <div className="mt-6 flex justify-center">
                <SphereCta href={launchHref} variant="glass" size="sm">
                  {tGuest("cta")}
                </SphereCta>
              </div>
            </div>
          </article>

          <div className="flex flex-col gap-4 lg:col-span-7">
            <article
              className={cn(
                landingGlassSurface,
                "relative flex flex-1 flex-col justify-between overflow-hidden rounded-[1.75rem] bg-white/48 px-6 py-6 dark:bg-white/8 sm:flex-row sm:items-center sm:gap-6 sm:px-7"
              )}
            >
              <FeaturesGlassSheen className="rounded-[1.75rem]" />
              <div className="relative z-10 min-w-0 text-center sm:text-start">
                <h3 className={landingTitleCard}>{t("language.title")}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {t("language.body")}
                </p>
              </div>
              <div className="relative z-10 mt-5 flex justify-center sm:mt-0 sm:shrink-0">
                <LocaleSwitcher variant="chip" />
              </div>
            </article>

            <article
              className={cn(
                landingGlassSurface,
                "relative flex flex-1 flex-col justify-between overflow-hidden rounded-[1.75rem] bg-white/48 px-6 py-6 dark:bg-white/8 sm:flex-row sm:items-center sm:gap-6 sm:px-7"
              )}
            >
              <FeaturesGlassSheen className="rounded-[1.75rem]" />
              <div className="relative z-10 min-w-0 text-center sm:text-start">
                <div className="mb-3 flex items-center justify-center gap-0 sm:justify-start">
                  {(["USDT", "USDC"] as const).map((currency, i) => (
                    <span
                      key={currency}
                      className={cn(
                        "relative isolate inline-flex overflow-hidden rounded-full",
                        i > 0 && "-ms-2.5"
                      )}
                    >
                      <PaymentTokenLogo
                        currency={currency}
                        size="lg"
                        className="ring-2 ring-white/80 dark:ring-white/20"
                      />
                    </span>
                  ))}
                </div>
                <h3 className={landingTitleCard}>{tPay("title")}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {t("access.payBody")}
                </p>
              </div>
              <div className="relative z-10 mt-5 flex justify-center sm:mt-0 sm:shrink-0">
                <SphereCta href={UPGRADE_PATH} variant="glass" size="sm">
                  {tPay("cta")}
                </SphereCta>
              </div>
            </article>
          </div>
        </ScrollRevealGroup>
      </section>

      {/* Boundaries */}
      <section
        id="limits"
        className={cn(landingSection, "scroll-mt-24 sm:scroll-mt-28")}
        aria-labelledby="features-limits-heading"
      >
        <ScrollReveal>
          <div className={cn(landingContent, "text-center")}>
            <h2 id="features-limits-heading" className={landingTitleSection}>
              {t("boundaries.title")}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
              {t("boundaries.body")}
            </p>
            <ul className="mx-auto mt-10 max-w-md list-none space-y-4 p-0 text-start">
              {(["0", "1", "2"] as const).map((itemKey, index) => (
                <li
                  key={itemKey}
                  className="flex gap-4 text-[0.975rem] leading-relaxed text-foreground/80"
                >
                  <span className="font-(family-name:--font-mono-modern) text-sm text-muted-foreground/55 tabular-nums">
                    0{index + 1}
                  </span>
                  <span>{t(`boundaries.items.${itemKey}`)}</span>
                </li>
              ))}
            </ul>
          </div>
        </ScrollReveal>
      </section>

      {/* Close */}
      <section
        id="get-started"
        className={cn(
          landingSection,
          "relative overflow-hidden rounded-[1.75rem] bg-white/42 py-12 shadow-[0_28px_80px_rgba(15,23,42,0.07)] backdrop-blur-2xl dark:bg-white/6 dark:shadow-[0_28px_80px_rgba(0,0,0,0.45)] sm:rounded-[2.5rem] sm:py-20"
        )}
        aria-labelledby="features-cta-heading"
      >
        <HeroLiquidGlassBg tone="blue" />
        <div className={cn(landingInner, "relative z-10")}>
          <ScrollReveal>
            <div className="mx-auto max-w-xl text-center">
              <h2 id="features-cta-heading" className={landingTitleSection}>
                {t("cta.title")}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                {t("cta.subtitle")}
              </p>
              <div className="mt-8 flex flex-col items-stretch justify-center gap-2.5 sm:mt-9 sm:flex-row sm:items-center">
                <SphereCta
                  href={launchHref}
                  variant="glass"
                  className="w-full justify-center sm:w-auto"
                >
                  {t("cta.openDesk")}
                </SphereCta>
                <Button
                  className={cn(landingCta("light", "md"), "w-full sm:w-auto")}
                  nativeButton={false}
                  render={<Link href={APP_NEWS_PATH} />}
                >
                  {t("cta.readNews")}
                </Button>
              </div>
              <p className="mt-5 text-xs text-muted-foreground/80">
                {t("cta.note")}
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  )
}
