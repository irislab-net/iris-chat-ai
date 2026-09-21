import { getLaunchAppHref } from "@/lib/site"

export const LANDING_CHAT_QUERY_PARAM = "q"

export function buildLandingChatHref(question: string): string {
  const base = getLaunchAppHref()
  const q = question.trim()
  if (!q) return base
  const separator = base.includes("?") ? "&" : "?"
  return `${base}${separator}${LANDING_CHAT_QUERY_PARAM}=${encodeURIComponent(q)}`
}
