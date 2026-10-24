"use client"

import * as React from "react"
import {
  ChartCandlestickIcon,
  LineChartIcon,
  MessageSquareIcon,
  NewspaperIcon,
  UserRoundIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"

import {
  chatHistoryRailGlassItemActiveClass,
  chatHistoryRailNavItemClass,
  chatMobileDrawerNavItemClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Link, usePathname } from "@/i18n/navigation"
import {
  DESK_TABS,
  isDeskTabActive,
  type DeskTabId,
} from "@/lib/desk-tabs"
import { cn } from "@/lib/utils"

const TAB_ICONS: Record<DeskTabId, React.ComponentType<{ className?: string }>> =
  {
    ai: MessageSquareIcon,
    news: NewspaperIcon,
    markets: LineChartIcon,
    trade: ChartCandlestickIcon,
    profile: UserRoundIcon,
  }

type DeskRailNavProps = {
  /** Icon-only collapsed desktop rail. */
  minimal?: boolean
  /** Mobile history drawer density. */
  isMobileDrawer?: boolean
  /** Tooltip side when collapsed. */
  tooltipSide?: "top" | "right" | "bottom" | "left"
  className?: string
  onNavigate?: () => void
}

function DeskRailNav({
  minimal = false,
  isMobileDrawer = false,
  tooltipSide = "right",
  className,
  onNavigate,
}: DeskRailNavProps) {
  const t = useTranslations("deskNav")
  const pathname = usePathname()

  return (
    <div
      className={cn(
        "flex flex-col",
        minimal ? "items-center gap-2" : "gap-1",
        className
      )}
      role="navigation"
      aria-label={t("ariaLabel")}
    >
      {DESK_TABS.map((tab) => {
        const active = isDeskTabActive(tab.id, pathname)
        const Icon = TAB_ICONS[tab.id]
        const label = t(tab.labelKey)

        if (minimal) {
          return (
            <Tooltip key={tab.id}>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "size-9 rounded-xl",
                      active && chatHistoryRailGlassItemActiveClass
                    )}
                    aria-label={label}
                    aria-current={active ? "page" : undefined}
                    nativeButton={false}
                    render={
                      <Link
                        href={tab.path}
                        onClick={() => onNavigate?.()}
                      />
                    }
                  >
                    <Icon className="size-4.5" />
                  </Button>
                }
              >
                <Icon className="size-4.5" />
              </TooltipTrigger>
              <TooltipContent side={tooltipSide}>{label}</TooltipContent>
            </Tooltip>
          )
        }

        return (
          <Button
            key={tab.id}
            variant="ghost"
            className={cn(
              isMobileDrawer
                ? chatMobileDrawerNavItemClass
                : chatHistoryRailNavItemClass,
              active && chatHistoryRailGlassItemActiveClass
            )}
            aria-current={active ? "page" : undefined}
            nativeButton={false}
            render={
              <Link href={tab.path} onClick={() => onNavigate?.()} />
            }
          >
            <Icon
              className={cn(
                "shrink-0",
                isMobileDrawer ? "size-4.5" : "size-4",
                active ? "text-foreground" : "text-muted-foreground"
              )}
            />
            <span className="min-w-0 flex-1 truncate text-start">{label}</span>
          </Button>
        )
      })}
    </div>
  )
}

export { DeskRailNav }
