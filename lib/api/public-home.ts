import { API_BASE } from "@/lib/api/config"
import type { ApiEnvelope, InsightHome, NewsHome } from "@/lib/api/types"

/** Insight / F1 board — align with 15m candle length. */
export const PUBLIC_INSIGHT_REVALIDATE_SECONDS = 15 * 60

/** News tape — refresh every 5 minutes (ISR + Data Cache). */
export const PUBLIC_NEWS_REVALIDATE_SECONDS = 5 * 60

/**
 * Desk page segment revalidate follows the news cadence so SSR guests
 * see fresh headlines without waiting for the next candle.
 */
export const PUBLIC_HOME_REVALIDATE_SECONDS = PUBLIC_NEWS_REVALIDATE_SECONDS

export const PUBLIC_NEWS_CACHE_TAG = "news"
export const PUBLIC_INSIGHT_CACHE_TAG = "insight"

export type PublicHomeSnapshot = {
  insight: InsightHome | null
  news: NewsHome | null
}

async function fetchPublicEnvelope<T>(
  path: string,
  options: { revalidate: number; tags: string[] }
): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: options.revalidate, tags: options.tags },
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
  insight:
    | {
        summary: InsightHome["summary"] | null
        predictions: InsightHome["predictions"]
      }
    | null
    | undefined
): InsightHome | null {
  if (!insight?.summary) return null
  return {
    summary: insight.summary,
    predictions: insight.predictions ?? [],
  }
}

/** Guest-safe public home payloads — no cookies, tokens, or browser APIs. */
export async function fetchPublicHomeSnapshot(): Promise<PublicHomeSnapshot> {
  const insightOpts = {
    revalidate: PUBLIC_INSIGHT_REVALIDATE_SECONDS,
    tags: [PUBLIC_INSIGHT_CACHE_TAG],
  }
  const newsOpts = {
    revalidate: PUBLIC_NEWS_REVALIDATE_SECONDS,
    tags: [PUBLIC_NEWS_CACHE_TAG],
  }
  const [insight, newsHome, latest] = await Promise.all([
    fetchPublicEnvelope<InsightHome>("/v1/insight/home", insightOpts),
    fetchPublicEnvelope<NewsHome>("/v1/news/home", newsOpts),
    fetchPublicEnvelope<NewsHome["news"]>("/v1/news/latest", newsOpts),
  ])
  const news = newsHome?.news?.length
    ? newsHome
    : latest?.length
      ? { analytics: newsHome?.analytics ?? [], news: latest }
      : newsHome
  return { insight: normalizeInsightHome(insight), news }
}
