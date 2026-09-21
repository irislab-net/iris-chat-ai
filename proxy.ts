import createMiddleware from "next-intl/middleware"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { DEV_PORT, devProxyAction, hostnameFromHostHeader } from "@/lib/dev-access"
import { resolveHostRouting } from "@/lib/host-routing"
import { routing } from "@/i18n/routing"

const handleI18nRouting = createMiddleware(routing)

/**
 * Auth cookies need same-site with api.exur.ai (https + shared parent domain).
 * Loopback stays on local.exur.ai; LAN devices keep their Host and only upgrade HTTP.
 *
 * Production: exur.ai → landing, chat.exur.ai → desk (see lib/host-routing.ts).
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

  const hostname = hostnameFromHostHeader(request.headers.get("host") ?? "")
  const hostAction = resolveHostRouting({
    hostname,
    pathname: request.nextUrl.pathname,
    search: request.nextUrl.search,
  })

  if (hostAction.type === "redirect") {
    return NextResponse.redirect(hostAction.location, hostAction.status)
  }

  const response = handleI18nRouting(request)

  if (hostAction.type === "rewrite") {
    // Honor locale redirects from next-intl first; the follow-up request rewrites.
    if (response.headers.get("location")) {
      return response
    }

    const url = request.nextUrl.clone()
    url.pathname = hostAction.pathname
    const rewriteResponse = NextResponse.rewrite(url)
    response.cookies.getAll().forEach((cookie) => {
      rewriteResponse.cookies.set(cookie)
    })
    rewriteResponse.headers.set("x-pathname", hostAction.pathname)
    return rewriteResponse
  }

  response.headers.set("x-pathname", request.nextUrl.pathname)
  return response
}

export const config = {
  // Skip metadata / asset routes that have no locale (OG images crash without intl).
  matcher: [
    "/((?!api|auth|_next|_vercel|v1|opengraph-image|twitter-image|sitemap|robots|manifest\\.webmanifest|.*\\..*).*)",
  ],
}
