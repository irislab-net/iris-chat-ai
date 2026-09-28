import { apiJson } from "@/lib/api/client"
import type { ApiEnvelope, NewsHome, NewsItem } from "@/lib/api/types"

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
