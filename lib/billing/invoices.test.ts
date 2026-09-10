import { describe, expect, it } from "vitest"

import { buildCreateInvoiceBody, InvoiceError } from "@/lib/billing/invoices"
import { planIdForBilling } from "@/lib/billing/plan-ids"

describe("payment invoices", () => {
  it("maps billing cycles to API plan ids", () => {
    expect(planIdForBilling("monthly")).toBe("pro_monthly")
    expect(planIdForBilling("annual")).toBe("pro_annual")
  })

  it("builds create-invoice bodies for crypto checkout", () => {
    expect(
      buildCreateInvoiceBody({
        billing: "monthly",
        couponCode: "LAUNCH20",
        currency: "USDT",
      })
    ).toEqual({
      plan_id: "pro_monthly",
      currency: "USDT",
      coupon_code: "LAUNCH20",
    })

    expect(
      buildCreateInvoiceBody({
        billing: "annual",
        currency: "USDC",
      })
    ).toEqual({
      plan_id: "pro_annual",
      currency: "USDC",
    })
  })

  it("rejects unsupported payment currencies", () => {
    expect(() =>
      buildCreateInvoiceBody({
        billing: "monthly",
        currency: "ETH" as never,
      })
    ).toThrow(InvoiceError)
  })
})
