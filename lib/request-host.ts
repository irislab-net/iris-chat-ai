import { headers } from "next/headers"

import { hostnameFromHostHeader } from "@/lib/dev-access"
import { isMarketingHost } from "@/lib/hosts"

/** True when this request is on exur.ai / www (marketing apex). */
export async function isMarketingRequest(): Promise<boolean> {
  const h = await headers()
  // Prefer middleware `x-host` (set after Host normalization) over raw Host.
  const host = hostnameFromHostHeader(h.get("x-host") ?? h.get("host") ?? "")
  return isMarketingHost(host)
}
