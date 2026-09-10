import {
  WORKSPACE_TAB_NEWS,
  type WorkspaceTab,
} from "@/lib/workspace-tab"

export type TourSection = "iris" | "news"

export type TourStep = {
  id: string
  selector: string
  section: TourSection
  title: string
  body: string
  placement?: "top" | "bottom" | "left" | "right" | "auto"
  workspaceTab?: WorkspaceTab
  openChat?: boolean
  closeChat?: boolean
}

const TOUR_SEEN_KEY = "iris-chat-ai-product-tour-seen-v1"

/** Wait for the app to settle before auto-opening the first-run tour. */
export const TOUR_AUTO_OPEN_DELAY_MS = 8_000

const IRIS_STEPS: TourStep[] = [
  {
    id: "iris-entry",
    section: "iris",
    selector: '[data-tour="chat"]',
    title: "IRIS co-pilot",
    body: "IRIS stays docked beside your news feed — ask about the market you're viewing, stance, and context in plain English.",
    placement: "right",
    workspaceTab: WORKSPACE_TAB_NEWS,
  },
  {
    id: "chat-header",
    section: "iris",
    selector: '[data-tour="chat-header"]',
    title: "Session controls",
    body: "Your plan, past conversations, and a fresh thread. History keeps earlier asks; New chat starts clean.",
    placement: "bottom",
    openChat: true,
  },
  {
    id: "chat-thread",
    section: "iris",
    selector: '[data-tour="chat-thread"]',
    title: "Conversation",
    body: "Replies are grounded in the active market. Use a starter prompt or type your own question.",
    placement: "top",
    openChat: true,
  },
  {
    id: "composer",
    section: "iris",
    selector: '[data-tour="composer"]',
    title: "Send a message",
    body: "Write here and send. Sign in to run IRIS on your account — guests can read news without chatting.",
    placement: "top",
    openChat: true,
  },
]

const MOBILE_IRIS_ENTRY_STEP: TourStep = {
  id: "iris-entry",
  section: "iris",
  selector: '[data-tour="nav-iris"]',
  title: "IRIS co-pilot",
  body: "Ask about the market you're viewing — stance, levels, and context in plain English.",
  placement: "top",
  workspaceTab: WORKSPACE_TAB_NEWS,
  closeChat: true,
}

const NEWS_STEPS: TourStep[] = [
  {
    id: "news-entry",
    section: "news",
    selector: '[data-tour="nav-news"]',
    title: "News tab",
    body: "Scored headlines and tape context — curated for the market you have selected, not a raw wire.",
    placement: "top",
    workspaceTab: WORKSPACE_TAB_NEWS,
    closeChat: true,
  },
  {
    id: "news-feed",
    section: "news",
    selector: '[data-tour="news-feed"]',
    title: "Intel feed",
    body: "Each item is ranked for relevance and direction. Read here, then ask IRIS when you want deeper context.",
    placement: "bottom",
    workspaceTab: WORKSPACE_TAB_NEWS,
    closeChat: true,
  },
]

/** Desktop — IRIS, then News. */
export const PRODUCT_TOUR_STEPS: TourStep[] = [
  ...IRIS_STEPS,
  ...NEWS_STEPS,
]

/** Mobile — shell navigation targets. */
export const MOBILE_PRODUCT_TOUR_STEPS: TourStep[] = [
  MOBILE_IRIS_ENTRY_STEP,
  ...IRIS_STEPS.slice(1),
  ...NEWS_STEPS,
]

export const TOUR_SECTION_LABELS: Record<TourSection, string> = {
  iris: "IRIS AI",
  news: "News",
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
}

export function hasSeenProductTour() {
  if (!canUseStorage()) return true
  return window.localStorage.getItem(TOUR_SEEN_KEY) === "1"
}

export function markProductTourSeen() {
  if (!canUseStorage()) return
  window.localStorage.setItem(TOUR_SEEN_KEY, "1")
}
