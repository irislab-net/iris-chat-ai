import { apiJson } from "@/lib/api/client"
import type { BillingCycle } from "@/lib/billing/catalog"
import type {
  CreateInvoiceBody,
  PaymentCurrency,
  PaymentInvoice,
  StartPlusCheckoutInput,
} from "@/lib/billing/invoice-types"
import { isPaymentCurrency } from "@/lib/billing/invoice-types"
import { planIdForBilling } from "@/lib/billing/plan-ids"
import {
  fetchPaymentPlans,
  priceUsdForPlanId,
} from "@/lib/billing/plans"
import { findResumableInvoice } from "@/lib/billing/invoice-session"

export class InvoiceError extends Error {
  status: number

  constructor(message: string, status = 400) {
    super(message)
    this.name = "InvoiceError"
    this.status = status
  }
}

function readApiError(body: unknown, fallback: string): string {
  if (!body || typeof body !== "object") return fallback
  const record = body as Record<string, unknown>
  if (typeof record.error === "string" && record.error.trim()) return record.error
  if (typeof record.message === "string" && record.message.trim()) return record.message
  return fallback
}

function unwrapInvoiceList(body: unknown): PaymentInvoice[] {
  if (Array.isArray(body)) return body as PaymentInvoice[]
  if (!body || typeof body !== "object") return []
  const record = body as Record<string, unknown>
  const data = record.data
  if (Array.isArray(data)) return data as PaymentInvoice[]
  if (data && typeof data === "object") {
    const nested = (data as Record<string, unknown>).invoices
    if (Array.isArray(nested)) return nested as PaymentInvoice[]
  }
  const invoices = record.invoices
  if (Array.isArray(invoices)) return invoices as PaymentInvoice[]
  return []
}

export function buildCreateInvoiceBody(input: {
  billing: BillingCycle
  couponCode?: string
  currency?: PaymentCurrency
}): CreateInvoiceBody {
  const coupon = input.couponCode?.trim()
  const currency = input.currency ?? "USDT"
  if (!isPaymentCurrency(currency)) {
    throw new InvoiceError("Only USDT or USDC are supported", 400)
  }
  const body: CreateInvoiceBody = {
    plan_id: planIdForBilling(input.billing),
    currency,
  }
  if (coupon) body.coupon_code = coupon
  return body
}

export async function createPaymentInvoice(
  body: CreateInvoiceBody
): Promise<PaymentInvoice> {
  try {
    return await apiJson<PaymentInvoice>("/v1/payments/invoices", {
      method: "POST",
      body: JSON.stringify(body),
    })
  } catch (error) {
    const status =
      error && typeof error === "object" && "status" in error
        ? Number((error as { status?: number }).status) || 500
        : 500
    const message =
      error && typeof error === "object" && "body" in error
        ? readApiError((error as { body?: unknown }).body, "Could not create invoice")
        : error instanceof Error
          ? error.message
          : "Could not create invoice"
    throw new InvoiceError(message, status)
  }
}

export async function listPaymentInvoices(): Promise<PaymentInvoice[]> {
  try {
    const body = await apiJson<unknown>("/v1/payments/invoices")
    return unwrapInvoiceList(body)
  } catch (error) {
    const status =
      error && typeof error === "object" && "status" in error
        ? Number((error as { status?: number }).status) || 500
        : 500
    const message =
      error && typeof error === "object" && "body" in error
        ? readApiError((error as { body?: unknown }).body, "Could not load invoices")
        : error instanceof Error
          ? error.message
          : "Could not load invoices"
    throw new InvoiceError(message, status)
  }
}

export async function fetchPaymentInvoice(uid: string): Promise<PaymentInvoice | null> {
  const invoices = await listPaymentInvoices()
  return invoices.find((invoice) => invoice.uid === uid) ?? null
}

export async function startPlusCryptoCheckout(
  input: StartPlusCheckoutInput
): Promise<PaymentInvoice> {
  const body = buildCreateInvoiceBody(input)
  return createPaymentInvoice(body)
}

export async function resolvePlusCryptoCheckout(
  input: StartPlusCheckoutInput
): Promise<PaymentInvoice> {
  const body = buildCreateInvoiceBody(input)
  const plans = await fetchPaymentPlans().catch(() => [])
  const expectedAmountUsd = priceUsdForPlanId(plans, body.plan_id) ?? undefined
  const existing = await listPaymentInvoices()
  const resumable = findResumableInvoice(existing, {
    planId: body.plan_id,
    currency: body.currency,
    couponCode: body.coupon_code,
    expectedAmountUsd,
  })
  // Prefer a catalog-priced invoice. Skip stale amounts and mint a fresh quote.
  if (resumable) return resumable
  return createPaymentInvoice(body)
}
