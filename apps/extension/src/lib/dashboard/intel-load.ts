import type { InsightHome, NewsHome, NewsItem } from "@/lib/api/types"

export function hasUsableInsight(insight: InsightHome | null | undefined) {
  return Boolean(insight?.summary && insight.predictions[0])
}

export function hasUsableNews(news: NewsHome | null | undefined) {
  return Boolean(news?.news?.length)
}

export function mergeNewsHome(
  home: NewsHome | null,
  latest: NewsItem[]
): NewsHome | null {
  if (home?.news?.length) return home
  if (latest.length === 0) return home
  return {
    analytics: home?.analytics ?? [],
    news: latest,
  }
}
