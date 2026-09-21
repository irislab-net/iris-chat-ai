import { headers } from "next/headers"

import { hostnameFromHostHeader } from "@/lib/dev-access"
import { isMarketingHost } from "@/lib/hosts"

/** True when this request is on exur.ai / www (marketing apex). */
export async function isMarketingRequest(): Promise<boolean> {
  const host = hostnameFromHostHeader((await headers()).get("host") ?? "")
  return isMarketingHost(host)
}
