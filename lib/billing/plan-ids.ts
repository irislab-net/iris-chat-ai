import type { BillingCycle } from "@/lib/billing/catalog"

const PLAN_IDS: Record<BillingCycle, string> = {
  monthly: "pro_monthly",
  annual: "pro_annual",
}

const BILLING_BY_PLAN_ID = Object.fromEntries(
  Object.entries(PLAN_IDS).map(([billing, planId]) => [planId, billing])
) as Record<string, BillingCycle>

export function planIdForBilling(billing: BillingCycle): string {
  return PLAN_IDS[billing]
}

export function billingForPlanId(planId: string): BillingCycle | null {
  return BILLING_BY_PLAN_ID[planId] ?? null
}
