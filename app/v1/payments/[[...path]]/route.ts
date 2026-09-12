import { proxyIrisApiRequest } from "@/lib/api/iris-api-route"

type RouteContext = { params: Promise<{ path?: string[] }> }

function paymentsApiPath(segments?: string[]): string {
  if (!segments?.length) return "/v1/payments"
  return `/v1/payments/${segments.join("/")}`
}

async function route(req: Request, context: RouteContext) {
  const { path } = await context.params
  return proxyIrisApiRequest(req, paymentsApiPath(path))
}

export async function GET(req: Request, context: RouteContext) {
  return route(req, context)
}

export async function POST(req: Request, context: RouteContext) {
  return route(req, context)
}

export async function PUT(req: Request, context: RouteContext) {
  return route(req, context)
}

export async function PATCH(req: Request, context: RouteContext) {
  return route(req, context)
}

export async function DELETE(req: Request, context: RouteContext) {
  return route(req, context)
}
