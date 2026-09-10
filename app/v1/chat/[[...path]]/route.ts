import { handleChatApiRoute } from "@/lib/api/chat-route"

type RouteContext = { params: Promise<{ path?: string[] }> }

function chatApiPath(segments?: string[]): string {
  if (!segments?.length) return "/v1/chat"
  return `/v1/chat/${segments.join("/")}`
}

async function route(req: Request, context: RouteContext) {
  const { path } = await context.params
  return handleChatApiRoute(req, chatApiPath(path))
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
