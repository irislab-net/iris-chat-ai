import { apiJson } from "@/lib/api/client"
import type {
  ApiEnvelope,
  DynamicPrompt,
  NewsHome,
  NewsItem,
} from "@/lib/api/types"

export type NewsQuery = {
  /** UI locale → API `lang` (titles, summaries, analytics copy). */
  lang?: string
}

function withLang(path: string, lang?: string) {
  if (!lang) return path
  const params = new URLSearchParams({ lang })
  return `${path}?${params}`
}

export async function fetchNewsHome(query: NewsQuery = {}) {
  const res = await apiJson<ApiEnvelope<NewsHome>>(
    withLang("/v1/news/home", query.lang)
  )
  if (!res.data) throw new Error(res.error || "news home empty")
  return res.data
}

export async function fetchNewsLatest(query: NewsQuery = {}) {
  const res = await apiJson<ApiEnvelope<NewsItem[]>>(
    withLang("/v1/news/latest", query.lang)
  )
  return res.data ?? []
}

export async function fetchNewsAnalytics(query: NewsQuery = {}) {
  return apiJson(withLang("/v1/news/analytics", query.lang))
}

/** Ordered starter prompts for the empty chat state (`lang` or Accept-Language). */
export async function fetchDynamicPrompts(query: NewsQuery = {}) {
  const res = await apiJson<ApiEnvelope<DynamicPrompt[]>>(
    withLang("/v1/prompts", query.lang)
  )
  return res.data ?? []
}

/** Report which starters were shown so ranking can learn. */
export async function recordPromptImpressions(promptIds: string[]) {
  if (promptIds.length === 0) return
  await apiJson("/v1/prompts/impressions", {
    method: "POST",
    body: JSON.stringify({ prompt_ids: promptIds }),
  })
}

/** Report a starter tap so ranking can prefer better prompts. */
export async function recordPromptClick(promptId: string) {
  if (!promptId) return
  await apiJson("/v1/prompts/clicks", {
    method: "POST",
    body: JSON.stringify({ prompt_id: promptId }),
  })
}
