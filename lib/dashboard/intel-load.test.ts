import { describe, expect, it } from "vitest"

import { hasUsableNews, mergeNewsHome } from "@/lib/dashboard/intel-load"
import type { NewsItem } from "@/lib/api/types"

const item = { id: "n1" } as NewsItem

describe("intel load helpers", () => {
  it("treats empty SSR news as not ready", () => {
    expect(hasUsableNews(null)).toBe(false)
    expect(hasUsableNews({ analytics: [], news: [] })).toBe(false)
    expect(hasUsableNews({ analytics: [], news: [item] })).toBe(true)
  })

  it("fills an empty home feed from /news/latest", () => {
    expect(mergeNewsHome({ analytics: [], news: [] }, [item])).toEqual({
      analytics: [],
      news: [item],
    })
    expect(
      mergeNewsHome({ analytics: [], news: [item] }, [{ id: "n2" } as NewsItem])
    ).toEqual({ analytics: [], news: [item] })
  })
})
