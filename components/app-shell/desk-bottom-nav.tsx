"use client"

import * as React from "react"
import {
  ChartCandlestickIcon,
  LineChartIcon,
  MessageSquareIcon,
  NewspaperIcon,
  UserRoundIcon,
} from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { useTranslations } from "next-intl"

import {
  deskBottomNavGlassClass,
  deskBottomNavTabActiveClass,
  deskBottomNavTabPillClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
import { Link, usePathname } from "@/i18n/navigation"
import {
  DESK_TABS,
  isDeskTabActive,
  type DeskTabId,
} from "@/lib/desk-tabs"
import { landingGlassSheen } from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

const TAB_ICONS: Record<DeskTabId, React.ComponentType<{ className?: string }>> =
  {
    ai: MessageSquareIcon,
    news: NewspaperIcon,
    markets: LineChartIcon,
    trade: ChartCandlestickIcon,
    profile: UserRoundIcon,
  }

/** Soft liquid slide — lower stiffness for a longer, silkier glide. */
const PILL_SPRING = {
  type: "spring" as const,
  stiffness: 240,
  damping: 28,
  mass: 0.9,
}

/** Align home-indicator chrome with page surface (no black halo under the pill). */
function useDeskBottomNavChrome() {
  React.useEffect(() => {
    const root = document.documentElement
    root.setAttribute("data-desk-bottom-nav", "true")
    return () => {
      root.removeAttribute("data-desk-bottom-nav")
    }
  }, [])
}

function DeskBottomNav({ className }: { className?: string }) {
  const t = useTranslations("deskNav")
  const pathname = usePathname()
  const reduceMotion = useReducedMotion()
  useDeskBottomNavChrome()

  return (
    <nav
      aria-label={t("ariaLabel")}
      data-slot="desk-bottom-nav"
      className={cn(
        // Below slide drawers / sheets (z-40+) so history & account cover the island.
        "pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center",
        // Float clear of the home indicator — island, not edge-docked bar.
        "px-4 pb-[max(0.85rem,calc(env(safe-area-inset-bottom,0px)+0.35rem))]",
        "lg:hidden",
        className
      )}
    >
      <div
        className={cn(
          deskBottomNavGlassClass,
          "pointer-events-auto flex w-full max-w-[30rem] items-stretch justify-between gap-0.5 p-1.5"
        )}
      >
        <span
          aria-hidden
          className={cn(landingGlassSheen, "rounded-[2rem]")}
        />
        {DESK_TABS.map((tab) => {
          const active = isDeskTabActive(tab.id, pathname)
          const Icon = TAB_ICONS[tab.id]
          return (
            <Link
              key={tab.id}
              href={tab.path}
              aria-label={t(tab.labelKey)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative z-10 flex min-w-0 flex-1 items-center justify-center rounded-[1.35rem] px-1 py-2.5",
                "transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                "active:scale-[0.97] motion-reduce:active:scale-100",
                active
                  ? deskBottomNavTabActiveClass
                  : "text-muted-foreground/85 hover:text-foreground"
              )}
            >
              {active ? (
                <motion.span
                  layoutId="desk-bottom-nav-pill"
                  className={cn(
                    deskBottomNavTabPillClass,
                    "pointer-events-none absolute inset-0 -z-10"
                  )}
                  transition={reduceMotion ? { duration: 0 } : PILL_SPRING}
                  aria-hidden
                />
              ) : null}
              <Icon
                className={cn(
                  "relative size-[1.35rem] shrink-0 stroke-[1.15] transition-[color,transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  active
                    ? "scale-105 text-black dark:text-white"
                    : "text-black/40 dark:text-white/40"
                )}
                aria-hidden
              />
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export { DeskBottomNav }
