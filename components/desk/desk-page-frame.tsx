"use client"

import * as React from "react"
import { InfoIcon, MoreHorizontalIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { chatMobileHeaderButtonClass } from "@/components/app-shell/chat-mobile-gemini-styles"
import {
  chatContextMenuContentClass,
  chatContextMenuIconClass,
  chatContextMenuItemClass,
} from "@/components/app-shell/chat-context-menu-styles"
import {
  DeskHelpSheet,
  type DeskPageId,
} from "@/components/desk/desk-help-sheet"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  landingGlassSheen,
  landingTitleCard,
} from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

/** Liquid glass plate — light: white rim + specular; dark: no white rim. */
const deskLiquidGlassShellClass = [
  "relative isolate overflow-hidden",
  "border border-white/75 dark:border-transparent",
  "bg-white/48 supports-[backdrop-filter]:bg-white/38 dark:bg-white/10 dark:supports-[backdrop-filter]:bg-white/8",
  "backdrop-blur-[40px] backdrop-saturate-[175%]",
  "shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_36px_-10px_rgba(15,23,42,0.14),0_28px_72px_-18px_rgba(15,23,42,0.1),inset_0_1px_1px_rgba(255,255,255,0.95),inset_0_0_0_0.5px_rgba(255,255,255,0.55),inset_0_-10px_22px_-14px_rgba(15,23,42,0.08)]",
  "dark:shadow-[0_1px_2px_rgba(0,0,0,0.25),0_12px_36px_-10px_rgba(0,0,0,0.45),0_28px_72px_-18px_rgba(0,0,0,0.4),inset_0_-12px_24px_-14px_rgba(0,0,0,0.45)]",
].join(" ")

const deskHeaderMoreButtonClass = cn(
  chatMobileHeaderButtonClass,
  "size-10 shrink-0 [&_svg:not([class*='size-'])]:size-[18px]"
)

function DeskPageMoreMenu({
  onInformation,
}: {
  onInformation: () => void
}) {
  const t = useTranslations("deskHelp")

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={deskHeaderMoreButtonClass}
            aria-label={t("more")}
          />
        }
      >
        <MoreHorizontalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className={cn(chatContextMenuContentClass, "min-w-44")}
      >
        <DropdownMenuItem
          className={chatContextMenuItemClass}
          onClick={onInformation}
        >
          <InfoIcon className={chatContextMenuIconClass} />
          {t("information")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function DeskPageFrame({
  title,
  subtitle,
  badge,
  pageId,
  children,
  className,
}: {
  title?: string
  subtitle?: string
  badge?: React.ReactNode
  /** Required when the page shows a header — drives More → help copy. */
  pageId?: DeskPageId
  children: React.ReactNode
  className?: string
}) {
  const [helpOpen, setHelpOpen] = React.useState(false)
  const showHeader = Boolean(title) || Boolean(badge) || Boolean(subtitle)
  const showMore = Boolean(pageId) && showHeader

  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-5 pt-6 sm:gap-10 sm:px-6 sm:py-8 sm:pt-10 lg:max-w-4xl",
        // Extra air so last cards clear the floating desk pill (desktop: none).
        "max-lg:pb-[calc(var(--desk-bottom-nav,4.75rem)+0.5rem)]",
        className
      )}
    >
      {showHeader ? (
        <header className="flex flex-col gap-2 ps-1.5 sm:ps-2">
          {title || badge || showMore ? (
            <div className="flex items-center gap-2.5">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2.5">
                {title ? (
                  <h1
                    className={cn(
                      landingTitleCard,
                      "text-[1.35rem] sm:text-xl"
                    )}
                  >
                    {title}
                  </h1>
                ) : null}
                {badge}
              </div>
              {showMore && pageId ? (
                <DeskPageMoreMenu onInformation={() => setHelpOpen(true)} />
              ) : null}
            </div>
          ) : null}
          {subtitle ? (
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
              {subtitle}
            </p>
          ) : null}
        </header>
      ) : null}
      {children}
      {pageId ? (
        <DeskHelpSheet
          pageId={pageId}
          open={helpOpen}
          onOpenChange={setHelpOpen}
        />
      ) : null}
    </div>
  )
}

function DeskGlassCard({
  children,
  className,
  contentClassName,
}: {
  children: React.ReactNode
  className?: string
  /** Inner plate (above sheen). Needed for nested flex/scroll layouts. */
  contentClassName?: string
}) {
  return (
    <div
      className={cn(
        deskLiquidGlassShellClass,
        "rounded-[1.75rem] p-4 sm:p-5",
        className
      )}
    >
      <span aria-hidden className={cn(landingGlassSheen, "rounded-[1.75rem]")} />
      <div className={cn("relative z-10", contentClassName)}>{children}</div>
    </div>
  )
}

function DeskSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-1 text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
      {children}
    </p>
  )
}

export {
  DeskGlassCard,
  DeskPageFrame,
  DeskSectionLabel,
  deskLiquidGlassShellClass,
}
export type { DeskPageId }
