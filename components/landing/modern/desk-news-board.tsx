"use client"

import { useTranslations } from "next-intl"
import { type ReactNode, type Ref } from "react"

import {
  DESK_NEWS_META,
  DESK_NEWS_VISIBLE,
  type DeskNewsItem,
} from "@/lib/landing-modern-data"
import {
  landingGlassOrb,
  landingGlassSheen,
  landingGlassSurface,
  landingTitleCard,
} from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

export function initialDeskBoard(): DeskNewsItem[] {
  return [...DESK_NEWS_META]
    .slice(0, DESK_NEWS_VISIBLE)
    .sort((a, b) => b.impact - a.impact)
}

function sourceInitial(source: string) {
  const letter = source.trim().charAt(0)
  return letter ? letter.toUpperCase() : "·"
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

/** Compact liquid-glass pill for Lead / impact chips. */
function DeskGlassChip({
  children,
  className,
  title,
  "aria-label": ariaLabel,
}: {
  children: ReactNode
  className?: string
  title?: string
  "aria-label"?: string
}) {
  return (
    <span
      title={title}
      aria-label={ariaLabel}
      className={cn(
        landingGlassSurface,
        "inline-flex h-5 shrink-0 items-center justify-center rounded-full bg-white/52 px-2 text-[11px] font-medium whitespace-nowrap shadow-[0_8px_22px_rgba(15,23,42,0.06),inset_0_1px_1px_rgba(255,255,255,0.96),inset_0_-1px_2px_rgba(255,255,255,0.3)] dark:bg-white/10 dark:shadow-[0_8px_22px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.12),inset_0_-1px_2px_rgba(255,255,255,0.04)]",
        className
      )}
    >
      <GlassSheen className="rounded-full" />
      <span className="relative z-10">{children}</span>
    </span>
  )
}

/** Brand-blue corner bloom — lead row only. */
const deskLeadBlueWashClass =
  "before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:bg-[radial-gradient(120%_80%_at_0%_0%,rgba(37,99,235,0.14),transparent_55%),radial-gradient(90%_60%_at_100%_0%,rgba(37,99,235,0.08),transparent_50%),linear-gradient(180deg,rgba(255,255,255,0.5)_0%,transparent_42%)] before:content-[''] dark:before:bg-[radial-gradient(120%_80%_at_0%_0%,rgba(96,165,250,0.18),transparent_55%),radial-gradient(90%_60%_at_100%_0%,rgba(96,165,250,0.1),transparent_50%),linear-gradient(180deg,rgba(255,255,255,0.06)_0%,transparent_40%)]"

export function DeskNewsRow({
  item,
  featured,
  shifting,
  leadLabel,
  impactLabel,
  source,
  time,
  headline,
}: {
  item: DeskNewsItem
  featured?: boolean
  shifting?: boolean
  leadLabel: string
  impactLabel: string
  source: string
  time: string
  headline: string
}) {
  return (
    <li
      data-desk-row
      data-flip-id={item.id}
      className={cn(
        "relative isolate flex items-start gap-3 overflow-hidden px-5 will-change-transform sm:gap-3.5 sm:px-8",
        shifting
          ? "transition-none"
          : "transition-[padding] duration-500 ease-out",
        featured ? "py-5 sm:py-6" : "py-3.5 sm:py-4",
        featured && deskLeadBlueWashClass
      )}
    >
      <span
        aria-hidden
        className={cn(
          landingGlassOrb,
          "mt-0.5 shrink-0 text-[11px] font-medium text-foreground/70",
          featured ? "size-8" : "size-6 text-[10px]",
          shifting ? "transition-none" : "transition-[width,height] duration-500"
        )}
      >
        <GlassSheen className="rounded-full" />
        <span className="relative z-10">{sourceInitial(source)}</span>
      </span>

      <div className="relative z-10 min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5 px-0.5">
          {featured ? (
            <DeskGlassChip className="text-foreground/80">
              {leadLabel}
            </DeskGlassChip>
          ) : null}
          <span className="text-xs text-muted-foreground">
            {source}
            <span className="mx-1.5 text-muted-foreground/40" aria-hidden>
              ·
            </span>
            {time}
          </span>
        </div>
        <h3
          className={cn(
            "mt-1.5 text-start tracking-tight",
            shifting
              ? "transition-none"
              : "transition-[font-size,color,letter-spacing,line-height] duration-500 ease-out",
            featured
              ? cn(landingTitleCard, "font-medium text-foreground sm:text-xl")
              : "line-clamp-2 text-[15px] leading-snug font-medium text-foreground/80"
          )}
        >
          {headline}
        </h3>
      </div>

      <DeskGlassChip
        className={cn(
          "mt-0.5 font-(family-name:--font-mono-modern) tabular-nums",
          featured ? "text-foreground" : "text-muted-foreground"
        )}
        title={impactLabel}
        aria-label={`${impactLabel} ${item.impact}`}
      >
        {item.impact}
      </DeskGlassChip>
    </li>
  )
}

export type DeskNewsCopy = {
  source: string
  time: string
  headline: string
}

type DeskNewsBoardProps = {
  board: DeskNewsItem[]
  shifting?: boolean
  articleRef?: Ref<HTMLElement | null>
  listRef?: Ref<HTMLUListElement | null>
  /** When false, skip aria-live (static marketing preview). */
  live?: boolean
  className?: string
  /** Override i18n demo copy (e.g. live API headlines on /features). */
  resolveCopy?: (item: DeskNewsItem, index: number) => DeskNewsCopy
  /** Soft brand-blue stage wash behind the list. */
  stageWash?: boolean
}

/** Shared liquid-glass desk news surface — home cycles; features can stay static. */
export function DeskNewsBoard({
  board,
  shifting = false,
  articleRef,
  listRef,
  live = true,
  className,
  resolveCopy,
  stageWash = false,
}: DeskNewsBoardProps) {
  const t = useTranslations("modern.desk")

  return (
    <article
      ref={articleRef}
      className={cn(
        landingGlassSurface,
        "relative overflow-hidden rounded-[1.75rem] bg-white/48 dark:bg-white/8",
        className
      )}
    >
      <GlassSheen className="rounded-[1.75rem]" />
      {stageWash ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_70%_at_0%_0%,rgba(37,99,235,0.11),transparent_55%),radial-gradient(70%_50%_at_100%_100%,rgba(37,99,235,0.05),transparent_50%)] dark:bg-[radial-gradient(90%_70%_at_0%_0%,rgba(96,165,250,0.14),transparent_55%),radial-gradient(70%_50%_at_100%_100%,rgba(96,165,250,0.06),transparent_50%)]"
        />
      ) : null}

      <ol className="sr-only">
        {board.map((item, index) => {
          const copy = resolveCopy?.(item, index)
          const headline = copy?.headline ?? t(`news.${item.id}.headline`)
          return (
            <li key={item.id}>
              {headline}: {item.impact} {t("impactLabel")}
            </li>
          )
        })}
      </ol>

      <ul
        ref={listRef}
        aria-live={live ? "polite" : undefined}
        className="relative z-10 m-0 list-none divide-y divide-foreground/5 p-0 dark:divide-white/8"
      >
        {board.map((item, index) => {
          const copy = resolveCopy?.(item, index)
          return (
            <DeskNewsRow
              key={item.id}
              item={item}
              featured={index === 0}
              shifting={shifting}
              leadLabel={t("lead")}
              impactLabel={t("impactLabel")}
              source={copy?.source ?? t(`news.${item.id}.source`)}
              time={copy?.time ?? t(`news.${item.id}.time`)}
              headline={copy?.headline ?? t(`news.${item.id}.headline`)}
            />
          )
        })}
      </ul>
    </article>
  )
}

/** Static board for marketing pages (no GSAP cycle). */
export function DeskNewsBoardPreview({
  className,
  stageWash = false,
}: {
  className?: string
  stageWash?: boolean
}) {
  return (
    <DeskNewsBoard
      board={initialDeskBoard()}
      live={false}
      className={className}
      stageWash={stageWash}
    />
  )
}
