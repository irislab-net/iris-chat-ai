import type { UserTier } from "@/lib/api/types"

export type BillingCycle = "monthly" | "annual"
export type PlanKey = "free" | "plus" | "ultimate"
export type CheckoutPlan = "plus"

export const UPGRADE_PLANS = [
  {
    key: "free",
    name: "Free",
    eyebrow: "Get started",
    description:
      "Read the news desk with a capped co-pilot — enough to try the flow, not to run it all day.",
    features: [
      "Live market news",
      "Chat co-pilot with trade signal cards",
      "Daily co-pilot send limit",
      "Weekly usage cap",
    ],
  },
  {
    key: "plus",
    name: "Plus",
    eyebrow: "For active traders",
    description:
      "News, chat co-pilot, and trade signals in one desk.",
    features: [
      "Higher daily send allowance",
      "Raised weekly usage cap",
      "Exur co-pilot trade planning",
      "Trade signal cards in chat",
    ],
    featured: true,
    badge: "Most chosen",
  },
  {
    key: "ultimate",
    name: "Ultimate",
    eyebrow: "For desks & teams",
    description:
      "A tailored setup when Plus limits are not enough. We shape access with you.",
    features: [
      "Custom send and weekly limits",
      "Team onboarding and custom flows",
      "Priority research and rollout support",
      "Direct line for commercial requests",
    ],
  },
] as const

export function displayPlanName(
  tier?: UserTier | string | null
): "Free" | "Plus" | "Ultimate" {
  if (tier === "ultimate") return "Ultimate"
  if (tier === "pro") return "Plus"
  return "Free"
}

export function isCheckoutPlan(plan: string): plan is CheckoutPlan {
  return plan === "plus"
}

export function isBillingCycle(value: string): value is BillingCycle {
  return value === "monthly" || value === "annual"
}

export function stripePriceEnvName(billing: BillingCycle): string {
  return billing === "annual"
    ? "STRIPE_PRICE_PLUS_ANNUAL"
    : "STRIPE_PRICE_PLUS_MONTHLY"
}

export function resolvePlusPriceId(
  billing: BillingCycle,
  env: Record<string, string | undefined> = process.env
): string | null {
  const id = env[stripePriceEnvName(billing)]?.trim()
  return id || null
}

export function resolvePlusPaymentLink(
  billing: BillingCycle,
  env: Record<string, string | undefined> = process.env
): string | null {
  const key =
    billing === "annual"
      ? "NEXT_PUBLIC_STRIPE_PLUS_ANNUAL_URL"
      : "NEXT_PUBLIC_STRIPE_PLUS_MONTHLY_URL"
  const url = env[key]?.trim()
  return url || null
}
