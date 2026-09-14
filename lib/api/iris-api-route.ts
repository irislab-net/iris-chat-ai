import { IRIS_API_ORIGIN } from "@/lib/api/origins"

function readIrisApiOrigin(): string {
  return process.env.IRIS_API_ORIGIN?.replace(/\/$/, "") ?? IRIS_API_ORIGIN
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
