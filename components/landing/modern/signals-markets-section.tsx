"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"

import { AnimatedSvgIcon } from "@/components/landing/modern/animated-svg-icon"
import { SIGNALS_LIVE_MARKS } from "@/components/landing/modern/signals-market-marks"
import {
  ScrollReveal,
  ScrollRevealGroup,
} from "@/components/landing/modern/scroll-reveal"
import { SectionHeader, SphereCta } from "@/components/landing/modern/sphere-ui"
import { formatSignalCommand } from "@/lib/chat/composer-mentions"
import { formatTradePrice } from "@/lib/chat/trade-signal"
import { buildLandingChatHref } from "@/lib/landing-chat-handoff"
import {
  SIGNALS_LIVE_MARKETS,
  SIGNALS_SOON_MARKETS,
} from "@/lib/landing-modern-data"
import {
  landingAfterHeader,
  landingContent,
  landingContentWide,
  landingGlassSheen,
  landingGlassSurface,
  landingSection,
  landingSectionBody,
  landingTitleCard,
} from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

type LivePrices = Partial<
  Record<(typeof SIGNALS_LIVE_MARKETS)[number]["symbol"], number | null>
>

function useLiveMarketPrices() {
  const [prices, setPrices] = useState<LivePrices | null>(null)

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
        const data = (await res.json()) as { prices?: LivePrices }
        if (!cancelled) setPrices(data.prices ?? {})
      } catch {
        if (!cancelled && !controller.signal.aborted) setPrices({})
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

  return prices
}

function LivePrice({
  symbol,
  prices,
}: {
  symbol: (typeof SIGNALS_LIVE_MARKETS)[number]["symbol"]
  prices: LivePrices | null
}) {
  if (prices == null) {
    return (
      <span
        aria-hidden
        className="chat-skeleton-shimmer mt-2.5 inline-block h-5 w-22 rounded-md"
      />
    )
  }

  const value = prices[symbol]
  if (typeof value !== "number" || !(value > 0)) {
    return (
      <p className="relative z-10 mt-2.5 font-(family-name:--font-mono-modern) text-sm tracking-wide text-muted-foreground/50">
        -
      </p>
    )
  }

  return (
    <p className="relative z-10 mt-2.5 font-(family-name:--font-mono-modern) text-sm tracking-wide text-muted-foreground tabular-nums">
      ${formatTradePrice(value)}
    </p>
  )
}

function LiveMarketCard({
  id,
  symbol,
  prices,
}: (typeof SIGNALS_LIVE_MARKETS)[number] & { prices: LivePrices | null }) {
  const t = useTranslations("modern.signals")
  const Mark = SIGNALS_LIVE_MARKS[id]
  const href = buildLandingChatHref(formatSignalCommand(symbol))

  return (
    <article
      className={cn(
        landingGlassSurface,
        "group relative flex h-full flex-col items-center overflow-hidden rounded-[1.75rem] bg-white/42 px-5 py-6 text-center sm:px-6 sm:py-7 dark:bg-white/8"
      )}
    >
      <span
        aria-hidden
        className={cn(landingGlassSheen, "absolute inset-0 rounded-[1.75rem]")}
      />

      <AnimatedSvgIcon
        replayOnHover
        scrollTrigger
        className="relative z-10 mb-5 size-20 text-foreground/70 lg:size-24"
      >
        <Mark />
      </AnimatedSvgIcon>

      <h3 className={cn("relative z-10", landingTitleCard)}>
        <span className="me-2 font-(family-name:--font-mono-modern) text-[0.65em] font-medium tracking-[0.14em] text-muted-foreground/70 uppercase">
          {symbol}
        </span>
        {t(`markets.${id}`)}
      </h3>

      <LivePrice symbol={symbol} prices={prices} />

      <SphereCta
        href={href}
        variant="glass"
        size="sm"
        className="relative z-10 mt-5"
      >
        {t("cardAction")}
      </SphereCta>
    </article>
  )
}

export function SignalsMarketsSection() {
  const t = useTranslations("modern.signals")
  const prices = useLiveMarketPrices()

  return (
    <section id="signals" className={cn(landingSection, landingSectionBody)}>
      <ScrollReveal>
        <SectionHeader title={t("title")} subtitle={t("subtitle")} />
      </ScrollReveal>

      <ScrollRevealGroup
        className={cn(
          landingContentWide,
          "grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5",
          landingAfterHeader
        )}
      >
        <ul className="contents list-none">
          {SIGNALS_LIVE_MARKETS.map((market) => (
            <li key={market.id} className="min-h-0">
              <LiveMarketCard {...market} prices={prices} />
            </li>
          ))}
        </ul>
      </ScrollRevealGroup>

      <ScrollReveal
        delay={0.12}
        className={cn(landingContent, "mt-8 sm:mt-10")}
      >
        <div className="px-3.5 text-center">
          <p className="text-sm text-muted-foreground">
            {t("soonHint")}
            <span className="mx-2 text-muted-foreground/35" aria-hidden>
              ·
            </span>
            <span className="font-(family-name:--font-mono-modern) text-[0.8125rem] tracking-[0.08em] text-muted-foreground/55 uppercase">
              {SIGNALS_SOON_MARKETS.map((market) => market.symbol).join(" · ")}
            </span>
          </p>
          <ul className="sr-only">
            {SIGNALS_SOON_MARKETS.map((market) => (
              <li key={market.id}>
                {t(`markets.${market.id}`)}, {t("soonLabel")}
              </li>
            ))}
          </ul>
        </div>
      </ScrollReveal>
    </section>
  )
}
