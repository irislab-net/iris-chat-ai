import { CHAT_API_ORIGIN } from "@/lib/api/origins"

function normalizeApiPath(path: string): string {
  const [pathname] = path.split("?")
  return pathname.endsWith("/") && pathname !== "/"
    ? pathname.slice(0, -1)
    : pathname
}

function readChatApiOrigin(): string {
  return process.env.CHAT_API_ORIGIN?.replace(/\/$/, "") ?? CHAT_API_ORIGIN
}

function readGuestFallbackOrigin(): string | null {
  const raw = process.env.CHAT_API_GUEST_FALLBACK_ORIGIN?.replace(/\/$/, "")
  return raw || null
}

async function proxyChatRequest(
  req: Request,
  apiPath: string,
  origin: string,
  bodyText?: string
): Promise<Response> {
  const requestUrl = new URL(req.url)
  const url = `${origin}${apiPath}${requestUrl.search}`
  const headers = new Headers()
  const authorization = req.headers.get("authorization")
  if (authorization) headers.set("authorization", authorization)
  const contentType = req.headers.get("content-type")
  if (contentType) headers.set("content-type", contentType)
  const accept = req.headers.get("accept")
  if (accept) headers.set("accept", accept)
  const cookie = req.headers.get("cookie")
  if (cookie) headers.set("cookie", cookie)

  const init: RequestInit = {
    method: req.method,
    headers,
    ...(req.method !== "GET" && req.method !== "HEAD"
      ? { body: bodyText ?? (await req.text()) }
      : {}),
  }

  let res: Response
  try {
    res = await fetch(url, init)
  } catch {
    return Response.json(
      {
        code: "upstream_unreachable",
        error: "Chat service is temporarily unavailable.",
        success: "false",
      },
      {
        status: 503,
        headers: { "x-iris-chat-proxy": origin },
      }
    )
  }

  const responseHeaders = new Headers()
  responseHeaders.set("x-iris-chat-proxy", origin)
  const upstreamType = res.headers.get("content-type")
  if (upstreamType) responseHeaders.set("content-type", upstreamType)
  const accel = res.headers.get("x-accel-buffering")
  if (accel) responseHeaders.set("x-accel-buffering", accel)
  // Keep SSE responses unbuffered through CDNs / reverse proxies.
  if (upstreamType?.includes("text/event-stream")) {
    responseHeaders.set("cache-control", "no-cache, no-transform")
    responseHeaders.set("x-accel-buffering", "no")
  }

  return new Response(res.body, {
    status: res.status,
    headers: responseHeaders,
  })
}

async function readJsonBody(response: Response): Promise<Record<string, unknown>> {
  try {
    const body = await response.json()
    return body && typeof body === "object" ? (body as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

function isGuestUnavailableResponse(status: number, body: Record<string, unknown>) {
  return status === 503 && body.code === "guest_unavailable"
}

export async function handleChatApiRoute(
  req: Request,
  apiPath: string
): Promise<Response> {
  const primaryOrigin = readChatApiOrigin()
  const fallbackOrigin = readGuestFallbackOrigin()
  const pathname = normalizeApiPath(apiPath)
  const bodyText =
    req.method !== "GET" && req.method !== "HEAD" ? await req.text() : undefined

  let response = await proxyChatRequest(req, apiPath, primaryOrigin, bodyText)

  if (
    fallbackOrigin &&
    fallbackOrigin !== primaryOrigin &&
    pathname === "/v1/chat/guest/session" &&
    req.method === "POST"
  ) {
    const body = await readJsonBody(response.clone())
    if (isGuestUnavailableResponse(response.status, body)) {
      response = await proxyChatRequest(req, apiPath, fallbackOrigin, bodyText)
    }
  }

  return response
}
