import { apiJson } from "@/lib/api/client"
import type { BillingCycle } from "@/lib/billing/catalog"
import { planIdForBilling } from "@/lib/billing/plan-ids"
import { formatUsd } from "@/lib/billing/prices"

export type PaymentPlan = {
  id: string
  name: string
  tier: string
  billing_cycle: string
  duration_days: number
  price_usd: number
}

function unwrapPlans(body: unknown): PaymentPlan[] {
  if (Array.isArray(body)) return body as PaymentPlan[]
  if (!body || typeof body !== "object") return []
  const record = body as Record<string, unknown>
  if (Array.isArray(record.data)) return record.data as PaymentPlan[]
  if (Array.isArray(record.plans)) return record.plans as PaymentPlan[]
  return []
}

export async function fetchPaymentPlans(): Promise<PaymentPlan[]> {
  const body = await apiJson<unknown>("/v1/payments/plans")
  return unwrapPlans(body).filter(
    (plan) =>
      typeof plan?.id === "string" &&
      plan.id.trim() &&
      Number.isFinite(plan.price_usd)
  )
}

export function findPaymentPlan(
  plans: PaymentPlan[],
  planId: string
): PaymentPlan | null {
  return plans.find((plan) => plan.id === planId) ?? null
}

export function priceUsdForPlanId(
  plans: PaymentPlan[],
  planId: string
): number | null {
  const plan = findPaymentPlan(plans, planId)
  if (!plan || !Number.isFinite(plan.price_usd)) return null
  return plan.price_usd
}

export function plusPriceUsdFromPlans(
  plans: PaymentPlan[],
  billing: BillingCycle = "monthly"
): number | null {
  return priceUsdForPlanId(plans, planIdForBilling(billing))
}

export function formatPlanPriceUsd(
  amount: number | null | undefined
): string | null {
  if (amount === null || amount === undefined || !Number.isFinite(amount)) {
    return null
  }
  return formatUsd(amount)
}
