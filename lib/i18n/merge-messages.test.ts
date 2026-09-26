import { describe, expect, it } from "vitest"

import { deepMergeMessages } from "@/lib/i18n/merge-messages"

describe("deepMergeMessages", () => {
  it("overlays nested keys without dropping English siblings", () => {
    const merged = deepMergeMessages(
      {
        common: { english: "English", arabic: "Arabic", brand: "Exur" },
        modern: {
          hero: { titleBefore: "Your money,", titleAfter: "handled." },
        },
      },
      {
        common: { arabic: "العربية" },
        modern: { hero: { titleBefore: "أموالك،" } },
      }
    )

    expect(merged.common).toEqual({
      english: "English",
      arabic: "العربية",
      brand: "Exur",
    })
    expect(merged.modern.hero).toEqual({
      titleBefore: "أموالك،",
      titleAfter: "handled.",
    })
  })
})
