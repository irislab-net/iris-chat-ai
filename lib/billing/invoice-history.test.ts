import { describe, expect, it } from "vitest"

import {
  formatInvoicePlanLabel,
  invoiceHistoryRows,
  isPaidInvoice,
  normalizeInvoiceStatus,
  paymentHistoryRows,
} from "@/lib/billing/invoice-history"
import type { PaymentInvoice } from "@/lib/billing/invoice-types"

function invoice(
  overrides: Partial<PaymentInvoice> & Pick<PaymentInvoice, "uid" | "status">
): PaymentInvoice {
  return {
    user_id: "u1",
    plan_id: "pro_monthly",
    original_amount_usd: 49,
    amount_usd: 49,
    amount_crypto: "49",
    currency: "USDT",
    tier: "pro",
    duration_days: 30,
    pay_address: "0xabc",
    expires_at: "2026-09-20T00:00:00Z",
    is_swept: false,
    created_at: "2026-09-19T00:00:00Z",
    updated_at: "2026-09-19T00:00:00Z",
    ...overrides,
  }
}

describe("invoice history helpers", () => {
  it("normalizes invoice statuses", () => {
    expect(normalizeInvoiceStatus("PAID")).toBe("paid")
    expect(normalizeInvoiceStatus("weird")).toBe("unknown")
  })

  it("splits invoice and payment history", () => {
    const rows = [
      invoice({
        uid: "a",
        status: "pending",
        created_at: "2026-09-18T00:00:00Z",
      }),
      invoice({
        uid: "b",
        status: "paid",
        created_at: "2026-09-19T00:00:00Z",
        paid_at: "2026-09-19T01:00:00Z",
      }),
      invoice({
        uid: "c",
        status: "expired",
        created_at: "2026-09-17T00:00:00Z",
      }),
    ]

    expect(invoiceHistoryRows(rows).map((row) => row.uid)).toEqual([
      "b",
      "a",
      "c",
    ])
    expect(paymentHistoryRows(rows).map((row) => row.uid)).toEqual(["b"])
    expect(isPaidInvoice(rows[1]!)).toBe(true)
  })

  it("labels known plan ids", () => {
    expect(formatInvoicePlanLabel("pro_monthly")).toBe("Plus · Monthly")
    expect(formatInvoicePlanLabel("pro_annual")).toBe("Plus · Annual")
  })
})
