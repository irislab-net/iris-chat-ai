import { IRIS_API_ORIGIN } from "@/lib/api/origins"

function readIrisApiOrigin(): string {
  return process.env.IRIS_API_ORIGIN?.replace(/\/$/, "") ?? IRIS_API_ORIGIN
}

function cookieHasName(cookieHeader: string | null, name: string): boolean {
  if (!cookieHeader) return false
  for (const part of cookieHeader.split(";")) {
    const key = part.trim().split("=")[0]
    if (key === name) return true
  }
  return false
}

function forwardSetCookie(upstream: Headers, downstream: Headers) {
  if (typeof upstream.getSetCookie === "function") {
    for (const cookie of upstream.getSetCookie()) {
      downstream.append("set-cookie", cookie)
    }
    return
  }
  const single = upstream.get("set-cookie")
  if (single) downstream.set("set-cookie", single)
}

/** Same-origin proxy to api.exur.ai — forwards auth cookies both ways. */
export async function proxyIrisApiRequest(
  req: Request,
  apiPath: string
): Promise<Response> {
  // Guests have no refresh cookie — avoid proxying a guaranteed 400 that
  // Chrome logs as a console error (hurts Lighthouse Best Practices).
  if (
    apiPath === "/v1/auth/refresh" &&
    req.method === "POST" &&
    !cookieHasName(req.headers.get("cookie"), "refresh_token")
  ) {
    return new Response(null, { status: 204 })
  }

  const origin = readIrisApiOrigin()
  const requestUrl = new URL(req.url)
  const url = `${origin}${apiPath}${requestUrl.search}`
  const headers = new Headers()
  const authorization = req.headers.get("authorization")
  if (authorization) headers.set("authorization", authorization)
  const contentType = req.headers.get("content-type")
  if (contentType) headers.set("content-type", contentType)
  const cookie = req.headers.get("cookie")
  if (cookie) headers.set("cookie", cookie)

  const init: RequestInit = {
    method: req.method,
    headers,
    ...(req.method !== "GET" && req.method !== "HEAD"
      ? { body: await req.text() }
      : {}),
  }

  let res: Response
  try {
    res = await fetch(url, init)
  } catch {
    return Response.json(
      { error: "API is not reachable.", code: "upstream_unreachable" },
      { status: 503 }
    )
  }

  const responseHeaders = new Headers()
  const upstreamType = res.headers.get("content-type")
  if (upstreamType) responseHeaders.set("content-type", upstreamType)
  forwardSetCookie(res.headers, responseHeaders)

  return new Response(res.body, {
    status: res.status,
    headers: responseHeaders,
  })
}
