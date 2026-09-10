import { API_BASE } from "@/lib/api/config"
import type { ApiEnvelope, InsightHome, NewsHome } from "@/lib/api/types"

/**
 * Align SSR public snapshot cache with F1 candle length (15 minutes).
 * Not a product "6h delay" policy — that remains unverified.
 */
export const PUBLIC_HOME_REVALIDATE_SECONDS = 15 * 60

export type PublicHomeSnapshot = {
  insight: InsightHome | null
  news: NewsHome | null
}

async function fetchPublicEnvelope<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: PUBLIC_HOME_REVALIDATE_SECONDS },
    })
    if (!res.ok) return null
    const body = (await res.json()) as ApiEnvelope<T>
    return body.data ?? null
  } catch {
    return null
  }
}

/** API may return `{ summary: null, predictions: [] }` for guests — treat as empty. */
export function normalizeInsightHome(
  insight: { summary: InsightHome["summary"] | null; predictions: InsightHome["predictions"] } | null | undefined
): InsightHome | null {
  if (!insight?.summary) return null
  return {
    summary: insight.summary,
    predictions: insight.predictions ?? [],
  }
}

/** Guest-safe public home payloads — no cookies, tokens, or browser APIs. */
export async function fetchPublicHomeSnapshot(): Promise<PublicHomeSnapshot> {
  const [insight, newsHome, latest] = await Promise.all([
    fetchPublicEnvelope<InsightHome>("/v1/insight/home"),
    fetchPublicEnvelope<NewsHome>("/v1/news/home"),
    fetchPublicEnvelope<NewsHome["news"]>("/v1/news/latest"),
  ])
  const news = newsHome?.news?.length
    ? newsHome
    : latest?.length
      ? { analytics: newsHome?.analytics ?? [], news: latest }
      : newsHome
  return { insight: normalizeInsightHome(insight), news }
}
