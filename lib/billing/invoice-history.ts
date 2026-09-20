import type { PaymentInvoice } from "@/lib/billing/invoice-types"
import { billingForPlanId } from "@/lib/billing/plan-ids"

export function normalizeInvoiceStatus(
  status: string | undefined
): "pending" | "paid" | "failed" | "expired" | "unknown" {
  const key = (status ?? "").trim().toLowerCase()
  if (key === "pending" || key === "paid" || key === "failed" || key === "expired") {
    return key
  }
  return "unknown"
}

export function isPaidInvoice(invoice: PaymentInvoice): boolean {
  return normalizeInvoiceStatus(invoice.status) === "paid"
}

export function sortInvoicesNewestFirst(
  invoices: PaymentInvoice[]
): PaymentInvoice[] {
  return [...invoices].sort((a, b) => {
    const aTime = Date.parse(a.created_at) || 0
    const bTime = Date.parse(b.created_at) || 0
    return bTime - aTime
  })
}

export function invoiceHistoryRows(
  invoices: PaymentInvoice[]
): PaymentInvoice[] {
  return sortInvoicesNewestFirst(invoices)
}

export function paymentHistoryRows(
  invoices: PaymentInvoice[]
): PaymentInvoice[] {
  return sortInvoicesNewestFirst(invoices.filter(isPaidInvoice))
}

export function formatInvoicePlanLabel(planId: string): string {
  const cycle = billingForPlanId(planId)
  if (cycle === "monthly") return "Plus · Monthly"
  if (cycle === "annual") return "Plus · Annual"
  return planId.replace(/_/g, " ")
}

export function formatInvoiceUsd(amount: number): string {
  if (!Number.isFinite(amount)) return "—"
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatInvoiceDate(value?: string | null): string {
  if (!value) return "—"
  const ms = Date.parse(value)
  if (!Number.isFinite(ms)) return "—"
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(ms))
}
