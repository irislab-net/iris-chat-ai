import createMiddleware from "next-intl/middleware"
import { NextRequest, NextResponse } from "next/server"

import { DEV_PORT, devProxyAction, hostnameFromHostHeader } from "@/lib/dev-access"
import { resolveHostRouting } from "@/lib/host-routing"
import { routing } from "@/i18n/routing"

const handleI18nRouting = createMiddleware(routing)

/**
 * Auth cookies need same-site with api.exur.ai (https + shared parent domain).
 * Loopback stays on local.exur.ai; LAN devices keep their Host and only upgrade HTTP.
 *
 * Production: exur.ai `/` and chat.exur.ai `/` = desk; landing at exur.ai/home.
 */
export function proxy(request: NextRequest) {
  const forwardedProto = request.headers.get("x-forwarded-proto")
  const isProd = process.env.NODE_ENV === "production"
  if (
    isProd &&
    (forwardedProto === "http" || request.nextUrl.protocol === "http:")
  ) {
    const httpsUrl = request.nextUrl.clone()
    httpsUrl.protocol = "https:"
    return NextResponse.redirect(httpsUrl, 301)
  }

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
  response.headers.set("x-pathname", request.nextUrl.pathname)
  response.headers.set("x-host", hostname)
  return response
}

export const config = {
  // Skip metadata / asset / binary proxy routes that have no locale
  // (OG images crash without intl; /media/* is the narration audio proxy).
  matcher: [
    "/((?!api|auth|media|_next|_vercel|v1|opengraph-image|twitter-image|sitemap|robots|manifest\\.webmanifest|.*\\..*).*)",
  ],
}
