import { describe, expect, it } from "vitest"

import {
  displayPlanName,
  isBillingCycle,
  isCheckoutPlan,
  resolvePlusPaymentLink,
  resolvePlusPriceId,
} from "@/lib/billing/catalog"
import { parseCheckoutBody } from "@/lib/billing/checkout"

describe("billing catalog", () => {
  it("maps API tiers to desk plan names", () => {
    expect(displayPlanName(null)).toBe("Free")
    expect(displayPlanName("free")).toBe("Free")
    expect(displayPlanName("pro")).toBe("Plus")
    expect(displayPlanName("ultimate")).toBe("Ultimate")
  })

  it("only Plus is a Stripe checkout plan", () => {
    expect(isCheckoutPlan("plus")).toBe(true)
    expect(isCheckoutPlan("free")).toBe(false)
    expect(isBillingCycle("annual")).toBe(true)
    expect(isBillingCycle("weekly")).toBe(false)
  })

  it("reads Stripe price and payment-link env names", () => {
    expect(
      resolvePlusPriceId("monthly", { STRIPE_PRICE_PLUS_MONTHLY: " price_m " })
    ).toBe("price_m")
    expect(
      resolvePlusPriceId("annual", { STRIPE_PRICE_PLUS_ANNUAL: "price_a" })
    ).toBe("price_a")
    expect(
      resolvePlusPaymentLink("monthly", {
        NEXT_PUBLIC_STRIPE_PLUS_MONTHLY_URL: "https://buy.stripe.com/plus-m",
      })
    ).toBe("https://buy.stripe.com/plus-m")
  })

  it("rejects checkout bodies that are not Plus monthly/annual", () => {
    expect(() =>
      parseCheckoutBody({ plan: "free", billing: "monthly" })
    ).toThrow(/Plus/)
    expect(() =>
      parseCheckoutBody({ plan: "plus", billing: "weekly" })
    ).toThrow(/monthly or annual/)
    expect(parseCheckoutBody({ plan: "plus", billing: "annual" })).toEqual({
      plan: "plus",
      billing: "annual",
      userId: undefined,
      email: undefined,
    })
  })
})
