"use client"

import * as React from "react"
import { NewspaperIcon, SquareIcon, Volume2Icon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Separator } from "@/components/ui/separator"
import { NewsBulletinSkeleton } from "@/components/dashboard/intel-skeletons"
import { WorkspaceLoginGate } from "@/components/dashboard/workspace-login-gate"
import { shouldShowWorkspaceLoginGate } from "@/lib/workspace-auth"
import { MarketAssetLogo } from "@/components/dashboard/market-asset-logo"
import { trackNewsArticleClick } from "@/lib/analytics"
import { hostFromUrl, newsPublishedLabel } from "@/lib/format"
import type { NewsAnalytics, NewsItem } from "@/lib/api/types"
import { cn } from "@/lib/utils"

/** Cap the scan list so a huge payload stays readable. */
const PRIMARY_NEWS_LIMIT = 20

const TAPE_WINDOWS = ["15m", "1h", "24h"] as const
const TAPE_ASSETS = ["BTC", "ETH", "DXY", "XAU"] as const

type SentimentTone = "Positive" | "Negative" | "Neutral"

function sentimentTone(score: number | null | undefined): SentimentTone | null {
  if (typeof score !== "number" || Number.isNaN(score)) return null
  if (score >= 0.2) return "Positive"
  if (score <= -0.2) return "Negative"
  return "Neutral"
}

function newsTone(item: NewsItem) {
  return sentimentTone(item.metrics?.overall_sentiment)
}

type TapeAsset = {
  asset: (typeof TAPE_ASSETS)[number]
  tone: SentimentTone
  score: number
}

function tapeAssets(analytics: NewsAnalytics | null): TapeAsset[] {
  const hour =
    analytics?.timeframes?.["1h"] ?? analytics?.timeframes?.["15m"]
  if (!hour) return []

  return TAPE_ASSETS.flatMap((asset) => {
    const score =
      hour.assets?.[asset]?.weighted_sentiment ??
      hour.assets?.[asset.toLowerCase()]?.weighted_sentiment
    if (typeof score !== "number" || Number.isNaN(score)) return []
    return [
      {
        asset,
        tone: sentimentTone(score) ?? "Neutral",
        score,
      },
    ]
  })
}

function toneClass(tone: SentimentTone | null) {
  if (tone === "Positive") return "text-emerald-700/85 dark:text-emerald-300/90"
  if (tone === "Negative") return "text-red-700/85 dark:text-red-300/90"
  return "text-muted-foreground"
}

const ASSET_LABELS: Record<(typeof TAPE_ASSETS)[number], string> = {
  BTC: "Bitcoin",
  ETH: "Ethereum",
  DXY: "Dollar",
  XAU: "Gold",
}

function toneSurfaceClass(tone: SentimentTone | null, featured = false) {
  if (tone === "Positive") {
    return featured
      ? "bg-emerald-500/[0.08] dark:bg-emerald-400/[0.06]"
      : "bg-emerald-500/[0.045] dark:bg-emerald-400/[0.04]"
  }
  if (tone === "Negative") {
    return featured
      ? "bg-red-500/[0.08] dark:bg-red-400/[0.06]"
      : "bg-red-500/[0.045] dark:bg-red-400/[0.04]"
  }
  return featured ? "bg-muted/30" : "bg-muted/18"
}

function toneTileClass(tone: SentimentTone) {
  if (tone === "Positive") {
    return "bg-emerald-500/[0.07] dark:bg-emerald-400/[0.05]"
  }
  if (tone === "Negative") {
    return "bg-red-500/[0.07] dark:bg-red-400/[0.05]"
  }
  return "bg-muted/22"
}

function toneChipClass(tone: SentimentTone) {
  if (tone === "Positive") {
    return "bg-emerald-500/10 text-emerald-800/80 dark:text-emerald-200/90"
  }
  if (tone === "Negative") {
    return "bg-red-500/10 text-red-800/80 dark:text-red-200/90"
  }
  return "bg-foreground/[0.05] text-muted-foreground"
}

function toneChipLabel(tone: SentimentTone) {
  if (tone === "Positive") return "Bull"
  if (tone === "Negative") return "Bear"
  return "Flat"
}

function sentimentIntensity(score: number) {
  return Math.min(100, Math.round(Math.abs(score) * 100))
}

type TapeWindow = {
  key: (typeof TAPE_WINDOWS)[number]
  volume: number
  impact: number
}

function tapeWindows(analytics: NewsAnalytics | null): TapeWindow[] {
  const timeframes = analytics?.timeframes
  return TAPE_WINDOWS.flatMap((key) => {
    const frame = timeframes?.[key]
    if (!frame) return []
    return [{ key, volume: frame.volume, impact: frame.avg_impact }]
  })
}

function NewsTapeWindowTile({
  slot,
  variant = "cell",
}: {
  slot: TapeWindow
  variant?: "cell" | "standalone"
}) {
  return (
    <div
      className={cn(
        variant === "cell"
          ? "rounded-lg bg-background/55 px-2 py-2.5 text-center dark:bg-background/30"
          : "rounded-xl bg-muted/22 px-3 py-2.5"
      )}
    >
      <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
        {slot.key}
      </p>
      <p className="mt-1 font-mono text-xl font-semibold tabular-nums leading-none">
        {Math.round(slot.volume)}
      </p>
      <p className="mt-0.5 text-[10px] text-muted-foreground">headlines</p>
      <p className="mt-1.5 inline-flex items-center justify-center rounded-md bg-foreground/4 px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-muted-foreground">
        Impact {slot.impact.toFixed(1)}
      </p>
    </div>
  )
}

function NewsTapeWindows({
  windows,
  mobile = false,
}: {
  windows: TapeWindow[]
  mobile?: boolean
}) {
  if (windows.length === 0) return null

  if (mobile) {
    return (
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted/18 p-1">
        {windows.map((slot) => (
          <NewsTapeWindowTile key={slot.key} slot={slot} variant="cell" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {windows.map((slot) => (
        <NewsTapeWindowTile key={slot.key} slot={slot} variant="standalone" />
      ))}
    </div>
  )
}

function NewsAssetTile({ asset, tone, score }: TapeAsset) {
  return (
    <div
      className={cn(
        "flex min-w-0 gap-2 rounded-xl px-2 py-2",
        toneTileClass(tone)
      )}
    >
      <MarketAssetLogo symbol={asset} className="size-7" />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-1">
          <span className="font-mono text-xs font-bold tracking-tight">
            {asset}
          </span>
          <span
            className={cn(
              "shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold leading-none",
              toneChipClass(tone)
            )}
          >
            {toneChipLabel(tone)}
          </span>
        </div>
        <p className="mt-1 truncate text-[10px] text-muted-foreground">
          {ASSET_LABELS[asset]}
        </p>
        <p className="mt-1.5 font-mono text-[10px] tabular-nums text-muted-foreground">
          {sentimentIntensity(score)}% flow
        </p>
      </div>
    </div>
  )
}

function NewsAssetTape({
  assets,
  mobile = false,
}: {
  assets: TapeAsset[]
  mobile?: boolean
}) {
  if (assets.length === 0) return null

  return (
    <div
      className={cn(
        mobile ? "grid grid-cols-2 gap-1.5" : "grid grid-cols-2 gap-2 sm:grid-cols-4"
      )}
    >
      {assets.map((item) => (
        <NewsAssetTile key={item.asset} {...item} />
      ))}
    </div>
  )
}

function isHighImpact(item: NewsItem) {
  const score = item.metrics?.impact_score
  return typeof score === "number" && !Number.isNaN(score) && score >= 7
}

function pickLeadStory(news: NewsItem[]) {
  let leadIndex = 0
  let best = Number.NEGATIVE_INFINITY
  for (let index = 0; index < news.length; index += 1) {
    const impact = news[index]?.metrics?.impact_score
    const score =
      typeof impact === "number" && !Number.isNaN(impact)
        ? impact
        : Number.NEGATIVE_INFINITY
    if (score > best) {
      best = score
      leadIndex = index
    }
  }
  return {
    lead: news[leadIndex],
    rest: news.filter((_, index) => index !== leadIndex),
  }
}

function newsBrief(analytics: NewsAnalytics | null) {
  const summaries = analytics?.ai_summaries
  if (!summaries) return null
  const text =
    summaries.eth?.trim() ||
    summaries.macro?.trim() ||
    summaries.btc?.trim() ||
    summaries.dxy?.trim() ||
    summaries.xau?.trim()
  return text || null
}

/** Online favicon lookup from article host — not bundled or downloaded to disk. */
function newsFaviconSrc(articleUrl: string): string | null {
  try {
    const host = new URL(articleUrl).hostname
    if (!host) return null
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`
  } catch {
    return null
  }
}

function NewsSourceIcon({
  url,
  size = "lg",
}: {
  url: string
  size?: "sm" | "lg"
}) {
  const src = newsFaviconSrc(url)

  return (
    <Avatar
      size={size === "sm" ? "sm" : "lg"}
      className={cn(
        "bg-muted/70 after:border-border/50",
        size === "sm" ? "size-8" : "mt-0.5 size-10"
      )}
      aria-hidden
    >
      {src ? (
        <AvatarImage
          src={src}
          alt=""
          referrerPolicy="no-referrer"
          className={cn(
            "object-contain",
            size === "sm"
              ? "p-1.5 opacity-80 grayscale dark:invert dark:opacity-85"
              : "p-2 opacity-90"
          )}
        />
      ) : null}
      <AvatarFallback className="bg-muted-foreground/15" />
    </Avatar>
  )
}

type SpeechSnapshot = {
  speakingId: string | null
  readingAll: boolean
}

const READ_ALL_SPEECH_ID = "__read-all__"

let newsSpeechId: string | null = null
let newsSpeechReadingAll = false
let newsSpeechGeneration = 0
let newsSpeechSnapshot: SpeechSnapshot = {
  speakingId: null,
  readingAll: false,
}
const newsSpeechListeners = new Set<() => void>()

function getNewsSpeechSnapshot(): SpeechSnapshot {
  return newsSpeechSnapshot
}

function subscribeNewsSpeechStore(onStoreChange: () => void) {
  newsSpeechListeners.add(onStoreChange)
  return () => {
    newsSpeechListeners.delete(onStoreChange)
  }
}

function notifyNewsSpeech() {
  if (
    newsSpeechSnapshot.speakingId !== newsSpeechId ||
    newsSpeechSnapshot.readingAll !== newsSpeechReadingAll
  ) {
    newsSpeechSnapshot = {
      speakingId: newsSpeechId,
      readingAll: newsSpeechReadingAll,
    }
  }
  for (const listener of newsSpeechListeners) {
    listener()
  }
}

function stopNewsSpeech() {
  if (typeof window === "undefined" || !window.speechSynthesis) return
  newsSpeechGeneration += 1
  window.speechSynthesis.cancel()
  newsSpeechId = null
  newsSpeechReadingAll = false
  notifyNewsSpeech()
}

function newsSpeechText(item: NewsItem, withSource = false) {
  const parts: string[] = []
  const source = item.source?.trim()
  if (withSource && source) {
    parts.push(`From ${source}.`)
  }
  if (item.title.trim()) parts.push(item.title.trim())
  if (item.summary?.trim()) parts.push(item.summary.trim())
  return parts.join(" ")
}

function speakUtterance(
  item: NewsItem,
  text: string,
  generation: number,
  onDone: () => void
) {
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = "en-US"
  utterance.rate = 1
  utterance.onend = () => {
    if (generation !== newsSpeechGeneration) return
    onDone()
  }
  utterance.onerror = () => {
    if (generation !== newsSpeechGeneration) return
    newsSpeechId = null
    newsSpeechReadingAll = false
    notifyNewsSpeech()
  }
  newsSpeechId = item.id
  notifyNewsSpeech()
  window.speechSynthesis.speak(utterance)
}

function toggleNewsSpeech(item: NewsItem) {
  if (typeof window === "undefined" || !window.speechSynthesis) return

  if (newsSpeechId === item.id && !newsSpeechReadingAll) {
    stopNewsSpeech()
    return
  }

  const text = newsSpeechText(item)
  if (!text) return

  stopNewsSpeech()
  const generation = newsSpeechGeneration
  newsSpeechReadingAll = false
  speakUtterance(item, text, generation, () => {
    newsSpeechId = null
    newsSpeechReadingAll = false
    notifyNewsSpeech()
  })
}

function toggleReadAllNews(items: NewsItem[]) {
  if (typeof window === "undefined" || !window.speechSynthesis) return
  if (items.length === 0) return

  if (newsSpeechReadingAll) {
    stopNewsSpeech()
    return
  }

  stopNewsSpeech()
  const generation = newsSpeechGeneration
  newsSpeechReadingAll = true
  newsSpeechId = READ_ALL_SPEECH_ID
  notifyNewsSpeech()

  let index = 0
  const speakNext = () => {
    if (generation !== newsSpeechGeneration) return
    if (index >= items.length) {
      newsSpeechId = null
      newsSpeechReadingAll = false
      notifyNewsSpeech()
      return
    }
    const item = items[index]
    const text = newsSpeechText(item, true)
    index += 1
    if (!text) {
      speakNext()
      return
    }
    speakUtterance(item, text, generation, speakNext)
  }

  speakNext()
}

function NewsSpeakButton({ item }: { item: NewsItem }) {
  const supported = React.useSyncExternalStore(
    () => () => {},
    () => "speechSynthesis" in window,
    () => false
  )
  const speech = React.useSyncExternalStore(
    subscribeNewsSpeechStore,
    getNewsSpeechSnapshot,
    getNewsSpeechSnapshot
  )
  const speaking = speech.speakingId === item.id

  if (!supported) return null

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={speaking ? "Stop reading aloud" : "Listen to article"}
      aria-pressed={speaking}
      className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground"
      onClick={() => toggleNewsSpeech(item)}
    >
      {speaking ? (
        <SquareIcon className="size-3.5 fill-current" aria-hidden />
      ) : (
        <Volume2Icon className="size-4" aria-hidden />
      )}
    </Button>
  )
}

function NewsReadAllButton({ news }: { news: NewsItem[] }) {
  const supported = React.useSyncExternalStore(
    () => () => {},
    () => "speechSynthesis" in window,
    () => false
  )
  const speech = React.useSyncExternalStore(
    subscribeNewsSpeechStore,
    getNewsSpeechSnapshot,
    getNewsSpeechSnapshot
  )
  const readingAll = speech.readingAll
  const items = news.slice(0, PRIMARY_NEWS_LIMIT)

  if (!supported || items.length === 0) return null

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-pressed={readingAll}
      className="h-7 shrink-0 gap-1.5 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
      onClick={() => toggleReadAllNews(items)}
    >
      {readingAll ? (
        <SquareIcon className="size-3 fill-current" aria-hidden />
      ) : (
        <Volume2Icon className="size-3.5" aria-hidden />
      )}
      {readingAll ? "Stop" : "Read all"}
    </Button>
  )
}

function NewsTape({
  analytics,
  mobile = false,
}: {
  analytics: NewsAnalytics | null
  mobile?: boolean
}) {
  const brief = newsBrief(analytics)
  const hour = analytics?.timeframes?.["1h"] ?? analytics?.timeframes?.["15m"]
  const windows = tapeWindows(analytics)
  const assets = tapeAssets(analytics)

  if (!brief && windows.length === 0 && assets.length === 0) return null

  if (mobile) {
    return (
      <div className="flex flex-col gap-2.5">
        {(assets.length > 0 || windows.length > 0) ? (
          <div className="flex flex-col gap-2 rounded-2xl bg-muted/18 p-2">
            {assets.length > 0 ? <NewsAssetTape assets={assets} mobile /> : null}
            {windows.length > 0 ? (
              <div className="grid grid-cols-3 gap-1 rounded-xl bg-background/35 p-1 dark:bg-background/20">
                {windows.map((slot) => (
                  <NewsTapeWindowTile key={slot.key} slot={slot} variant="cell" />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
        {brief ? (
          <p className="text-sm leading-relaxed text-foreground/90">{brief}</p>
        ) : null}
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-muted/18 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
          Tape
        </p>
        {hour ? (
          <p className="text-xs text-muted-foreground">
            Last hour · {hour.volume} headlines
          </p>
        ) : null}
      </div>
      {windows.length > 0 ? (
        <div className="mt-3">
          <p className="mb-2 text-[10px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
            Headline tape
          </p>
          <NewsTapeWindows windows={windows} />
        </div>
      ) : null}
      {assets.length > 0 ? (
        <div className="mt-3">
          <p className="mb-2 text-[10px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
            Asset sentiment
          </p>
          <NewsAssetTape assets={assets} />
        </div>
      ) : null}
      {brief ? (
        <p className="mt-3 text-sm leading-relaxed text-foreground/90">
          {brief}
        </p>
      ) : null}
    </div>
  )
}

function NewsMeta({
  item,
  featured = false,
}: {
  item: NewsItem
  featured?: boolean
}) {
  const published = newsPublishedLabel(item.published_at)
  const source = item.source?.trim() || hostFromUrl(item.url)
  const tone = newsTone(item)
  const highImpact = isHighImpact(item)

  if (featured) {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="outline" className="font-medium">
          Lead
        </Badge>
        {highImpact ? (
          <Badge variant="secondary" className="font-medium">
            High impact
          </Badge>
        ) : null}
        {tone ? (
          <Badge
            variant="secondary"
            className={cn(
              "border-0 font-medium",
              tone === "Positive" &&
                "bg-emerald-500/10 text-emerald-800/85 dark:text-emerald-200/90",
              tone === "Negative" &&
                "bg-red-500/10 text-red-800/85 dark:text-red-200/90"
            )}
          >
            {tone}
          </Badge>
        ) : null}
        <span className="text-xs text-muted-foreground">
          {source}
          {published ? ` · ${published}` : ""}
        </span>
      </div>
    )
  }

  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
      <span>{source}</span>
      {published ? <span>· {published}</span> : null}
      {highImpact ? (
        <span className="font-medium text-foreground">· High impact</span>
      ) : null}
      {tone && tone !== "Neutral" ? (
        <span
          className={cn(
            "font-medium",
            tone === "Positive" && "text-emerald-600 dark:text-emerald-400",
            tone === "Negative" && "text-red-600 dark:text-red-400"
          )}
        >
          · {tone}
        </span>
      ) : null}
    </p>
  )
}

function NewsCard({
  item,
  featured = false,
  mobile = false,
  sidebar = false,
  className,
}: {
  item: NewsItem
  featured?: boolean
  mobile?: boolean
  /** Chat news sidebar — selectable body copy, title stays the link. */
  sidebar?: boolean
  className?: string
}) {
  const summary = item.summary?.trim()
  const tone = newsTone(item)

  if (mobile) {
    const published = newsPublishedLabel(item.published_at)
    const source = item.source?.trim() || hostFromUrl(item.url)

    return (
      <article
        className={cn(
          "group/news rounded-2xl",
          toneSurfaceClass(tone, featured),
          featured ? "p-4" : "p-3",
          className
        )}
      >
        <div className="flex items-start gap-3">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-w-0 flex-1 items-start gap-3"
            onClick={() =>
              trackNewsArticleClick({
                article_id: item.id,
                source: item.source ?? "unknown",
                impact_score: item.metrics.impact_score,
              })
            }
          >
            <NewsSourceIcon url={item.url} size={featured ? "lg" : "sm"} />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">
                {featured ? (
                  <span className="font-medium text-foreground">Lead · </span>
                ) : null}
                {source}
                {published ? ` · ${published}` : ""}
                {tone && tone !== "Neutral" ? (
                  <span className={cn("font-medium", toneClass(tone))}>
                    {" · "}
                    {tone}
                  </span>
                ) : null}
              </p>
              <h3
                className={cn(
                  "mt-1.5 font-semibold tracking-tight text-foreground",
                  featured
                    ? "text-base leading-snug"
                    : "line-clamp-2 text-[15px] leading-snug"
                )}
              >
                {item.title}
              </h3>
              {summary ? (
                <p
                  className={cn(
                    "mt-1.5 leading-relaxed text-muted-foreground",
                    featured ? "line-clamp-3 text-sm" : "line-clamp-2 text-[13px]"
                  )}
                >
                  {summary}
                </p>
              ) : null}
            </div>
          </a>
          <NewsSpeakButton item={item} />
        </div>
      </article>
    )
  }

  const summaryDesktop = summary
  const trackArticleClick = () =>
    trackNewsArticleClick({
      article_id: item.id,
      source: item.source ?? "unknown",
      impact_score: item.metrics.impact_score,
    })

  if (sidebar) {
    return (
      <article
        className={cn(
          "group/news flex select-text items-start gap-3 rounded-2xl transition-colors",
          featured
            ? cn(toneSurfaceClass(tone, true), "p-4 sm:p-5")
            : cn(toneSurfaceClass(tone, false), "px-2 py-3 sm:px-3"),
          className
        )}
      >
        <NewsSourceIcon url={item.url} size={featured ? "lg" : "sm"} />
        <div className="min-w-0 flex-1">
          <NewsMeta item={item} featured={featured} />
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1.5 block font-semibold tracking-tight text-foreground underline-offset-2 hover:underline"
            onClick={trackArticleClick}
          >
            <h3
              className={cn(
                featured
                  ? "text-lg leading-snug sm:text-xl"
                  : "text-[15px] leading-snug"
              )}
            >
              {item.title}
            </h3>
          </a>
          {summaryDesktop ? (
            <p
              className={cn(
                "mt-1.5 whitespace-pre-wrap leading-relaxed text-muted-foreground",
                featured ? "text-sm" : "text-[13px]"
              )}
            >
              {summaryDesktop}
            </p>
          ) : null}
        </div>
        <div className="shrink-0">
          <NewsSpeakButton item={item} />
        </div>
      </article>
    )
  }

  return (
    <div
      className={cn(
        "group/news flex items-start gap-3 rounded-2xl transition-colors",
        featured
          ? cn(toneSurfaceClass(tone, true), "p-4 hover:brightness-[1.02] sm:p-5")
          : cn(
              toneSurfaceClass(tone, false),
              "px-2 py-3 hover:brightness-[1.02] sm:px-3"
            ),
        className
      )}
    >
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-w-0 flex-1 items-start gap-3"
        onClick={trackArticleClick}
      >
        <NewsSourceIcon url={item.url} size={featured ? "lg" : "sm"} />
        <div className="min-w-0 flex-1">
          <NewsMeta item={item} featured={featured} />
          <h3
            className={cn(
              "mt-1.5 font-semibold tracking-tight text-foreground",
              featured
                ? "text-lg leading-snug sm:text-xl"
                : "line-clamp-2 text-[15px] leading-snug"
            )}
          >
            {item.title}
          </h3>
          {summaryDesktop ? (
            <p
              className={cn(
                "mt-1.5 leading-relaxed text-muted-foreground",
                featured
                  ? "line-clamp-3 text-sm"
                  : "line-clamp-2 text-[13px]"
              )}
            >
              {summaryDesktop}
            </p>
          ) : null}
        </div>
      </a>
      <div
        className={cn(
          featured
            ? "shrink-0"
            : "shrink-0 sm:opacity-0 sm:transition-opacity sm:group-hover/news:opacity-100 sm:group-focus-within/news:opacity-100"
        )}
      >
        <NewsSpeakButton item={item} />
      </div>
    </div>
  )
}

function NewsHeadlineList({
  news,
  analytics,
  loading = false,
  mobile = false,
  sidebar = false,
  isAuthenticated = true,
  authLoading = false,
}: {
  news: NewsItem[]
  analytics: NewsAnalytics | null
  loading?: boolean
  mobile?: boolean
  sidebar?: boolean
  isAuthenticated?: boolean
  authLoading?: boolean
}) {
  if (loading && news.length === 0) {
    return <NewsBulletinSkeleton />
  }

  if (
    shouldShowWorkspaceLoginGate("news", {
      isAuthenticated,
      authLoading,
      dataReady: !loading,
      hasData: news.length > 0,
    })
  ) {
    return <WorkspaceLoginGate page="news" />
  }

  if (news.length === 0) {
    return (
      <Empty className="min-h-48 rounded-2xl bg-muted/18">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <NewspaperIcon />
          </EmptyMedia>
          <EmptyTitle>No headlines yet</EmptyTitle>
          <EmptyDescription>
            The tape updates with the next market cycle.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  const { lead, rest } = pickLeadStory(news)

  return (
    <div className={cn("flex flex-col", mobile ? "gap-3" : "gap-5 pb-2")}>
      {mobile ? (
        <div className="flex justify-end px-1">
          <NewsReadAllButton news={news} />
        </div>
      ) : null}
      <NewsTape analytics={analytics} mobile={mobile} />
      <NewsCard item={lead} featured mobile={mobile} sidebar={sidebar} />
      {rest.length > 0 ? (
        mobile ? (
          <div className="flex flex-col gap-2">
            {rest.map((item) => (
              <NewsCard key={item.id} item={item} mobile sidebar={sidebar} />
            ))}
          </div>
        ) : (
          <div>
            <div className="mb-1 flex items-center gap-2 px-1">
              <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                Latest
              </p>
              <Separator className="flex-1" />
            </div>
            <div className="flex flex-col gap-2">
              {rest.map((item) => (
                <NewsCard key={item.id} item={item} sidebar={sidebar} />
              ))}
            </div>
          </div>
        )
      ) : null}
    </div>
  )
}

function NewsBulletin({
  analytics,
  news,
  loading = false,
  className,
  freshnessLabel,
  embedded = false,
  active = true,
  mobile = false,
  sidebar = false,
  isAuthenticated = true,
  authLoading = false,
}: {
  analytics: NewsAnalytics | null
  news: NewsItem[]
  loading?: boolean
  className?: string
  /** Factual payload age — never auth-inferred Live/6h. */
  freshnessLabel: string
  /** When true, omit outer Card / duplicate News title (tab workspace). */
  embedded?: boolean
  /** Chat news sidebar — full scroll + text selection. */
  sidebar?: boolean
  /** False when the News tab is hidden — stop read-aloud. */
  active?: boolean
  mobile?: boolean
  isAuthenticated?: boolean
  authLoading?: boolean
}) {
  const primaryNews = news.slice(0, PRIMARY_NEWS_LIMIT)

  React.useEffect(() => {
    if (!active) stopNewsSpeech()
  }, [active])

  const body = (
    <div
      className={cn(
        "flex min-w-0 flex-col",
        !embedded && "min-h-0 flex-1",
        embedded ? "pt-0" : undefined
      )}
    >
      <NewsHeadlineList
        news={primaryNews}
        analytics={analytics}
        loading={loading}
        mobile={mobile}
        sidebar={sidebar}
        isAuthenticated={isAuthenticated}
        authLoading={authLoading}
      />
    </div>
  )

  if (embedded) {
    return (
      <div
        className={cn("min-w-0", className)}
        data-slot="news"
      >
        {body}
      </div>
    )
  }

  return (
    <Card
      className={cn(
        "flex h-full min-h-0 min-w-0 flex-col overflow-hidden",
        className
      )}
      data-slot="news"
    >
      <CardHeader className="flex shrink-0 flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold tracking-tight">
          News
        </CardTitle>
        <Badge variant="secondary" className="font-mono text-xs font-normal">
          {freshnessLabel}
        </Badge>
      </CardHeader>
      <CardContent className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden pt-0">
        {body}
      </CardContent>
    </Card>
  )
}

export { NewsBulletin, NewsReadAllButton }
