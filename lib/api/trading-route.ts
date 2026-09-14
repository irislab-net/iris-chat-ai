const DEV_STUBS: Record<string, () => unknown> = {
  "/v1/wallets": () => ({ wallets: [] }),
  "/v1/entitlements": () => ({ entitlements: [] }),
  "/v1/trading/hyperliquid/controls": () => ({
    global_execution_enabled: true,
    user_execution_enabled: true,
    disabled_markets: [],
  }),
  "/v1/trading/hyperliquid/signer/status": () => ({
    available: false,
    network: "testnet",
    wallet_identity_id: null,
    expires_at: null,
  }),
}

function normalizeApiPath(path: string): string {
  const [pathname] = path.split("?")
  return pathname.endsWith("/") && pathname !== "/"
    ? pathname.slice(0, -1)
    : pathname
}

function readIrisApiOrigin(): string {
  return process.env.IRIS_API_ORIGIN?.replace(/\/$/, "") ?? "https://api.exur.ai"
}

function resolveUpstream(): string | "stub" {
  if (process.env.NODE_ENV === "development") return "stub"
  return readIrisApiOrigin()
}

function stubResponse(req: Request, apiPath: string): Response {
  const pathname = normalizeApiPath(apiPath)
  const stub = DEV_STUBS[pathname]
  if (stub) {
    return Response.json({ data: stub() })
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    return Response.json(
      {
        error: "Trading API is not available yet.",
        code: "NOT_READY",
      },
      { status: 503 }
    )
  }

  return Response.json({ error: "Trading API route unavailable", code: "NOT_FOUND" }, { status: 404 })
}

async function proxyTradingRequest(req: Request, apiPath: string): Promise<Response> {
  const upstream = resolveUpstream()
  if (upstream === "stub") {
    return stubResponse(req, apiPath)
  }

  const requestUrl = new URL(req.url)
  const url = `${upstream}${apiPath}${requestUrl.search}`
  const headers = new Headers()
  const authorization = req.headers.get("authorization")
  if (authorization) headers.set("authorization", authorization)
  const contentType = req.headers.get("content-type")
  if (contentType) headers.set("content-type", contentType)

  const init: RequestInit = {
    method: req.method,
    headers,
    ...(req.method !== "GET" && req.method !== "HEAD"
      ? { body: await req.text() }
      : {}),
  }

  try {
    const res = await fetch(url, init)
    const responseHeaders = new Headers()
    const upstreamType = res.headers.get("content-type")
    if (upstreamType) responseHeaders.set("content-type", upstreamType)

    return new Response(res.body, {
      status: res.status,
      headers: responseHeaders,
    })
  } catch {
    return stubResponse(req, apiPath)
  }
}

export async function handleTradingApiRoute(
  req: Request,
  apiPath: string
): Promise<Response> {
  return proxyTradingRequest(req, apiPath)
}
