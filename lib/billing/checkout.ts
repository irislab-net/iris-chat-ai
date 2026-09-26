import {
  isBillingCycle,
  isCheckoutPlan,
  resolvePlusPriceId,
  type BillingCycle,
} from "@/lib/billing/catalog"
import { UPGRADE_PATH } from "@/lib/site"
import { appPathWithTab, WORKSPACE_TAB_NEWS } from "@/lib/workspace-tab"

export type CheckoutRequestBody = {
  plan: string
  billing: string
  userId?: string
  email?: string | null
}

export function parseCheckoutBody(body: unknown): {
  plan: "plus"
  billing: BillingCycle
  userId?: string
  email?: string
} {
  if (!body || typeof body !== "object") {
    throw new CheckoutError("Invalid checkout request", 400)
  }
  const { plan, billing, userId, email } = body as CheckoutRequestBody
  if (!isCheckoutPlan(plan)) {
    throw new CheckoutError("Only Plus can be checked out with Stripe", 400)
  }
  if (!isBillingCycle(billing)) {
    throw new CheckoutError("Choose monthly or annual billing", 400)
  }
  return {
    plan,
    billing,
    userId:
      typeof userId === "string" && userId.trim() ? userId.trim() : undefined,
    email:
      typeof email === "string" && email.includes("@")
        ? email.trim()
        : undefined,
  }
}

export class CheckoutError extends Error {
  status: number

  constructor(message: string, status = 400) {
    super(message)
    this.name = "CheckoutError"
    this.status = status
  }
}

export async function createPlusCheckoutSession(input: {
  billing: BillingCycle
  origin: string
  userId?: string
  email?: string
}): Promise<{ url: string }> {
  const secret = process.env.STRIPE_SECRET_KEY?.trim()
  if (!secret) {
    throw new CheckoutError(
      "Stripe is not configured. Set STRIPE_SECRET_KEY and Plus price IDs.",
      503
    )
  }

  const priceId = resolvePlusPriceId(input.billing)
  if (!priceId) {
    throw new CheckoutError(
      `Missing ${input.billing === "annual" ? "STRIPE_PRICE_PLUS_ANNUAL" : "STRIPE_PRICE_PLUS_MONTHLY"}.`,
      503
    )
  }

  const origin = input.origin.replace(/\/$/, "")
  const params = new URLSearchParams({
    mode: "subscription",
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    success_url: `${origin}${appPathWithTab(WORKSPACE_TAB_NEWS, { checkout: "success" })}`,
    cancel_url: `${origin}${UPGRADE_PATH}`,
    allow_promotion_codes: "true",
  })

  if (input.userId) {
    params.set("client_reference_id", input.userId)
    params.set("metadata[user_id]", input.userId)
    params.set("subscription_data[metadata][user_id]", input.userId)
  }
  params.set("metadata[plan]", "plus")
  params.set("metadata[billing]", input.billing)
  if (input.email) {
    params.set("customer_email", input.email)
  }

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  })

  const data = (await res.json().catch(() => ({}))) as {
    url?: string
    error?: { message?: string }
  }

  if (!res.ok || !data.url) {
    throw new CheckoutError(
      data.error?.message || "Could not start Stripe Checkout",
      res.status >= 400 && res.status < 600 ? res.status : 502
    )
  }

  return { url: data.url }
}
