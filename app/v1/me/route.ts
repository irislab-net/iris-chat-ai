import { proxyIrisApiRequest } from "@/lib/api/iris-api-route"

export async function GET(req: Request) {
  return proxyIrisApiRequest(req, "/v1/me")
}
