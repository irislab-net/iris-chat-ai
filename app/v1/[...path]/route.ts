import { handleV1ApiRoute } from "@/lib/api/v1-route"

type RouteContext = { params: Promise<{ path: string[] }> }

async function route(req: Request, context: RouteContext) {
  const { path } = await context.params
  return handleV1ApiRoute(req, path)
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
