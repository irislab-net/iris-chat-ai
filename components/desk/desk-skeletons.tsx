"use client"

import type { ComponentProps } from "react"
import { useTranslations } from "next-intl"

import {
  DeskGlassCard,
  DeskPageFrame,
  deskLiquidGlassShellClass,
} from "@/components/desk/desk-page-frame"
import { landingGlassSheen } from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

function DeskBone({
  className,
  stagger,
  ...props
}: ComponentProps<"div"> & { stagger?: 1 | 2 | 3 }) {
  return (
    <div
      aria-hidden
      className={cn(
        "chat-skeleton-shimmer rounded-md",
        stagger === 1 && "chat-mobile-skeleton-stagger-1",
        stagger === 2 && "chat-mobile-skeleton-stagger-2",
        stagger === 3 && "chat-mobile-skeleton-stagger-3",
        className
      )}
      {...props}
    />
  )
}

const deskTablistShellClass = cn(
  "relative isolate flex items-center gap-1.5 overflow-hidden rounded-[1.35rem] p-1.5",
  "border border-white/80 dark:border-white/20",
  "bg-white/42 supports-[backdrop-filter]:bg-white/32 backdrop-blur-[40px] backdrop-saturate-[175%]",
  "shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_28px_-10px_rgba(15,23,42,0.12),inset_0_1px_1px_rgba(255,255,255,0.95),inset_0_0_0_0.5px_rgba(255,255,255,0.6),inset_0_-8px_16px_-10px_rgba(15,23,42,0.07)]",
  "dark:bg-white/10 dark:supports-[backdrop-filter]:bg-white/8",
  "dark:shadow-[0_1px_2px_rgba(0,0,0,0.22),0_10px_28px_-10px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.22),inset_0_0_0_0.5px_rgba(255,255,255,0.12),inset_0_-10px_18px_-10px_rgba(0,0,0,0.4)]"
)

function DeskTablistSkeleton({ tabs }: { tabs: 2 | 3 }) {
  return (
    <div className={deskTablistShellClass} aria-hidden>
      <span
        aria-hidden
        className={cn(landingGlassSheen, "rounded-[1.35rem]")}
      />
      {Array.from({ length: tabs }, (_, index) => (
        <DeskBone
          key={index}
          stagger={1}
          className={cn(
            "relative z-10 h-11 flex-1 rounded-[1.1rem]",
            index === 0 &&
              "border border-white/90 bg-white/70 dark:border-white/25 dark:bg-white/16"
          )}
        />
      ))}
    </div>
  )
}

function MarketsRowSkeleton({ stagger }: { stagger?: 1 | 2 | 3 }) {
  return (
    <li className="flex items-center gap-3 px-3.5 py-3 sm:px-4 sm:py-3.5">
      <DeskBone stagger={stagger} className="size-8 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <DeskBone stagger={stagger} className="h-3.5 w-16 rounded-full" />
        <DeskBone stagger={stagger} className="h-2.5 w-24 rounded-full" />
      </div>
      <DeskBone
        stagger={stagger}
        className="hidden h-5 w-14 shrink-0 rounded-md sm:block"
      />
      <div className="flex shrink-0 items-center gap-6 sm:gap-10">
        <DeskBone
          stagger={stagger}
          className="h-3.5 w-[4.5rem] rounded-full sm:w-[5.5rem]"
        />
        <DeskBone stagger={stagger} className="h-6 w-[4.25rem] rounded-full" />
        <DeskBone
          stagger={stagger}
          className="hidden h-3.5 w-[4.5rem] rounded-full sm:block"
        />
      </div>
    </li>
  )
}

function MarketsSkeleton() {
  const t = useTranslations("deskNav")
  const tm = useTranslations("deskMarkets")

  return (
    <DeskPageFrame
      pageId="markets"
      title={tm("title")}
      className="flex h-full min-h-0 flex-1 flex-col gap-5 py-3 pt-5 max-lg:pb-0 sm:gap-6 sm:py-4 sm:pt-6"
    >
      <section
        className="flex min-h-0 flex-1 flex-col gap-3 pt-1 sm:gap-3.5 sm:pt-2"
        aria-busy="true"
        aria-label={t("loading")}
      >
        <div
          className={cn(
            "relative isolate flex min-h-12 shrink-0 items-center gap-2.5 overflow-hidden rounded-[1.25rem] px-3.5 sm:px-4",
            deskLiquidGlassShellClass
          )}
          aria-hidden
        >
          <span
            aria-hidden
            className={cn(landingGlassSheen, "rounded-[1.25rem]")}
          />
          <DeskBone stagger={1} className="relative z-10 size-4 shrink-0 rounded-full" />
          <DeskBone
            stagger={1}
            className="relative z-10 h-3.5 w-[min(12rem,55%)] rounded-full"
          />
        </div>

        <DeskGlassCard
          className={cn(
            "flex min-h-0 flex-1 flex-col overflow-hidden p-0 sm:p-0",
            "shadow-[0_1px_2px_rgba(15,23,42,0.04),0_6px_18px_-10px_rgba(15,23,42,0.1),inset_0_1px_1px_rgba(255,255,255,0.95),inset_0_0_0_0.5px_rgba(255,255,255,0.55)]",
            "dark:shadow-[0_1px_2px_rgba(0,0,0,0.22),0_6px_18px_-10px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.2),inset_0_0_0_0.5px_rgba(255,255,255,0.12)]"
          )}
          contentClassName="flex min-h-0 flex-1 flex-col divide-y divide-border/35 dark:divide-white/8"
        >
          <div className="flex shrink-0 items-center gap-3 px-3.5 py-2.5 sm:px-4">
            <DeskBone stagger={1} className="h-2.5 w-14 rounded-full" />
            <div className="hidden w-14 shrink-0 sm:block" aria-hidden />
            <div className="ms-auto flex shrink-0 items-center gap-6 sm:gap-10">
              <DeskBone stagger={1} className="h-2.5 w-[4.5rem] rounded-full sm:w-[5.5rem]" />
              <DeskBone stagger={1} className="h-2.5 w-[4.25rem] rounded-full" />
              <DeskBone
                stagger={1}
                className="hidden h-2.5 w-[4.5rem] rounded-full sm:block"
              />
            </div>
          </div>
          <ul className="min-h-0 flex-1 overflow-hidden">
            {Array.from({ length: 9 }, (_, index) => (
              <MarketsRowSkeleton
                key={index}
                stagger={((index % 3) + 1) as 1 | 2 | 3}
              />
            ))}
          </ul>
        </DeskGlassCard>
      </section>
    </DeskPageFrame>
  )
}

function PositionCardSkeleton({
  expanded = false,
  stagger = 2,
}: {
  expanded?: boolean
  stagger?: 1 | 2 | 3
}) {
  return (
    <DeskGlassCard className="p-0">
      <div className="flex w-full items-center gap-2 px-4 py-3.5">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <DeskBone
            stagger={stagger}
            className={cn(
              "size-7 shrink-0 rounded-full",
              "border border-white/75 dark:border-white/20",
              "bg-white/55 dark:bg-white/12"
            )}
          />
          <DeskBone stagger={stagger} className="h-4 w-12 rounded-full" />
          <DeskBone stagger={stagger} className="h-5 w-12 rounded-full" />
        </div>
        <DeskBone stagger={stagger} className="h-4 w-16 shrink-0 rounded-full" />
        <DeskBone stagger={stagger} className="size-4 shrink-0 rounded-full" />
      </div>
      {expanded ? (
        <div className="px-4 pt-1 pb-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4 sm:gap-x-3">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="min-w-0 space-y-1">
                <DeskBone stagger={3} className="h-2.5 w-8 rounded-full" />
                <DeskBone stagger={3} className="h-3 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </DeskGlassCard>
  )
}

function TradeSkeleton() {
  const t = useTranslations("deskNav")
  const tt = useTranslations("deskTrade")

  return (
    <DeskPageFrame
      pageId="trade"
      title={tt("title")}
      className="gap-5 sm:gap-6"
    >
      <DeskGlassCard
        className="p-4 sm:p-5"
        contentClassName="flex flex-col gap-4 sm:gap-5"
      >
        <div className="flex items-center justify-between gap-4">
          <DeskBone stagger={1} className="size-12 shrink-0 rounded-full" />
          <div className="flex min-w-0 items-center gap-3">
            <div className="min-w-0 space-y-1 text-end">
              <DeskBone stagger={1} className="ms-auto h-3.5 w-20 rounded-full" />
              <DeskBone stagger={1} className="ms-auto h-3 w-12 rounded-full" />
            </div>
            <DeskBone stagger={1} className="h-6 w-11 shrink-0 rounded-full" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-x-4 gap-y-3 border-t border-border/35 pt-4 dark:border-white/8 sm:gap-x-5 sm:pt-5">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="min-w-0 space-y-2">
              <DeskBone stagger={2} className="h-2.5 w-12 rounded-full" />
              <DeskBone stagger={2} className="h-4 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </DeskGlassCard>
      <section
        className="flex flex-col gap-3.5 sm:gap-4"
        aria-busy="true"
        aria-label={t("loading")}
      >
        <DeskTablistSkeleton tabs={2} />
        <div className="flex flex-col gap-2.5">
          <PositionCardSkeleton expanded stagger={2} />
          <PositionCardSkeleton stagger={2} />
          <PositionCardSkeleton stagger={3} />
        </div>
      </section>
    </DeskPageFrame>
  )
}

function ActivityRowSkeleton({ stagger }: { stagger?: 1 | 2 | 3 }) {
  return (
    <li className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
      <DeskBone stagger={stagger} className="size-9 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <DeskBone stagger={stagger} className="h-3.5 w-24 rounded-full" />
        <DeskBone stagger={stagger} className="h-2.5 w-[70%] max-w-[12rem] rounded-full" />
      </div>
      <DeskBone stagger={stagger} className="h-6 w-16 shrink-0 rounded-full" />
    </li>
  )
}

function ProfileSkeleton() {
  const t = useTranslations("deskNav")
  const tp = useTranslations("deskProfile")

  return (
    <DeskPageFrame
      pageId="profile"
      title={tp("title")}
    >
      <div
        className="flex flex-col gap-8 sm:gap-10"
        aria-busy="true"
        aria-label={t("loading")}
      >
        <div
          className={cn(
            deskLiquidGlassShellClass,
            "@container/desk-wallet rounded-[1.75rem] p-4 pb-3.5 @[18rem]/desk-wallet:rounded-[2.25rem] @[18rem]/desk-wallet:p-5 @[18rem]/desk-wallet:pb-4"
          )}
          aria-hidden
        >
          <span
            aria-hidden
            className={cn(landingGlassSheen, "rounded-[inherit]")}
          />
          <div className="relative z-10 flex items-start justify-between gap-2.5">
            <div className="flex min-w-0 items-center gap-2.5">
              <DeskBone
                stagger={1}
                className="size-[3.25rem] shrink-0 rounded-full"
              />
              <div className="min-w-0 space-y-1.5">
                <DeskBone stagger={1} className="h-3.5 w-28 rounded-full" />
                <DeskBone stagger={1} className="h-2.5 w-36 rounded-full" />
              </div>
            </div>
            <DeskBone stagger={1} className="h-6 w-14 shrink-0 rounded-full" />
          </div>

          <div className="relative z-10 mt-4 min-w-0 ps-1 pe-14 @[18rem]/desk-wallet:mt-4.5 @[18rem]/desk-wallet:pe-16">
            <DeskBone stagger={2} className="h-2.5 w-16 rounded-full" />
            <DeskBone
              stagger={2}
              className="mt-2 h-7 w-[min(11rem,70%)] rounded-full sm:h-8"
            />
          </div>

          <div className="relative z-10 mt-4 grid grid-cols-3 gap-2 px-1 @[18rem]/desk-wallet:mt-4.5 @[18rem]/desk-wallet:gap-3">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="min-w-0 space-y-1.5">
                <DeskBone stagger={2} className="h-2 w-12 rounded-full" />
                <DeskBone stagger={2} className="h-3 w-16 rounded-full" />
              </div>
            ))}
          </div>

          <div className="relative z-10 mt-4 grid grid-cols-2 gap-2 @[18rem]/desk-wallet:mt-4.5">
            <DeskBone stagger={3} className="h-10 rounded-full" />
            <DeskBone stagger={3} className="h-10 rounded-full" />
          </div>
        </div>

        <section className="flex flex-col gap-3.5 sm:gap-4">
          <DeskTablistSkeleton tabs={3} />
          <DeskGlassCard className="divide-y divide-border/35 p-0 sm:p-0 dark:divide-white/8">
            <ul className="relative z-10">
              {Array.from({ length: 5 }, (_, index) => (
                <ActivityRowSkeleton
                  key={index}
                  stagger={index < 2 ? 2 : 3}
                />
              ))}
            </ul>
          </DeskGlassCard>
        </section>
      </div>
    </DeskPageFrame>
  )
}

export { MarketsSkeleton, ProfileSkeleton, TradeSkeleton }
