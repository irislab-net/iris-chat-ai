import { describe, expect, it } from "vitest"

import {
  formatUsd,
  getBillingDisplayPrices,
  getLandingPlanPrice,
  getPlusUsdValue,
  parsePriceAmount,
  resolvePlanPrices,
} from "@/lib/billing/prices"

describe("billing prices from env", () => {
  it("parses bare numbers and $ amounts", () => {
    expect(parsePriceAmount("19")).toBe(19)
    expect(parsePriceAmount("$49")).toBe(49)
    expect(parsePriceAmount("Custom")).toBeNull()
    expect(formatUsd(19)).toBe("$19")
  })

  it("uses defaults when env is empty", () => {
    const prices = resolvePlanPrices({})
    expect(prices.plus.monthly.display).toBe("$19")
    expect(prices.plus.compareAt.display).toBe("$49")
    expect(prices.plus.showCompareAt).toBe(true)
    expect(prices.plus.annualMonthly.display).toBe("$41")
    expect(prices.ultimate.display).toBe("Custom")
  })

  it("reads all plan prices from one env map", () => {
    const env = {
      NEXT_PUBLIC_PRICE_FREE: "0",
      NEXT_PUBLIC_PRICE_PLUS_MONTHLY: "29",
      NEXT_PUBLIC_PRICE_PLUS_COMPARE_AT: "59",
      NEXT_PUBLIC_PRICE_PLUS_ANNUAL_MONTHLY: "24",
      NEXT_PUBLIC_PRICE_ULTIMATE: "Custom",
    }
    const billing = getBillingDisplayPrices(env)
    expect(billing.monthly.plus).toBe("$29")
    expect(billing.annual.plus).toBe("$24")
    expect(billing.monthly.free).toBe("$0")
    expect(billing.monthly.ultimate).toBe("Custom")

    expect(getLandingPlanPrice("plus", env)).toEqual({
      price: "$29",
      priceWas: "$59",
    })
    expect(getPlusUsdValue("monthly", env)).toBe(29)
    expect(getPlusUsdValue("annual", env)).toBe(288)
  })

  it("hides compare-at when not higher than current plus price", () => {
    expect(
      getLandingPlanPrice("plus", {
        NEXT_PUBLIC_PRICE_PLUS_MONTHLY: "49",
        NEXT_PUBLIC_PRICE_PLUS_COMPARE_AT: "49",
      }).priceWas
    ).toBeNull()
  })
})
