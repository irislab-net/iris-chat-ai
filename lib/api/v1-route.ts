import { handleChatApiRoute } from "@/lib/api/chat-route"
import { proxyIrisApiRequest } from "@/lib/api/iris-api-route"
import { handleTradingApiRoute } from "@/lib/api/trading-route"

export function v1ApiPath(segments: string[]): string {
  if (!segments.length) return "/v1"
  return `/v1/${segments.join("/")}`
}

/** Single /v1 entrypoint for Cloudflare — avoids brittle external rewrites. */
export async function handleV1ApiRoute(
  req: Request,
  segments: string[]
): Promise<Response> {
  const path = v1ApiPath(segments)
  const root = segments[0]

  if (root === "chat") {
    return handleChatApiRoute(req, path)
  }

  if (
    root === "trading" ||
    (root === "wallets" && segments.length === 1) ||
    (root === "entitlements" && segments.length === 1)
  ) {
    return handleTradingApiRoute(req, path)
  }

  return proxyIrisApiRequest(req, path)
}
