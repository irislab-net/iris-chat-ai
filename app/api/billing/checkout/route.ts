import {
  CheckoutError,
  createPlusCheckoutSession,
  parseCheckoutBody,
} from "@/lib/billing/checkout"

export async function POST(request: Request) {
  try {
    const parsed = parseCheckoutBody(await request.json().catch(() => null))
    const origin = new URL(request.url).origin
    const session = await createPlusCheckoutSession({
      billing: parsed.billing,
      origin,
      userId: parsed.userId,
      email: parsed.email,
    })
    return Response.json({ url: session.url })
  } catch (error) {
    const status = error instanceof CheckoutError ? error.status : 500
    const message =
      error instanceof Error ? error.message : "Could not start checkout"
    return Response.json({ error: message }, { status })
  }
}
