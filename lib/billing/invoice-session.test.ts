import { describe, expect, it } from "vitest"

import type { PaymentInvoice } from "@/lib/billing/invoice-types"
import {
  findLatestResumableInvoice,
  findResumableInvoice,
  isInvoiceExpired,
  isResumableInvoice,
} from "@/lib/billing/invoice-session"

function invoice(
  overrides: Partial<PaymentInvoice> & Pick<PaymentInvoice, "uid">
): PaymentInvoice {
  return {
    uid: overrides.uid,
    user_id: "user-1",
    plan_id: overrides.plan_id ?? "pro_monthly",
    original_amount_usd: overrides.original_amount_usd ?? 20,
    amount_usd: overrides.amount_usd ?? 20,
    amount_crypto: overrides.amount_crypto ?? "20000000",
    currency: overrides.currency ?? "USDT",
    coupon_code: overrides.coupon_code ?? null,
    tier: "plus",
    duration_days: 30,
    pay_address: overrides.pay_address ?? "0xabc",
    status: overrides.status ?? "pending",
    paid_at: overrides.paid_at ?? null,
    paid_amount_crypto: overrides.paid_amount_crypto ?? null,
    expires_at: overrides.expires_at ?? "2099-01-01T00:00:00.000Z",
    is_swept: false,
    sweep_tx_hash: null,
    swept_at: null,
    created_at: overrides.created_at ?? "2026-01-01T00:00:00.000Z",
    updated_at: overrides.updated_at ?? "2026-01-01T00:00:00.000Z",
  }
}

describe("invoice session", () => {
  it("treats pending invoices past expires_at as expired", () => {
    const pending = invoice({
      uid: "a",
      expires_at: "2026-01-01T00:00:00.000Z",
    })

    expect(
      isInvoiceExpired(pending, Date.parse("2026-01-01T00:00:01.000Z"))
    ).toBe(true)
    expect(isResumableInvoice(pending, Date.parse("2026-01-01T00:00:01.000Z"))).toBe(
      false
    )
  })

  it("finds a matching resumable invoice before creating a new one", () => {
    const invoices = [
      invoice({ uid: "old", status: "paid" }),
      invoice({
        uid: "keep",
        plan_id: "pro_monthly",
        currency: "USDT",
        coupon_code: "LAUNCH20",
        created_at: "2026-01-02T00:00:00.000Z",
      }),
      invoice({
        uid: "other-plan",
        plan_id: "pro_annual",
        currency: "USDT",
        created_at: "2026-01-03T00:00:00.000Z",
      }),
    ]

    expect(
      findResumableInvoice(invoices, {
        planId: "pro_monthly",
        currency: "USDT",
        couponCode: "LAUNCH20",
      })?.uid
    ).toBe("keep")

    expect(
      findResumableInvoice(invoices, {
        planId: "pro_monthly",
        currency: "USDC",
      })
    ).toBeNull()
  })

  it("returns the newest resumable invoice", () => {
    const invoices = [
      invoice({
        uid: "older",
        created_at: "2026-01-01T00:00:00.000Z",
      }),
      invoice({
        uid: "newer",
        created_at: "2026-01-03T00:00:00.000Z",
      }),
    ]

    expect(findLatestResumableInvoice(invoices)?.uid).toBe("newer")
  })
})
