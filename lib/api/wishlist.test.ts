import { describe, expect, it } from "vitest"

import {
  isWishlistTopicSubscribed,
  parseWishlistTopics,
  WISHLIST_TOPIC_TRADING_VIEW,
} from "@/lib/api/wishlist"

describe("parseWishlistTopics", () => {
  it("reads string arrays and nested envelopes", () => {
    expect(parseWishlistTopics(["trading-view"])).toEqual(["trading-view"])
    expect(parseWishlistTopics({ topics: ["trading-view"] })).toEqual([
      "trading-view",
    ])
    expect(parseWishlistTopics({ wishlist: ["trading-view"] })).toEqual([
      "trading-view",
    ])
    expect(parseWishlistTopics({ items: [{ topic: "trading-view" }] })).toEqual(
      ["trading-view"]
    )
  })

  it("detects membership", () => {
    expect(
      isWishlistTopicSubscribed(["trading-view"], WISHLIST_TOPIC_TRADING_VIEW)
    ).toBe(true)
    expect(isWishlistTopicSubscribed([], WISHLIST_TOPIC_TRADING_VIEW)).toBe(
      false
    )
  })
})
