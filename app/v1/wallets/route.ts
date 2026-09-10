import { handleTradingApiRoute } from "@/lib/api/trading-route"

export async function GET(req: Request) {
  return handleTradingApiRoute(req, "/v1/wallets")
}
