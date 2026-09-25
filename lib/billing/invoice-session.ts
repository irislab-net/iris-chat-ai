import type { BillingCycle } from "@/lib/billing/catalog"
import type { PaymentCurrency, PaymentInvoice } from "@/lib/billing/invoice-types"
import { isPaymentCurrency } from "@/lib/billing/invoice-types"
import { billingForPlanId } from "@/lib/billing/plan-ids"

export function invoiceExpiresAtMs(invoice: PaymentInvoice): number {
  return Date.parse(invoice.expires_at)
}

export function invoiceMsRemaining(
  invoice: PaymentInvoice,
  now = Date.now()
): number {
  const expiresAt = invoiceExpiresAtMs(invoice)
  if (!Number.isFinite(expiresAt)) return 0
  return Math.max(0, expiresAt - now)
}

export function isInvoiceExpired(
  invoice: PaymentInvoice,
  now = Date.now()
): boolean {
  if (invoice.status === "expired") return true
  if (invoice.status !== "pending") return false
  return invoiceMsRemaining(invoice, now) <= 0
}

export function isResumableInvoice(
  invoice: PaymentInvoice,
  now = Date.now()
): boolean {
  return (
    invoice.status === "pending" &&
    !isInvoiceExpired(invoice, now) &&
    Boolean(invoice.pay_address?.trim())
  )
}

export function couponMatchesInvoice(
  invoice: PaymentInvoice,
  couponCode?: string
): boolean {
  const existing = invoice.coupon_code?.trim() || null
  const next = couponCode?.trim() || null
  return existing === next
}

export function findResumableInvoice(
  invoices: PaymentInvoice[],
  options: {
    planId: string
    currency: PaymentCurrency
    couponCode?: string
    /** Catalog Plus USD — skip stale invoices priced under an old plan amount. */
    expectedAmountUsd?: number
  },
  now = Date.now()
): PaymentInvoice | null {
  return (
    invoices
      .filter((invoice) => isResumableInvoice(invoice, now))
      .filter((invoice) => invoice.plan_id === options.planId)
      .filter((invoice) => invoice.currency === options.currency)
      .filter((invoice) => couponMatchesInvoice(invoice, options.couponCode))
      .filter((invoice) =>
        invoiceMatchesExpectedAmount(invoice, options.expectedAmountUsd)
      )
      .sort(
        (left, right) =>
          Date.parse(right.created_at) - Date.parse(left.created_at)
      )[0] ?? null
  )
}

/** True when invoice USD matches catalog (or coupon base) within a cent. */
export function invoiceMatchesExpectedAmount(
  invoice: PaymentInvoice,
  expectedAmountUsd?: number
): boolean {
  if (expectedAmountUsd == null || !Number.isFinite(expectedAmountUsd)) {
    return true
  }
  const baseline = invoice.coupon_code?.trim()
    ? invoice.original_amount_usd
    : invoice.amount_usd
  return Math.abs(baseline - expectedAmountUsd) < 0.05
}

export function findLatestResumableInvoice(
  invoices: PaymentInvoice[],
  now = Date.now()
): PaymentInvoice | null {
  return (
    invoices
      .filter((invoice) => isResumableInvoice(invoice, now))
      .sort(
        (left, right) =>
          Date.parse(right.created_at) - Date.parse(left.created_at)
      )[0] ?? null
  )
}

export function billingCycleForInvoice(
  invoice: PaymentInvoice
): BillingCycle | null {
  return billingForPlanId(invoice.plan_id)
}

export function paymentCurrencyForInvoice(
  invoice: PaymentInvoice,
  fallback: PaymentCurrency = "USDT"
): PaymentCurrency {
  if (isPaymentCurrency(invoice.currency)) return invoice.currency
  return fallback
}
