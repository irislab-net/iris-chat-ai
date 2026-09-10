import { handleTradingApiRoute } from "@/lib/api/trading-route"

type RouteContext = { params: Promise<{ path?: string[] }> }

function tradingApiPath(segments?: string[]): string {
  if (!segments?.length) return "/v1/trading"
  return `/v1/trading/${segments.join("/")}`
}

async function route(req: Request, context: RouteContext) {
  const { path } = await context.params
  return handleTradingApiRoute(req, tradingApiPath(path))
}

export async function GET(req: Request, context: RouteContext) {
  return route(req, context)
}

export async function POST(req: Request, context: RouteContext) {
  return route(req, context)
}
