"use client"

import * as React from "react"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CandlestickChartIcon,
  PinIcon,
  ChevronsUpDownIcon,
  SearchIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"

import { DeskEmptyState } from "@/components/desk/desk-empty-state"
import { DeskGlassCard } from "@/components/desk/desk-page-frame"
import { MarketAssetLogo } from "@/components/dashboard/market-asset-logo"
import { deskSearchHaystack } from "@/lib/desk-markets-catalog"
import {
  formatCompactUsd,
  formatPct,
  formatPrice,
  formatUsd,
  pnlToneClass,
} from "@/lib/desk-mock/format"
import type { DeskMarketQuote } from "@/lib/desk-mock/types"
import { landingGlassSheen } from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

function marketMatchesQuery(m: DeskMarketQuote, query: string): boolean {
  const hay = deskSearchHaystack({
    hlCoin: m.hlCoin ?? m.instrument,
    instrument: m.instrument,
    label: m.label,
    quote: m.quote,
  })
  // Deep search: every whitespace token must match somewhere in the haystack.
  const tokens = query
    .trim()
    .toLowerCase()
    .split(/[\s,/|_-]+/)
    .map((t) => t.trim())
    .filter(Boolean)
  if (tokens.length === 0) return true
  return tokens.every((token) => hay.includes(token))
}

type SortKey = "price" | "change"
type SortDir = "asc" | "desc"

const MARKED_MARKETS_KEY = "exur.desk.marked-markets"
const MARKED_MARKETS_CHANGED = "exur-desk-marked-markets"

function subscribeMarkedMarkets(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {}
  const onStorage = (event: StorageEvent) => {
    if (event.key === MARKED_MARKETS_KEY || event.key === null) onStoreChange()
  }
  window.addEventListener("storage", onStorage)
  window.addEventListener(MARKED_MARKETS_CHANGED, onStoreChange)
  return () => {
    window.removeEventListener("storage", onStorage)
    window.removeEventListener(MARKED_MARKETS_CHANGED, onStoreChange)
  }
}

function getMarkedMarketsRaw(): string {
  if (typeof window === "undefined") return "[]"
  try {
    return window.localStorage.getItem(MARKED_MARKETS_KEY) ?? "[]"
  } catch {
    return "[]"
  }
}

function parseMarkedMarkets(raw: string): Set<string> {
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return new Set()
    return new Set(
      parsed.filter((item): item is string => typeof item === "string")
    )
  } catch {
    return new Set()
  }
}

function MiniSpark({
  values,
  up,
}: {
  values: number[]
  up: boolean
}) {
  if (values.length < 2) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const w = 56
  const h = 22
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w
      const y = h - ((v - min) / span) * (h - 2) - 1
      return `${x},${y}`
    })
    .join(" ")

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="hidden overflow-visible sm:block"
      aria-hidden
    >
      <polyline
        fill="none"
        stroke={up ? "oklch(0.65 0.17 155)" : "oklch(0.62 0.2 25)"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={pts}
      />
    </svg>
  )
}

function SortHeaderButton({
  label,
  active,
  dir,
  className,
  onClick,
}: {
  label: string
  active: boolean
  dir: SortDir | null
  className?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-end gap-0.5 text-[11px] font-medium tracking-[0.08em] uppercase transition-colors",
        active
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground",
        className
      )}
      aria-pressed={active}
    >
      {label}
      {active && dir === "asc" ? (
        <ArrowUpIcon className="size-3 stroke-[2.25]" aria-hidden />
      ) : active && dir === "desc" ? (
        <ArrowDownIcon className="size-3 stroke-[2.25]" aria-hidden />
      ) : (
        <ChevronsUpDownIcon
          className="size-3 opacity-45 stroke-[2]"
          aria-hidden
        />
      )}
    </button>
  )
}

function MarketPriceCards({
  markets,
}: {
  markets: DeskMarketQuote[]
  demo?: boolean
}) {
  const t = useTranslations("deskMarkets")
  const [query, setQuery] = React.useState("")
  const [sortKey, setSortKey] = React.useState<SortKey | null>(null)
  const [sortDir, setSortDir] = React.useState<SortDir>("desc")
  const markedRaw = React.useSyncExternalStore(
    subscribeMarkedMarkets,
    getMarkedMarketsRaw,
    () => "[]"
  )
  const marked = React.useMemo(
    () => parseMarkedMarkets(markedRaw),
    [markedRaw]
  )

  function toggleMarked(instrument: string) {
    const next = new Set(marked)
    if (next.has(instrument)) next.delete(instrument)
    else next.add(instrument)
    try {
      window.localStorage.setItem(
        MARKED_MARKETS_KEY,
        JSON.stringify([...next])
      )
    } catch {
      // ignore quota / private mode
    }
    window.dispatchEvent(new Event(MARKED_MARKETS_CHANGED))
  }

  function toggleSort(key: SortKey) {
    if (sortKey !== key) {
      setSortKey(key)
      setSortDir("desc")
      return
    }
    if (sortDir === "desc") {
      setSortDir("asc")
      return
    }
    setSortKey(null)
    setSortDir("desc")
  }

  const rows = React.useMemo(() => {
    const next = query.trim()
      ? markets.filter((m) => marketMatchesQuery(m, query))
      : [...markets]

    if (sortKey) {
      const dir = sortDir === "asc" ? 1 : -1
      next.sort((a, b) => {
        const av = sortKey === "price" ? a.price : a.change24hPct
        const bv = sortKey === "price" ? b.price : b.change24hPct
        if (av === bv) return a.instrument.localeCompare(b.instrument)
        return av > bv ? dir : -dir
      })
    } else {
      // Default tape: volume desc (API already sorted; keep after filter).
      next.sort(
        (a, b) => (b.volume24hUsd ?? 0) - (a.volume24hUsd ?? 0)
      )
    }

    // Marked markets always pin to the top (keep relative order inside each group).
    next.sort((a, b) => {
      const aMarked = marked.has(a.instrument) ? 0 : 1
      const bMarked = marked.has(b.instrument) ? 0 : 1
      return aMarked - bMarked
    })

    return next
  }, [markets, marked, query, sortDir, sortKey])

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-3 pt-1 sm:gap-3.5 sm:pt-2">
      <label
        className={cn(
          "relative isolate flex min-h-12 shrink-0 items-center gap-2.5 overflow-hidden rounded-[1.25rem] px-3.5 sm:px-4",
          "border border-white/80 dark:border-white/20",
          "bg-white/55 supports-[backdrop-filter]:bg-white/42 backdrop-blur-[40px] backdrop-saturate-[175%]",
          "shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_28px_-10px_rgba(15,23,42,0.12),inset_0_1px_1px_rgba(255,255,255,0.95),inset_0_0_0_0.5px_rgba(255,255,255,0.6),inset_0_-8px_16px_-10px_rgba(15,23,42,0.07)]",
          "dark:bg-white/10 dark:supports-[backdrop-filter]:bg-white/8",
          "dark:shadow-[0_1px_2px_rgba(0,0,0,0.22),0_10px_28px_-10px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.22),inset_0_0_0_0.5px_rgba(255,255,255,0.12),inset_0_-10px_18px_-10px_rgba(0,0,0,0.4)]"
        )}
      >
        <span
          aria-hidden
          className={cn(landingGlassSheen, "rounded-[1.25rem]")}
        />
        <SearchIcon
          className="relative z-10 size-4 shrink-0 text-muted-foreground"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="relative z-10 min-w-0 flex-1 bg-transparent py-3 text-[14px] text-foreground outline-none placeholder:text-muted-foreground/70"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
      </label>

      <DeskGlassCard
        className={cn(
          "flex min-h-0 flex-1 flex-col overflow-hidden p-0 sm:p-0",
          // Soft lift only — the deep 28/72 shadow reads as cut-off in a full-height panel.
          "shadow-[0_1px_2px_rgba(15,23,42,0.04),0_6px_18px_-10px_rgba(15,23,42,0.1),inset_0_1px_1px_rgba(255,255,255,0.95),inset_0_0_0_0.5px_rgba(255,255,255,0.55)]",
          "dark:shadow-[0_1px_2px_rgba(0,0,0,0.22),0_6px_18px_-10px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.2),inset_0_0_0_0.5px_rgba(255,255,255,0.12)]"
        )}
        contentClassName="flex min-h-0 flex-1 flex-col divide-y divide-border/35 dark:divide-white/8"
      >
        <div className="flex shrink-0 items-center gap-3 px-3.5 py-2.5 sm:px-4">
          <p className="min-w-0 flex-1 text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
            {t("pair")}
          </p>
          <div className="hidden w-14 shrink-0 sm:block" aria-hidden />
          <div className="flex shrink-0 items-center gap-6 sm:gap-10">
            <SortHeaderButton
              label={t("lastPrice")}
              active={sortKey === "price"}
              dir={sortKey === "price" ? sortDir : null}
              className="w-[4.5rem] sm:w-[5.5rem]"
              onClick={() => toggleSort("price")}
            />
            <SortHeaderButton
              label={t("change24h")}
              active={sortKey === "change"}
              dir={sortKey === "change" ? sortDir : null}
              className="w-[4.25rem]"
              onClick={() => toggleSort("change")}
            />
            <p className="hidden w-[4.5rem] text-end text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase sm:block">
              {t("volume24h")}
            </p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {rows.length === 0 ? (
            <DeskEmptyState
              icon={query.trim() ? SearchIcon : CandlestickChartIcon}
              title={
                query.trim() ? t("searchEmptyTitle") : t("marketsEmptyTitle")
              }
              description={
                query.trim() ? t("searchEmpty") : t("marketsEmpty")
              }
              className="py-10 sm:py-12"
            />
          ) : (
            <ul>
              {rows.map((m) => {
                const up = m.change24hPct >= 0
                const quote = m.quote ?? "USD"
                const prev =
                  m.change24hPct === -100
                    ? 0
                    : m.price / (1 + m.change24hPct / 100)
                const changeUsd = m.price - prev
                return (
                  <li
                    key={m.instrument}
                    className="flex items-center gap-3 border-b border-border/35 px-3.5 py-3 last:border-b-0 sm:px-4 sm:py-3.5 dark:border-white/8"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleMarked(m.instrument)}
                        aria-pressed={marked.has(m.instrument)}
                        aria-label={
                          marked.has(m.instrument)
                            ? t("unmarkMarket", { market: m.instrument })
                            : t("markMarket", { market: m.instrument })
                        }
                        className={cn(
                          "inline-flex size-8 shrink-0 items-center justify-center rounded-full transition-colors",
                          "hover:bg-black/[0.05] dark:hover:bg-white/10",
                          marked.has(m.instrument)
                            ? "text-muted-foreground"
                            : "text-muted-foreground/45 hover:text-muted-foreground/70"
                        )}
                      >
                        <PinIcon
                          className={cn(
                            "size-4 stroke-[1.75]",
                            marked.has(m.instrument) && "fill-current"
                          )}
                          aria-hidden
                        />
                      </button>
                      <MarketAssetLogo
                        symbol={m.instrument}
                        className="size-8 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-semibold tracking-tight">
                          {m.instrument}
                          <span className="font-medium text-muted-foreground">
                            /{quote}
                          </span>
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {m.label}
                        </p>
                      </div>
                    </div>

                    <MiniSpark values={m.sparkline} up={up} />

                    <div className="flex shrink-0 items-center gap-6 sm:gap-10">
                      <p className="w-[4.5rem] text-end text-[14px] font-medium tabular-nums tracking-tight sm:w-[5.5rem]">
                        {formatPrice(m.price, m.instrument)}
                      </p>
                      <div
                        className={cn(
                          "flex w-[4.25rem] flex-col items-end gap-0.5 tabular-nums",
                          pnlToneClass(m.change24hPct)
                        )}
                      >
                        <span className="text-[12px] font-semibold leading-none">
                          {formatPct(m.change24hPct)}
                        </span>
                        <span className="text-[10px] font-medium leading-none opacity-70">
                          {formatUsd(changeUsd, {
                            signed: true,
                            digits: Math.abs(changeUsd) >= 100 ? 0 : 2,
                          })}
                        </span>
                      </div>
                      <p className="hidden w-[4.5rem] text-end text-[12px] font-medium tabular-nums text-muted-foreground sm:block">
                        {formatCompactUsd(m.volume24hUsd ?? 0)}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </DeskGlassCard>
    </section>
  )
}

export { MarketPriceCards }
