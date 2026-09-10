import { apiJson } from "@/lib/api/client"
import { normalizeInsightHome } from "@/lib/api/public-home"
import type { ApiEnvelope, InsightHome, NewsHome, NewsItem } from "@/lib/api/types"

export async function fetchInsightHome(): Promise<InsightHome | null> {
  const res = await apiJson<ApiEnvelope<InsightHome>>("/v1/insight/home")
  // Guests get `{ summary: null, predictions: [] }` — not a fetch failure.
  return normalizeInsightHome(res.data)
}

export async function fetchInsightPredictions() {
  return apiJson<ApiEnvelope<InsightHome["predictions"]>>("/v1/insight/predictions")
}

export async function fetchNewsHome() {
  const res = await apiJson<ApiEnvelope<NewsHome>>("/v1/news/home")
  if (!res.data) throw new Error(res.error || "news home empty")
  return res.data
}

export async function fetchNewsLatest() {
  const res = await apiJson<ApiEnvelope<NewsItem[]>>("/v1/news/latest")
  return res.data ?? []
}

export async function fetchNewsAnalytics() {
  return apiJson("/v1/news/analytics")
}
