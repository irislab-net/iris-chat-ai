import { handleTradingApiRoute } from "@/lib/api/trading-route"

type RouteContext = { params: Promise<{ path?: string[] }> }

function walletApiPath(segments?: string[]): string {
  if (!segments?.length) return "/v1/wallet"
  return `/v1/wallet/${segments.join("/")}`
}

async function route(req: Request, context: RouteContext) {
  const { path } = await context.params
  return handleTradingApiRoute(req, walletApiPath(path))
}

export async function GET(req: Request, context: RouteContext) {
  return route(req, context)
}

export async function POST(req: Request, context: RouteContext) {
  return route(req, context)
}

export async function DELETE(req: Request, context: RouteContext) {
  return route(req, context)
}
