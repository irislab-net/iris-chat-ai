import { APP_NEWS_PATH } from "@/lib/site"

export const LANDING_CHAT_QUERY_PARAM = "q"

export function buildLandingChatHref(question: string): string {
  const q = question.trim()
  if (!q) return APP_NEWS_PATH
  const separator = APP_NEWS_PATH.includes("?") ? "&" : "?"
  return `${APP_NEWS_PATH}${separator}${LANDING_CHAT_QUERY_PARAM}=${encodeURIComponent(q)}`
}
