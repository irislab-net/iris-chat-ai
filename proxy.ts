import createMiddleware from "next-intl/middleware"
import { NextRequest, NextResponse } from "next/server"

import { DEV_PORT, devProxyAction, hostnameFromHostHeader } from "@/lib/dev-access"
import { resolveHostRouting } from "@/lib/host-routing"
import { routing } from "@/i18n/routing"

const handleI18nRouting = createMiddleware(routing)

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie)
  })
}

/**
 * Auth cookies need same-site with api.exur.ai (https + shared parent domain).
 * Loopback stays on local.exur.ai; LAN devices keep their Host and only upgrade HTTP.
 *
 * Production: exur.ai `/` = landing (rewrite → `/home`), chat.exur.ai `/` = desk.
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

  if (hostAction.type === "rewrite") {
    const rewriteUrl = request.nextUrl.clone()
    rewriteUrl.pathname = hostAction.pathname
    // Run i18n against the rewrite target so locale cookies/headers apply.
    const i18nRequest = new NextRequest(rewriteUrl, request)
    const i18nResponse = handleI18nRouting(i18nRequest)

    // Honor locale redirects from next-intl (map /home → public `/`).
    const location = i18nResponse.headers.get("location")
    if (location) {
      try {
        const loc = new URL(location, request.url)
        const stripped = loc.pathname
          .replace(/\/home\/?$/, "/")
          .replace(/\/home\//, "/")
        if (stripped !== loc.pathname) {
          loc.pathname = stripped === "" ? "/" : stripped
          return NextResponse.redirect(loc, i18nResponse.status as 307 | 308)
        }
      } catch {
        // fall through to raw i18n redirect
      }
      return i18nResponse
    }

    const response = NextResponse.rewrite(rewriteUrl)
    copyCookies(i18nResponse, response)
    response.headers.set("x-pathname", request.nextUrl.pathname)
    response.headers.set("x-host", hostname)
    // CDN-friendly marketing HTML (URL stays `/`; segment is `/home`).
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=900, stale-while-revalidate=86400"
    )
    return response
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
