import type { User } from "@/lib/api/types"
import type { BillingCycle, PlanKey } from "@/lib/billing/catalog"
import { isMarketingHost } from "@/lib/hosts"

export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "G-GLTQZ1G6RX"

export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID ?? "GTM-KMGLCNZD"

/** Production always loads GA; local dev only when NEXT_PUBLIC_GA_MEASUREMENT_ID is set. */
export function isAnalyticsEnabled() {
  if (!GA_MEASUREMENT_ID) return false
  if (process.env.NODE_ENV === "production") return true
  return Boolean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID)
}

/** Production always loads GTM; local dev only when NEXT_PUBLIC_GTM_ID is set. */
export function isGtmEnabled() {
  if (!GTM_ID) return false
  if (process.env.NODE_ENV === "production") return true
  return Boolean(process.env.NEXT_PUBLIC_GTM_ID)
}

function normalizeAnalyticsPath(pathname: string): string {
  const path = pathname.split("?")[0]?.split("#")[0] ?? "/"
  return path.replace(/^\/(en|ar)(?=\/|$)/, "") || "/"
}

/** GTM container is for the chat app — not marketing / landing routes. */
export function isChatAnalyticsPath(pathname: string): boolean {
  const path = normalizeAnalyticsPath(pathname)
  return (
    path === "/" ||
    path === "/app" ||
    path.startsWith("/upgrade") ||
    path.startsWith("/auth/")
  )
}

export function isChatGtmEnabled(
  pathname: string,
  hostname?: string | null
): boolean {
  if (hostname && isMarketingHost(hostname)) return false
  return isGtmEnabled() && isChatAnalyticsPath(pathname)
}

const PLUS_USD_VALUE: Record<BillingCycle, number> = {
  monthly: 49,
  annual: 492,
}

export type LoginSource =
  | "toolbar"
  | "chat"
  | "trade_desk"
  | "data_access_notice"
  | "data_access_banner"
  | "upgrade"
  | "billing"
  | "one_tap"

type AnalyticsParams = Record<string, string | number | boolean | undefined>

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

function gtag(...args: unknown[]) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return
  window.gtag(...args)
}

/** Fire a GA4 event. No-ops until gtag is loaded. */
export function trackEvent(name: string, params?: AnalyticsParams) {
  gtag("event", name, params)
}

export function trackPageView(path: string) {
  const params = {
    page_path: path,
    page_location:
      typeof window !== "undefined" ? window.location.href : undefined,
    page_title: typeof document !== "undefined" ? document.title : undefined,
  }

  // GTM-only chat path: History Change tags listen on dataLayer.
  if (typeof window !== "undefined") {
    window.dataLayer = window.dataLayer ?? []
    window.dataLayer.push({ event: "page_view", ...params })
  }

  gtag("event", "page_view", params)
}

/** Bind GA user_id + tier for cohorting (clears on logout). */
export function setAnalyticsUser(user: User | null) {
  if (!GA_MEASUREMENT_ID) return

  if (!user) {
    gtag("config", GA_MEASUREMENT_ID, { user_id: undefined })
    gtag("set", "user_properties", {
      tier: null,
      role: null,
      x_verified: null,
    })
    return
  }

  gtag("config", GA_MEASUREMENT_ID, { user_id: user.id })
  gtag("set", "user_properties", {
    tier: user.tier,
    role: user.role,
    x_verified: user.x_verified,
  })
}

/** Rough heuristic: account created within a few minutes of this login. */
export function isLikelyNewUser(user: User, now = Date.now()) {
  const created = new Date(user.created_at).getTime()
  if (Number.isNaN(created)) return false
  return now - created < 5 * 60 * 1000
}

export function trackLoginStart(source?: LoginSource, ref?: string) {
  trackEvent("login_start", {
    method: "google",
    source,
    has_referral: Boolean(ref),
  })
}

export function trackLoginSuccess(user: User, source?: LoginSource) {
  const method = "google"
  trackEvent("login", {
    method,
    source,
    tier: user.tier,
  })
  if (isLikelyNewUser(user)) {
    trackEvent("sign_up", { method, source, tier: user.tier })
  }
  setAnalyticsUser(user)
}

export function trackLoginFail(reason?: string, source?: LoginSource) {
  trackEvent("login_fail", {
    method: "google",
    source,
    reason: reason?.slice(0, 100),
  })
}

export function trackLogout() {
  trackEvent("logout", { method: "google" })
  setAnalyticsUser(null)
}

export function trackChatMessageSent(params?: {
  conversation_id?: string
  message_length?: number
}) {
  trackEvent("chat_message_sent", {
    conversation_id: params?.conversation_id,
    message_length: params?.message_length,
  })
}

export function trackChatMessageBlockedGuest() {
  trackEvent("chat_message_blocked_guest")
}

export function trackChatToggle(open: boolean) {
  trackEvent(open ? "chat_open" : "chat_close")
}

export function trackChatMessageCopied(params?: {
  conversation_id?: string
  message_id?: string
}) {
  trackEvent("chat_message_copied", {
    conversation_id: params?.conversation_id,
    message_id: params?.message_id,
  })
}

export function trackChatMessageFeedback(params?: {
  conversation_id?: string
  message_id?: string
  feedback: "up" | "down" | "cleared"
}) {
  trackEvent("chat_message_feedback", {
    conversation_id: params?.conversation_id,
    message_id: params?.message_id,
    feedback: params?.feedback,
  })
}

export function trackNewsArticleClick(params: {
  article_id: string
  source: string
  impact_score?: number
}) {
  trackEvent("news_article_click", {
    article_id: params.article_id,
    news_source: params.source,
    impact_score: params.impact_score,
  })
}

export function trackProGateView(authenticated: boolean) {
  trackEvent("pro_gate_view", {
    feature: "trade_desk",
    authenticated,
  })
}

export function trackContactClick(channel: "x" | "telegram") {
  trackEvent("contact_click", { channel })
}

export function trackThemeToggle(theme: "light" | "dark") {
  trackEvent("theme_toggle", { theme })
}

export function trackUpgradeView() {
  trackEvent("upgrade_view")
}

export function trackUpgradePlanSelect(params: { plan: PlanKey }) {
  trackEvent("upgrade_plan_select", { plan: params.plan })
}

export function trackCheckoutStart(params: { billing: BillingCycle }) {
  trackEvent("begin_checkout", {
    billing: params.billing,
    plan: "plus",
    currency: "USD",
    value: PLUS_USD_VALUE[params.billing],
  })
}

export function trackPurchase(params: {
  billing: BillingCycle
  currency?: string
  value?: number
}) {
  const value = params.value ?? PLUS_USD_VALUE[params.billing]
  trackEvent("purchase", {
    billing: params.billing,
    plan: "plus",
    currency: params.currency ?? "USD",
    value,
    item_id: `plus_${params.billing}`,
    item_name: "Plus",
  })
}
