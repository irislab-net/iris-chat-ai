import createMiddleware from "next-intl/middleware"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { DEV_PORT, devProxyAction, hostnameFromHostHeader } from "@/lib/dev-access"
import { routing } from "@/i18n/routing"

const handleI18nRouting = createMiddleware(routing)

/**
 * Auth cookies need same-site with api.irislab.info (https + *.irislab.info).
 * Loopback stays on local.irislab.info; LAN devices keep their Host and only upgrade HTTP.
 */
export function proxy(request: NextRequest) {
  if (process.env.NODE_ENV === "development") {
    const host = request.headers.get("host") ?? ""
    const proto = request.headers.get("x-forwarded-proto")
    const isHttps = request.nextUrl.protocol === "https:" || proto === "https"
    const action = devProxyAction({
      hostname: hostnameFromHostHeader(host),
      isHttps,
    })

    if (action.type === "redirect") {
      const url = request.nextUrl.clone()
      url.protocol = action.protocol
      url.hostname = action.hostname
      url.port = action.port || DEV_PORT
      return NextResponse.redirect(url)
    }
  }

  return handleI18nRouting(request)
}

export const config = {
  matcher: ["/((?!api|auth|_next|_vercel|v1|.*\\..*).*)"],
}
