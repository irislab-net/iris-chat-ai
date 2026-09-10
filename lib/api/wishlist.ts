import { apiJson } from "@/lib/api/client"

/** Waitlist topic for live trading inside the TradingView desk. */
export const WISHLIST_TOPIC_TRADING_VIEW = "trading-view"

export function parseWishlistTopics(body: unknown): string[] {
  if (typeof body === "string") {
    return body.trim() ? [body.trim()] : []
  }

  if (Array.isArray(body)) {
    return body.flatMap((item) => {
      if (typeof item === "string") return item.trim() ? [item.trim()] : []
      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>
        if (typeof record.topic === "string" && record.topic.trim()) {
          return [record.topic.trim()]
        }
        if (typeof record.name === "string" && record.name.trim()) {
          return [record.name.trim()]
        }
      }
      return []
    })
  }

  if (!body || typeof body !== "object") return []

  const record = body as Record<string, unknown>

  for (const key of ["topics", "items", "wishlist", "data", "results"]) {
    if (key in record) {
      const parsed = parseWishlistTopics(record[key])
      if (parsed.length > 0) return parsed
    }
  }

  if (record[WISHLIST_TOPIC_TRADING_VIEW] != null) {
    return [WISHLIST_TOPIC_TRADING_VIEW]
  }

  return []
}

export function isWishlistTopicSubscribed(
  topics: readonly string[],
  topic: string
): boolean {
  return topics.includes(topic)
}

export async function fetchWishlistTopics(): Promise<string[]> {
  const body = await apiJson<unknown>("/v1/wishlist")
  return parseWishlistTopics(body)
}

export async function addWishlistTopic(
  topic: string = WISHLIST_TOPIC_TRADING_VIEW
): Promise<void> {
  await apiJson<unknown>(`/v1/wishlist?topic=${encodeURIComponent(topic)}`, {
    method: "POST",
  })
}

/** Join only when absent — safe to call repeatedly. */
export async function ensureWishlistTopic(
  topic: string = WISHLIST_TOPIC_TRADING_VIEW
): Promise<{ subscribed: true; created: boolean }> {
  const topics = await fetchWishlistTopics()
  if (isWishlistTopicSubscribed(topics, topic)) {
    return { subscribed: true, created: false }
  }

  await addWishlistTopic(topic)
  return { subscribed: true, created: true }
}

export async function removeWishlistTopic(
  topic: string = WISHLIST_TOPIC_TRADING_VIEW
): Promise<void> {
  await apiJson<unknown>(`/v1/wishlist?topic=${encodeURIComponent(topic)}`, {
    method: "DELETE",
  })
}
