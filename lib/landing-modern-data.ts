import {
  Activity,
  GraduationCap,
  Layers,
  LineChart,
  Link2,
  MoreHorizontal,
  Sparkles,
  Wallet,
  Zap,
} from "lucide-react"

/** Nav destinations — labels live in `modern.nav`. Order matches page sections. */
export const NAV_LINKS = [
  { id: "features" },
  { id: "how-it-works" },
  { id: "desk" },
  { id: "signals" },
  { id: "about" },
  { id: "pricing" },
] as const

export type NavLinkId = (typeof NAV_LINKS)[number]["id"]

/**
 * Scroll-spy targets, in document order.
 *
 * Every id here must resolve to a real element that occupies its own band of
 * the page — `#top` is the page root and would stay "entered" forever, so the
 * hero is tracked via `#hero` instead. Sections that are not nav destinations
 * (the CTA band) still belong here: without them the previous section stays
 * highlighted while they are on screen.
 */
export const LANDING_SCROLL_SECTIONS = [
  { id: "hero" },
  { id: "features" },
  { id: "how-it-works" },
  { id: "desk" },
  { id: "signal-wait" },
  { id: "signals" },
  { id: "about" },
  { id: "try" },
  { id: "pricing" },
  { id: "faq" },
  { id: "get-started" },
] as const

export const HERO_DEMO_EXCHANGE_COUNT = 10

export const HERO_DEMO_AVATARS = [
  {
    src: "/landing/avatars/al.webp",
    initials: "AL",
  },
  {
    src: "/landing/avatars/jn.webp",
    initials: "JN",
  },
  {
    src: "/landing/avatars/mr.webp",
    initials: "MR",
  },
  {
    src: "/landing/avatars/dk.webp",
    initials: "DK",
  },
  {
    src: "/landing/avatars/sp.webp",
    initials: "SP",
  },
  {
    src: "/landing/avatars/tw.webp",
    initials: "TW",
  },
  {
    src: "/landing/avatars/nl.webp",
    initials: "NL",
  },
  {
    src: "/landing/avatars/rk.webp",
    initials: "RK",
  },
] as const

export const HERO_VIDEO = {
  src: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260514_135830_bb6491d1-9b66-4aec-9722-13b4dfe3fb46.mp4",
} as const

export const ABOUT_DEMO_VIDEO = {
  src: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260514_135830_bb6491d1-9b66-4aec-9722-13b4dfe3fb46.mp4",
  poster: undefined as string | undefined,
} as const

export const HERO_CHIPS = [
  { id: "spend", icon: Wallet },
  { id: "savings", icon: LineChart },
  { id: "goals", icon: GraduationCap },
  { id: "ask", icon: Sparkles },
  { id: "more", icon: MoreHorizontal },
] as const

export const TRUSTED_LOGOS = [
  { name: "Arcline", icon: Zap },
  { name: "Vault", icon: Layers },
  { name: "Northstar", icon: Sparkles },
  { name: "Ledger", icon: Link2 },
  { name: "Pulse", icon: Activity },
] as const

/** How-it-works step keys — copy in `modern.howItWorks`. */
export const HOW_IT_WORKS_STEP_KEYS = ["read", "ask", "act"] as const

export type HowItWorksStepKey = (typeof HOW_IT_WORKS_STEP_KEYS)[number]

/** Live desks vs. upcoming tokens for the signals coverage band. */
export const SIGNALS_LIVE_MARKETS = [
  { id: "btc", symbol: "BTC" },
  { id: "eth", symbol: "ETH" },
  { id: "xau", symbol: "XAU" },
] as const

export const SIGNALS_SOON_MARKETS = [
  { id: "sol", symbol: "SOL" },
  { id: "bnb", symbol: "BNB" },
  { id: "xrp", symbol: "XRP" },
  { id: "link", symbol: "LINK" },
  { id: "avax", symbol: "AVAX" },
  { id: "doge", symbol: "DOGE" },
  { id: "arb", symbol: "ARB" },
  { id: "op", symbol: "OP" },
] as const

export type SignalsMarketId =
  | (typeof SIGNALS_LIVE_MARKETS)[number]["id"]
  | (typeof SIGNALS_SOON_MARKETS)[number]["id"]

/** Desk news structure — copy in `modern.desk.news`. */
export const DESK_NEWS_META = [
  { id: "0", impact: 92, tone: "positive" as const },
  { id: "1", impact: 78, tone: "negative" as const },
  { id: "2", impact: 64, tone: "neutral" as const },
  { id: "3", impact: 88, tone: "positive" as const },
  { id: "4", impact: 71, tone: "negative" as const },
  { id: "5", impact: 55, tone: "neutral" as const },
] as const

export type DeskNewsTone = (typeof DESK_NEWS_META)[number]["tone"]
export type DeskNewsItem = (typeof DESK_NEWS_META)[number]

/** How many headlines stay visible in the desk list demo. */
export const DESK_NEWS_VISIBLE = 3

/** Board rotation interval for the desk list GSAP demo (ms). */
export const DESK_NEWS_CYCLE_MS = 5600

/** Demo ticket for the landing signal card. Same shape as chat `ChatSignalCard`. */
export const SIGNAL_WAIT_TICKET = {
  symbol: "ETH",
  side: "LONG" as const,
  quantity: 0,
  markPrice: 3242,
  stopLoss: 3188,
  takeProfit: 3390,
  leverage: 5,
}

export const GUEST_TRIAL_STAT = "3"

export const FAQ_ITEM_IDS = [
  "what",
  "news",
  "chatbot",
  "ask",
  "account",
  "free",
  "profits",
] as const

export type FaqItemId = (typeof FAQ_ITEM_IDS)[number]

export type PricingPlanKey = "free" | "plus" | "ultimate"

export const PRICING_PLAN_META: {
  key: PricingPlanKey
  featured?: boolean
  featureCount: number
  hasBadge?: boolean
}[] = [
  { key: "free", featureCount: 4 },
  { key: "plus", featured: true, featureCount: 4, hasBadge: true },
  { key: "ultimate", featureCount: 3, hasBadge: true },
]

export const GOALS_STORY_COUNT = 4
