"use client"

import { useEffect, useState } from "react"

import { AnimatedSvgIcon } from "@/components/landing/modern/animated-svg-icon"
import {
  SIGNALS_LIVE_MARKS,
  SIGNALS_SOON_MARKS,
} from "@/components/landing/modern/signals-market-marks"
import {
  ScrollReveal,
  ScrollRevealGroup,
} from "@/components/landing/modern/scroll-reveal"
import {
  SectionHeader,
  SphereCta,
} from "@/components/landing/modern/sphere-ui"
import { formatSignalCommand } from "@/lib/chat/composer-mentions"
import { formatTradePrice } from "@/lib/chat/trade-signal"
import { buildLandingChatHref } from "@/lib/landing-chat-handoff"
import {
  SIGNALS_LIVE_MARKETS,
  SIGNALS_MARKETS_SECTION,
  SIGNALS_SOON_MARKETS,
} from "@/lib/landing-modern-data"
import {
  landingAfterHeader,
  landingContent,
  landingContentWide,
  landingGlassSheen,
  landingGlassSurface,
  landingInner,
  landingSection,
  landingSectionBody,
  landingTitleCard,
} from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

type LivePrices = Partial<Record<(typeof SIGNALS_LIVE_MARKETS)[number]["symbol"], number | null>>

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
        —
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
  name,
  prices,
}: (typeof SIGNALS_LIVE_MARKETS)[number] & { prices: LivePrices | null }) {
  const Mark = SIGNALS_LIVE_MARKS[id]
  const href = buildLandingChatHref(formatSignalCommand(symbol))

  return (
    <article
      className={cn(
        landingGlassSurface,
        "group relative flex flex-col items-center overflow-hidden rounded-[1.75rem] bg-white/42 px-5 py-8 text-center dark:bg-white/8 sm:px-6 sm:py-9"
      )}
    >
      <span
        aria-hidden
        className={cn(landingGlassSheen, "absolute inset-0 rounded-[1.75rem]")}
      />

      <AnimatedSvgIcon
        replayOnHover
        scrollTrigger
        className="relative z-10 mb-6 size-26 text-foreground/70 lg:size-32"
      >
        <Mark />
      </AnimatedSvgIcon>

      <h3 className={cn("relative z-10", landingTitleCard)}>
        <span className="mr-2 font-(family-name:--font-mono-modern) text-[0.65em] font-medium tracking-[0.14em] text-muted-foreground/70 uppercase">
          {symbol}
        </span>
        {name}
      </h3>

      <LivePrice symbol={symbol} prices={prices} />

      <SphereCta
        href={href}
        variant="glass"
        size="sm"
        className="relative z-10 mt-6"
      >
        {SIGNALS_MARKETS_SECTION.cardAction}
      </SphereCta>
    </article>
  )
}

function SoonMarketChip({
  id,
  symbol,
  name,
}: (typeof SIGNALS_SOON_MARKETS)[number]) {
  const Mark = SIGNALS_SOON_MARKS[id]

  return (
    <li
      className={cn(
        "flex flex-col items-center gap-2 opacity-[0.38]",
        "transition-opacity duration-300 hover:opacity-55"
      )}
    >
      <AnimatedSvgIcon
        replayOnHover
        scrollTrigger
        className="size-14 text-foreground/70 sm:size-16"
      >
        <Mark />
      </AnimatedSvgIcon>
      <span className="text-[0.6875rem] font-medium tracking-wide text-muted-foreground uppercase">
        {symbol}
      </span>
      <span className="sr-only">
        {name}, {SIGNALS_MARKETS_SECTION.soonLabel}
      </span>
    </li>
  )
}

export function SignalsMarketsSection() {
  const prices = useLiveMarketPrices()

  return (
    <section id="signals" className={cn(landingSection, landingSectionBody)}>
      <div className={landingInner}>
        <ScrollReveal>
          <SectionHeader
            title={SIGNALS_MARKETS_SECTION.title}
            subtitle={SIGNALS_MARKETS_SECTION.subtitle}
          />
        </ScrollReveal>

        <ScrollRevealGroup
          className={cn(
            landingContentWide,
            "grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5",
            landingAfterHeader
          )}
        >
          {SIGNALS_LIVE_MARKETS.map((market) => (
            <LiveMarketCard key={market.id} {...market} prices={prices} />
          ))}
        </ScrollRevealGroup>

        <ScrollReveal delay={0.12} className={cn(landingContent, landingAfterHeader)}>
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">
              {SIGNALS_MARKETS_SECTION.soonHint}
            </p>
            <ul className="mt-6 flex flex-wrap items-start justify-center gap-x-5 gap-y-6 sm:gap-x-7">
              {SIGNALS_SOON_MARKETS.map((market) => (
                <SoonMarketChip key={market.id} {...market} />
              ))}
            </ul>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
