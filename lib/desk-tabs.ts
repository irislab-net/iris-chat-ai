import {
  DESK_AI_PATH,
  DESK_MARKETS_PATH,
  DESK_NEWS_PATH,
  DESK_PROFILE_PATH,
  DESK_TRADE_PATH,
  isDeskAiPath,
} from "@/lib/site"

export type DeskTabId = "ai" | "news" | "markets" | "trade" | "profile"

export type DeskTab = {
  id: DeskTabId
  path: string
  /** next-intl key under `deskNav` */
  labelKey: DeskTabId
}

export const DESK_TABS: readonly DeskTab[] = [
  { id: "ai", path: DESK_AI_PATH, labelKey: "ai" },
  { id: "news", path: DESK_NEWS_PATH, labelKey: "news" },
  { id: "markets", path: DESK_MARKETS_PATH, labelKey: "markets" },
  { id: "trade", path: DESK_TRADE_PATH, labelKey: "trade" },
  { id: "profile", path: DESK_PROFILE_PATH, labelKey: "profile" },
] as const

/** Bottom nav / composer clearance on mobile desk routes. */
export const DESK_BOTTOM_NAV_HEIGHT_PX = 64

export function deskTabFromPathname(
  pathname: string | null | undefined
): DeskTabId | null {
  if (!pathname) return null
  if (isDeskAiPath(pathname)) return "ai"
  if (pathname === DESK_NEWS_PATH) return "news"
  if (pathname === DESK_MARKETS_PATH) return "markets"
  if (pathname === DESK_TRADE_PATH) return "trade"
  if (pathname === DESK_PROFILE_PATH) return "profile"
  return null
}

export function isDeskTabActive(
  tab: DeskTabId,
  pathname: string | null | undefined
): boolean {
  return deskTabFromPathname(pathname) === tab
}
