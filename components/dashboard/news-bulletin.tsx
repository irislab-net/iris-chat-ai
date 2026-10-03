"use client"

import * as React from "react"
import {
  CheckIcon,
  CopyIcon,
  EyeIcon,
  FlameIcon,
  NewspaperIcon,
  SparklesIcon,
  SquareIcon,
  Volume2Icon,
} from "lucide-react"
import { useTranslations } from "next-intl"

import { ActionTooltip } from "@/components/ui/action-tooltip"
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
import { MarketAssetLogo } from "@/components/dashboard/market-asset-logo"
import {
  chatMobileHeaderButtonClass,
  chatNewsGlassCardClass,
  chatNewsGlassChipClass,
  chatNewsGlassTileClass,
  chatNewsReadAllButtonClass,
  chatSignalCardIconShellClass,
  chatSignalCardLongWashClass,
  chatSignalCardShortWashClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
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
  const hour = analytics?.timeframes?.["1h"] ?? analytics?.timeframes?.["15m"]
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

/** Sentiment wash on the shared signal/no-trade glass plate. */
function newsToneWashClass(tone: SentimentTone | null) {
  if (tone === "Positive") return chatSignalCardLongWashClass
  if (tone === "Negative") return chatSignalCardShortWashClass
  return newsNeutralWashClass
}

function newsToneChipClass(tone: SentimentTone | null) {
  if (!tone) {
    return "inline-flex items-center gap-1 rounded-full border-0 bg-foreground/[0.08] px-2.5 py-1 text-[11px] font-medium tracking-[0.03em] text-muted-foreground shadow-none dark:bg-white/[0.12]"
  }
  return newsToneFilledChipClass(tone)
}

/** Neutral corner bloom when sentiment is flat / unknown. */
const newsNeutralWashClass =
  "before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] before:bg-[radial-gradient(120%_80%_at_0%_0%,rgba(37,99,235,0.08),transparent_55%),radial-gradient(90%_60%_at_100%_0%,rgba(148,163,184,0.08),transparent_50%),linear-gradient(180deg,rgba(255,255,255,0.55)_0%,transparent_42%)] before:content-[''] dark:before:bg-[radial-gradient(120%_80%_at_0%_0%,rgba(96,165,250,0.1),transparent_55%),radial-gradient(90%_60%_at_100%_0%,rgba(148,163,184,0.08),transparent_50%),linear-gradient(180deg,rgba(255,255,255,0.06)_0%,transparent_40%)]"

/** Liquid-glass fill tinted by sentiment — tape tiles only. */
function toneGlassFillClass(tone: SentimentTone | null, featured = false) {
  if (tone === "Positive") {
    return featured
      ? "bg-emerald-500/18 supports-[backdrop-filter]:bg-emerald-500/14 dark:bg-emerald-400/16 dark:supports-[backdrop-filter]:bg-emerald-400/12"
      : "bg-emerald-500/14 supports-[backdrop-filter]:bg-emerald-500/11 dark:bg-emerald-400/13 dark:supports-[backdrop-filter]:bg-emerald-400/10"
  }
  if (tone === "Negative") {
    return featured
      ? "bg-red-500/18 supports-[backdrop-filter]:bg-red-500/14 dark:bg-red-400/16 dark:supports-[backdrop-filter]:bg-red-400/12"
      : "bg-red-500/14 supports-[backdrop-filter]:bg-red-500/11 dark:bg-red-400/13 dark:supports-[backdrop-filter]:bg-red-400/10"
  }
  return "bg-foreground/[0.035] supports-[backdrop-filter]:bg-foreground/[0.028] dark:bg-white/[0.06] dark:supports-[backdrop-filter]:bg-white/[0.045]"
}

const newsGlassTileShellClass =
  "rounded-xl border-0 shadow-none backdrop-blur-md backdrop-saturate-150"

function newsToneFilledChipClass(tone: SentimentTone) {
  if (tone === "Positive") {
    return "inline-flex items-center gap-1 rounded-full border-0 bg-emerald-500/16 px-2.5 py-1 text-[11px] font-medium tracking-[0.03em] text-emerald-700 shadow-none dark:bg-emerald-400/18 dark:text-emerald-300"
  }
  if (tone === "Negative") {
    return "inline-flex items-center gap-1 rounded-full border-0 bg-rose-500/16 px-2.5 py-1 text-[11px] font-medium tracking-[0.03em] text-rose-700 shadow-none dark:bg-rose-400/18 dark:text-rose-300"
  }
  return "inline-flex items-center gap-1 rounded-full border-0 bg-foreground/[0.08] px-2.5 py-1 text-[11px] font-medium tracking-[0.03em] text-muted-foreground shadow-none dark:bg-white/[0.12]"
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
  glass = false,
}: {
  slot: TapeWindow
  variant?: "cell" | "standalone"
  glass?: boolean
}) {
  return (
    <div
      className={cn(
        glass
          ? cn(
              chatNewsGlassTileClass,
              "px-2 py-2.5 text-center",
              variant === "standalone" && "px-3"
            )
          : variant === "cell"
            ? "rounded-lg bg-background/55 px-2 py-2.5 text-center dark:bg-background/30"
            : "rounded-xl bg-muted/22 px-3 py-2.5"
      )}
    >
      <p className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
        {slot.key}
      </p>
      <p className="mt-1 font-mono text-xl leading-none font-semibold tabular-nums">
        {Math.round(slot.volume)}
      </p>
      <p className="mt-0.5 text-[10px] text-muted-foreground">headlines</p>
      <p
        className={cn(
          "mt-1.5 inline-flex items-center justify-center px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground tabular-nums",
          glass
            ? cn(chatNewsGlassChipClass, "rounded-md px-1.5 py-0.5 text-[10px]")
            : "rounded-md bg-foreground/4"
        )}
      >
        Impact {slot.impact.toFixed(1)}
      </p>
    </div>
  )
}

function NewsTapeWindows({
  windows,
  mobile = false,
  glass = false,
}: {
  windows: TapeWindow[]
  mobile?: boolean
  glass?: boolean
}) {
  if (windows.length === 0) return null

  if (glass) {
    return (
      <div className="grid grid-cols-3 gap-2.5">
        {windows.map((slot) => (
          <NewsTapeWindowTile key={slot.key} slot={slot} variant="cell" glass />
        ))}
      </div>
    )
  }

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

function NewsAssetTile({
  asset,
  tone,
  score,
  glass = false,
}: TapeAsset & { glass?: boolean }) {
  return (
    <div
      className={cn(
        "min-w-0 px-2 py-2",
        glass
          ? cn(
              newsGlassTileShellClass,
              "rounded-2xl px-2.5 py-2.5",
              toneGlassFillClass(tone)
            )
          : cn("rounded-xl", toneTileClass(tone))
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <MarketAssetLogo symbol={asset} className="size-7 shrink-0" />
          <div className="min-w-0">
            <span className="block font-mono text-xs font-bold tracking-tight">
              {asset}
            </span>
            <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">
              {ASSET_LABELS[asset]}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span
            className={cn(
              newsToneFilledChipClass(tone),
              "px-1.5 py-0.5 text-[9px] leading-none font-semibold"
            )}
          >
            {toneChipLabel(tone)}
          </span>
          <p className="font-mono text-[10px] text-muted-foreground tabular-nums">
            {sentimentIntensity(score)}% flow
          </p>
        </div>
      </div>
    </div>
  )
}

function NewsAssetTape({
  assets,
  mobile = false,
  glass = false,
}: {
  assets: TapeAsset[]
  mobile?: boolean
  glass?: boolean
}) {
  if (assets.length === 0) return null

  return (
    <div
      className={cn(
        mobile || glass
          ? "grid grid-cols-2 gap-2.5"
          : "grid grid-cols-2 gap-2 sm:grid-cols-4"
      )}
    >
      {assets.map((item) => (
        <NewsAssetTile key={item.asset} {...item} glass={glass} />
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

type NewsBriefKind = "eth" | "macro" | "btc" | "dxy" | "xau"

const NEWS_BRIEF_ORDER: NewsBriefKind[] = ["eth", "macro", "btc", "dxy", "xau"]

function newsBriefMeta(analytics: NewsAnalytics | null): {
  kind: NewsBriefKind
  text: string
} | null {
  const summaries = analytics?.ai_summaries
  if (!summaries) return null
  for (const kind of NEWS_BRIEF_ORDER) {
    const text = summaries[kind]?.trim()
    if (text) return { kind, text }
  }
  return null
}

/** Hot flame mark for the AI brief card. */
function NewsBriefIcon() {
  return (
    <span
      className={cn(
        chatSignalCardIconShellClass,
        "news-brief-flame-shell size-11 shrink-0"
      )}
      aria-hidden
    >
      <FlameIcon
        className="news-brief-flame size-5 fill-orange-500/35 text-orange-500 dark:fill-orange-400/30 dark:text-orange-400"
        strokeWidth={1.75}
      />
    </span>
  )
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
  glass = false,
}: {
  url: string
  size?: "sm" | "lg" | "header" | "lead"
  glass?: boolean
}) {
  const src = newsFaviconSrc(url)
  const dim =
    size === "header"
      ? "size-5"
      : size === "lead"
        ? "size-7"
        : size === "sm"
          ? "size-8"
          : "mt-0.5 size-10"

  return (
    <Avatar
      size={size === "lg" || size === "lead" ? "lg" : "sm"}
      className={cn(
        "shrink-0",
        glass
          ? cn(chatSignalCardIconShellClass, "after:border-0", dim)
          : cn("bg-muted/70 after:border-border/50", dim)
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
            size === "header"
              ? "p-0.5 opacity-90"
              : size === "lead"
                ? "p-1 opacity-95"
                : size === "sm"
                  ? "p-1.5 opacity-80 grayscale dark:opacity-85 dark:invert"
                  : "p-2 opacity-90"
          )}
        />
      ) : null}
      <AvatarFallback
        className={glass ? "bg-transparent" : "bg-muted-foreground/15"}
      />
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

function newsCopyText(item: NewsItem) {
  const parts: string[] = []
  if (item.title.trim()) parts.push(item.title.trim())
  if (item.summary?.trim()) parts.push(item.summary.trim())
  const source = item.source?.trim() || hostFromUrl(item.url)
  const meta = [source, item.url.trim()].filter(Boolean).join("\n")
  if (meta) parts.push(meta)
  return parts.join("\n\n")
}

function newsFooterActionButtonClass(glass: boolean) {
  return cn(
    "shrink-0",
    glass
      ? "size-8 rounded-full text-muted-foreground hover:bg-white/50 hover:text-foreground dark:hover:bg-white/8"
      : "text-muted-foreground hover:text-foreground"
  )
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

function NewsSpeakButton({
  item,
  glass = false,
}: {
  item: NewsItem
  glass?: boolean
}) {
  const t = useTranslations("dashboard")
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
      aria-label={speaking ? t("stopReadingAloud") : t("listenToArticle")}
      aria-pressed={speaking}
      className={newsFooterActionButtonClass(glass)}
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

function NewsCopyButton({
  item,
  glass = false,
}: {
  item: NewsItem
  glass?: boolean
}) {
  const t = useTranslations("dashboard")
  const [copied, setCopied] = React.useState(false)
  const copyTimerRef = React.useRef(0)

  React.useEffect(() => {
    return () => window.clearTimeout(copyTimerRef.current)
  }, [])

  async function onCopy(event: React.MouseEvent) {
    event.preventDefault()
    event.stopPropagation()
    const text = newsCopyText(item)
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.clearTimeout(copyTimerRef.current)
      copyTimerRef.current = window.setTimeout(() => setCopied(false), 1_600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <ActionTooltip label={copied ? t("copied") : t("copyArticle")}>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={copied ? t("copied") : t("copyArticle")}
        className={newsFooterActionButtonClass(glass)}
        onClick={onCopy}
      >
        {copied ? (
          <CheckIcon
            className="size-4 text-emerald-600 dark:text-emerald-400"
            aria-hidden
          />
        ) : (
          <CopyIcon className="size-4" aria-hidden />
        )}
      </Button>
    </ActionTooltip>
  )
}

function NewsAnalyzeButton({
  item,
  glass = false,
  onAnalyze,
}: {
  item: NewsItem
  glass?: boolean
  onAnalyze: (item: NewsItem) => void
}) {
  const t = useTranslations("dashboard")

  return (
    <ActionTooltip label={t("analyzeArticle")}>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={t("analyzeArticle")}
        className={newsFooterActionButtonClass(glass)}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          onAnalyze(item)
        }}
      >
        <SparklesIcon className="size-4" aria-hidden />
      </Button>
    </ActionTooltip>
  )
}

function NewsSourceButton({
  item,
  glass = false,
}: {
  item: NewsItem
  glass?: boolean
}) {
  const t = useTranslations("dashboard")
  const href = item.url?.trim()
  if (!href) return null

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      nativeButton={false}
      aria-label={t("openOriginalArticle")}
      className={newsFooterActionButtonClass(glass)}
      render={
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            trackNewsArticleClick({
              article_id: item.id,
              source: item.source ?? "unknown",
              impact_score: item.metrics.impact_score,
            })
          }
        />
      }
    >
      <EyeIcon className="size-4" aria-hidden />
    </Button>
  )
}

function NewsCardFooter({
  item,
  glass = false,
  showTone = true,
  hideMeta = false,
  className,
  onAnalyzeNews,
}: {
  item: NewsItem
  glass?: boolean
  showTone?: boolean
  hideMeta?: boolean
  className?: string
  onAnalyzeNews?: (item: NewsItem) => void
}) {
  const published = newsPublishedLabel(item.published_at)
  const source = item.source?.trim() || hostFromUrl(item.url)
  const tone = newsTone(item)

  return (
    <div
      className={cn(
        "flex items-center gap-2",
        hideMeta ? "justify-end" : "justify-between",
        !className && "mt-3",
        className
      )}
    >
      {hideMeta ? null : (
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          <p className="min-w-0 truncate text-xs text-muted-foreground">
            <span>{source}</span>
            {published ? <span> · {published}</span> : null}
          </p>
          {showTone && tone && tone !== "Neutral" ? (
            <span
              className={cn(
                "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] leading-none font-semibold tracking-wide",
                tone === "Positive" &&
                  "bg-emerald-500/15 text-emerald-800/90 dark:bg-emerald-400/15 dark:text-emerald-200/90",
                tone === "Negative" &&
                  "bg-red-500/15 text-red-800/90 dark:bg-red-400/15 dark:text-red-200/90"
              )}
            >
              {tone}
            </span>
          ) : null}
        </div>
      )}
      <div className="flex shrink-0 items-center gap-0.5">
        {onAnalyzeNews ? (
          <NewsAnalyzeButton
            item={item}
            glass={glass}
            onAnalyze={onAnalyzeNews}
          />
        ) : null}
        <NewsCopyButton item={item} glass={glass} />
        <NewsSourceButton item={item} glass={glass} />
        <NewsSpeakButton item={item} glass={glass} />
      </div>
    </div>
  )
}

function NewsReadAllButton({
  news,
  glass = false,
  iconOnly = false,
  className,
}: {
  news: NewsItem[]
  glass?: boolean
  iconOnly?: boolean
  className?: string
}) {
  const t = useTranslations("dashboard")
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
  const label = readingAll ? t("stop") : t("readAll")

  if (!supported || items.length === 0) return null

  return (
    <Button
      type="button"
      variant="ghost"
      size={iconOnly ? "icon" : "sm"}
      aria-pressed={readingAll}
      aria-label={label}
      className={cn(
        iconOnly
          ? chatMobileHeaderButtonClass
          : glass
            ? chatNewsReadAllButtonClass
            : "h-7 shrink-0 gap-1.5 px-2 text-xs font-medium text-muted-foreground hover:text-foreground",
        className
      )}
      onClick={() => toggleReadAllNews(items)}
    >
      {readingAll ? (
        <SquareIcon
          className={iconOnly ? undefined : "size-3 fill-current"}
          aria-hidden
        />
      ) : (
        <Volume2Icon
          className={iconOnly ? undefined : "size-3.5"}
          aria-hidden
        />
      )}
      {iconOnly ? null : label}
    </Button>
  )
}

function NewsSectionHeading({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <p
      className={cn(
        "mb-2.5 px-0.5 text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase",
        className
      )}
    >
      {children}
    </p>
  )
}

function NewsTape({
  analytics,
  mobile = false,
  glass = false,
}: {
  analytics: NewsAnalytics | null
  mobile?: boolean
  glass?: boolean
}) {
  const t = useTranslations("dashboard")
  const brief = newsBriefMeta(analytics)
  const briefTitle = brief ? t(`briefTitles.${brief.kind}`) : null
  const hour = analytics?.timeframes?.["1h"] ?? analytics?.timeframes?.["15m"]
  const windows = tapeWindows(analytics)
  const assets = tapeAssets(analytics)

  if (!brief && windows.length === 0 && assets.length === 0) return null

  if (mobile || glass) {
    return (
      <div className="flex flex-col gap-10">
        {glass ? (
          <>
            {assets.length > 0 ? (
              <NewsAssetTape assets={assets} mobile glass />
            ) : null}
            {windows.length > 0 ? (
              <NewsTapeWindows windows={windows} mobile glass />
            ) : null}
          </>
        ) : assets.length > 0 || windows.length > 0 ? (
          <div className="flex flex-col gap-2 rounded-2xl bg-muted/18 p-2">
            {assets.length > 0 ? (
              <NewsAssetTape assets={assets} mobile />
            ) : null}
            {windows.length > 0 ? (
              <div className="grid grid-cols-3 gap-1 rounded-xl bg-background/35 p-1 dark:bg-background/20">
                {windows.map((slot) => (
                  <NewsTapeWindowTile
                    key={slot.key}
                    slot={slot}
                    variant="cell"
                  />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
        {brief && briefTitle ? (
          glass ? (
            <article
              className={cn(chatNewsGlassCardClass, newsNeutralWashClass)}
            >
              <div className="flex flex-col gap-3 px-4 py-4">
                <div className="flex items-center gap-3">
                  <NewsBriefIcon />
                  <h3 className="min-w-0 truncate text-[15px] font-medium tracking-tight text-foreground">
                    {briefTitle}
                  </h3>
                </div>
                <p
                  dir="auto"
                  className="text-[13px] leading-relaxed text-foreground/85"
                >
                  {brief.text}
                </p>
              </div>
            </article>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2.5">
                <NewsBriefIcon />
                <h3 className="text-[15px] font-medium tracking-tight text-foreground">
                  {briefTitle}
                </h3>
              </div>
              <p className="text-sm leading-relaxed text-foreground/90">
                {brief.text}
              </p>
            </div>
          )
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
            {t("headlineTape")}
          </p>
          <NewsTapeWindows windows={windows} />
        </div>
      ) : null}
      {assets.length > 0 ? (
        <div className="mt-3">
          <p className="mb-2 text-[10px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
            {t("assetSentiment")}
          </p>
          <NewsAssetTape assets={assets} />
        </div>
      ) : null}
      {brief && briefTitle ? (
        <div className="mt-3 flex flex-col gap-2">
          <div className="flex items-center gap-2.5">
            <NewsBriefIcon />
            <h3 className="text-sm font-medium tracking-tight text-foreground">
              {briefTitle}
            </h3>
          </div>
          <p className="text-sm leading-relaxed text-foreground/90">
            {brief.text}
          </p>
        </div>
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
  onAnalyzeNews,
}: {
  item: NewsItem
  featured?: boolean
  mobile?: boolean
  /** Chat news sidebar — selectable body copy, title stays the link. */
  sidebar?: boolean
  className?: string
  onAnalyzeNews?: (item: NewsItem) => void
}) {
  const summary = item.summary?.trim()
  const tone = newsTone(item)
  const glass = mobile
  const chipLabel = featured ? "Lead" : tone ? toneChipLabel(tone) : null
  const chipClass = tone
    ? newsToneChipClass(tone)
    : chatNewsGlassChipClass

  const trackArticleClick = () =>
    trackNewsArticleClick({
      article_id: item.id,
      source: item.source ?? "unknown",
      impact_score: item.metrics.impact_score,
    })

  if (mobile) {
    return (
      <article
        className={cn(
          "group/news mt-0",
          chatNewsGlassCardClass,
          newsToneWashClass(tone),
          className
        )}
      >
        <header className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-w-0 items-start gap-2.5"
            onClick={trackArticleClick}
          >
            <NewsSourceIcon
              url={item.url}
              size={featured ? "lead" : "header"}
              glass
            />
            <div className="min-w-0">
              <h3
                className={cn(
                  "font-semibold tracking-[-0.03em] text-foreground",
                  featured
                    ? "text-[1.05rem] leading-snug sm:text-lg"
                    : "line-clamp-2 text-[15px] leading-snug"
                )}
              >
                {item.title}
              </h3>
            </div>
          </a>
          {chipLabel ? (
            <span
              className={cn(chipClass, "shrink-0 uppercase")}
            >
              {chipLabel}
            </span>
          ) : null}
        </header>

        <div className="px-4 pb-4">
          {summary ? (
            <p
              dir="auto"
              className={cn(
                "leading-relaxed text-foreground/85",
                featured
                  ? "line-clamp-4 text-[13px] sm:text-sm"
                  : "line-clamp-2 text-[13px]"
              )}
            >
              {summary}
            </p>
          ) : null}
          <NewsCardFooter
            item={item}
            glass={glass}
            showTone={false}
            className={summary ? "mt-3" : "mt-0"}
            onAnalyzeNews={onAnalyzeNews}
          />
        </div>
      </article>
    )
  }

  const summaryDesktop = summary

  if (sidebar) {
    return (
      <article
        className={cn(
          "group/news flex flex-col rounded-2xl transition-colors select-text",
          featured
            ? cn(toneSurfaceClass(tone, true), "p-4 sm:p-5")
            : cn(toneSurfaceClass(tone, false), "px-2 py-3 sm:px-3"),
          className
        )}
      >
        {featured ? (
          <span
            className={cn(
              "mb-2 w-fit rounded-md bg-foreground/6 px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.08em] text-foreground uppercase"
            )}
          >
            Lead
          </span>
        ) : null}
        <div className={cn("flex items-start", featured ? "gap-2.5" : "gap-2")}>
          <NewsSourceIcon
            url={item.url}
            size={featured ? "lead" : "header"}
            glass={glass}
          />
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-0 flex-1 font-semibold tracking-tight text-foreground underline-offset-2 hover:underline"
            onClick={trackArticleClick}
          >
            <h3
              className={cn(
                featured
                  ? "text-lg leading-snug tracking-[-0.015em] sm:text-xl"
                  : "text-[15px] leading-snug"
              )}
            >
              {item.title}
            </h3>
          </a>
        </div>
        {summaryDesktop ? (
          <p
            className={cn(
              "mt-1.5 leading-relaxed whitespace-pre-wrap text-muted-foreground",
              featured ? "text-sm" : "text-[13px]"
            )}
          >
            {summaryDesktop}
          </p>
        ) : null}
        <NewsCardFooter
          item={item}
          glass={glass}
          onAnalyzeNews={onAnalyzeNews}
        />
      </article>
    )
  }

  return (
    <div
      className={cn(
        "group/news flex items-start gap-3 rounded-2xl transition-colors",
        featured
          ? cn(
              toneSurfaceClass(tone, true),
              "p-4 hover:brightness-[1.02] sm:p-5"
            )
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
                featured ? "line-clamp-3 text-sm" : "line-clamp-2 text-[13px]"
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
            : "shrink-0 sm:opacity-0 sm:transition-opacity sm:group-focus-within/news:opacity-100 sm:group-hover/news:opacity-100"
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
  onAnalyzeNews,
}: {
  news: NewsItem[]
  analytics: NewsAnalytics | null
  loading?: boolean
  mobile?: boolean
  sidebar?: boolean
  onAnalyzeNews?: (item: NewsItem) => void
}) {
  const t = useTranslations("dashboard")

  if (loading && news.length === 0) {
    return <NewsBulletinSkeleton sidebar={sidebar} />
  }

  if (news.length === 0) {
    return (
      <Empty
        className={cn(
          "min-h-48 rounded-2xl",
          mobile || sidebar ? chatNewsGlassCardClass : "bg-muted/18"
        )}
      >
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <NewspaperIcon />
          </EmptyMedia>
          <EmptyTitle>{t("noHeadlinesYet")}</EmptyTitle>
          <EmptyDescription>{t("noHeadlinesHint")}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  const { lead, rest } = pickLeadStory(news)
  const glass = mobile || sidebar

  return (
    <div className={cn("flex flex-col", glass ? "gap-10" : "gap-5 pb-2")}>
      {mobile && !sidebar ? (
        <div className="flex justify-end px-1">
          <NewsReadAllButton news={news} glass={glass} />
        </div>
      ) : null}
      <NewsTape analytics={analytics} mobile={mobile || sidebar} glass={glass} />
      <NewsCard
        item={lead}
        featured
        mobile={mobile || sidebar}
        sidebar={sidebar}
        onAnalyzeNews={onAnalyzeNews}
      />
      {rest.length > 0 ? (
        glass ? (
          <section>
            <NewsSectionHeading>{t("latest")}</NewsSectionHeading>
            <div className="flex flex-col gap-6">
              {rest.map((item) => (
                <NewsCard
                  key={item.id}
                  item={item}
                  mobile={mobile || sidebar}
                  sidebar={sidebar}
                  onAnalyzeNews={onAnalyzeNews}
                />
              ))}
            </div>
          </section>
        ) : (
          <div>
            <div className="mb-1 flex items-center gap-2 px-1">
              <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                {t("latest")}
              </p>
              <Separator className="flex-1" />
            </div>
            <div className="flex flex-col gap-2">
              {rest.map((item) => (
                <NewsCard
                  key={item.id}
                  item={item}
                  sidebar={sidebar}
                  onAnalyzeNews={onAnalyzeNews}
                />
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
  onAnalyzeNews,
}: {
  analytics: NewsAnalytics | null
  news: NewsItem[]
  loading?: boolean
  className?: string
  /** Factual payload age — never auth-inferred Live/6h. */
  freshnessLabel: string
  /** When true, omit outer Card / duplicate News title. */
  embedded?: boolean
  /** Chat news sidebar — full scroll + text selection. */
  sidebar?: boolean
  /** False when the News panel is hidden — stop read-aloud. */
  active?: boolean
  mobile?: boolean
  /** Chat desk: sparkle control that pre-fills + sends an analyze prompt. */
  onAnalyzeNews?: (item: NewsItem) => void
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
        onAnalyzeNews={onAnalyzeNews}
      />
    </div>
  )

  if (embedded) {
    return (
      <div className={cn("min-w-0", className)} data-slot="news">
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
