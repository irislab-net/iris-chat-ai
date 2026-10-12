import { API_BASE } from "@/lib/api/config"
import type { ApiEnvelope, NewsHome } from "@/lib/api/types"

/** News tape — refresh every 5 minutes (ISR + Data Cache). */
export const PUBLIC_NEWS_REVALIDATE_SECONDS = 5 * 60

/**
 * Desk page segment revalidate follows the news cadence so SSR guests
 * see fresh headlines without waiting for a longer board cycle.
 */
export const PUBLIC_HOME_REVALIDATE_SECONDS = PUBLIC_NEWS_REVALIDATE_SECONDS

export const PUBLIC_NEWS_CACHE_TAG = "news"

export type PublicHomeSnapshot = {
  news: NewsHome | null
}

async function fetchPublicEnvelope<T>(
  path: string,
  options: { revalidate: number; tags: string[]; lang?: string }
): Promise<T | null> {
  try {
    const url = new URL(`${API_BASE}${path}`)
    if (options.lang) url.searchParams.set("lang", options.lang)
    const res = await fetch(url, {
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

/** Guest-safe public home payloads — no cookies, tokens, or browser APIs. */
export async function fetchPublicHomeSnapshot(options?: {
  lang?: string
}): Promise<PublicHomeSnapshot> {
  const newsOpts = {
    revalidate: PUBLIC_NEWS_REVALIDATE_SECONDS,
    tags: [PUBLIC_NEWS_CACHE_TAG],
    lang: options?.lang,
  }
  const [newsHome, latest] = await Promise.all([
    fetchPublicEnvelope<NewsHome>("/v1/news/home", newsOpts),
    fetchPublicEnvelope<NewsHome["news"]>("/v1/news/latest", newsOpts),
  ])
  const news = newsHome?.news?.length
    ? newsHome
    : latest?.length
      ? { analytics: newsHome?.analytics ?? [], news: latest }
      : newsHome
  return { news }
}
