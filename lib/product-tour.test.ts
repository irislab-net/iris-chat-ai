import { describe, expect, it } from "vitest"

import {
  MOBILE_PRODUCT_TOUR_STEPS,
  PRODUCT_TOUR_STEPS,
  TOUR_SECTION_LABELS,
} from "@/lib/product-tour"

describe("product tour (IRIS + news)", () => {
  it("walks IRIS → news on desktop", () => {
    const sections = PRODUCT_TOUR_STEPS.map((step) => step.section)
    expect(sections.indexOf("iris")).toBeLessThan(sections.indexOf("news"))
    expect(PRODUCT_TOUR_STEPS).toHaveLength(6)
  })

  it("includes mobile shell navigation targets", () => {
    expect(MOBILE_PRODUCT_TOUR_STEPS.length).toBeGreaterThanOrEqual(
      PRODUCT_TOUR_STEPS.length
    )
    expect(
      MOBILE_PRODUCT_TOUR_STEPS.some((step) => step.selector === '[data-tour="nav-iris"]')
    ).toBe(true)
  })

  it("opens chat only after the IRIS entry step", () => {
    const irisEntry = PRODUCT_TOUR_STEPS.find((step) => step.id === "iris-entry")
    const firstChatStep = PRODUCT_TOUR_STEPS.find((step) => step.openChat)
    expect(irisEntry?.openChat).not.toBe(true)
    expect(firstChatStep?.id).toBe("chat-header")
  })

  it("labels the two tour chapters", () => {
    expect(TOUR_SECTION_LABELS).toEqual({
      iris: "IRIS AI",
      news: "News",
    })
  })
})
