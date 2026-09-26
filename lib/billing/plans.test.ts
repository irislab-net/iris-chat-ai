import { describe, expect, it } from "vitest"

import {
  findPaymentPlan,
  formatPlanPriceUsd,
  plusPriceUsdFromPlans,
  type PaymentPlan,
} from "@/lib/billing/plans"

const samplePlans: PaymentPlan[] = [
  {
    id: "pro_monthly",
    name: "Pro Monthly",
    tier: "pro",
    billing_cycle: "monthly",
    duration_days: 30,
    price_usd: 39.99,
  },
  {
    id: "pro_plus_monthly",
    name: "Pro+ Monthly",
    tier: "pro_plus",
    billing_cycle: "monthly",
    duration_days: 30,
    price_usd: 79.99,
  },
]

describe("payment plans catalog", () => {
  it("finds plus monthly price from backend plans", () => {
    expect(plusPriceUsdFromPlans(samplePlans, "monthly")).toBe(39.99)
    expect(findPaymentPlan(samplePlans, "pro_monthly")?.name).toBe("Pro Monthly")
  })

  it("formats usd for display", () => {
    expect(formatPlanPriceUsd(39.99)).toBe("$39.99")
    expect(formatPlanPriceUsd(null)).toBeNull()
  })
})
