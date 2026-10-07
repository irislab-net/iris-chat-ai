import {
  isMarketingOnlyPath,
  isProductionChatHost,
  isSplitHost,
  MARKETING_ORIGIN,
  MARKETING_WWW_HOST,
  splitLocalePath,
} from "@/lib/hosts"

export type HostRouteAction =
  | { type: "next" }
  | { type: "redirect"; location: string; status: 308 }

function absoluteOn(origin: string, pathname: string, search: string): string {
  return `${origin}${pathname}${search}`
}

/**
 * Apex (exur.ai) and chat.exur.ai both serve the desk at `/`.
 * Landing lives only at exur.ai/home. Marketing pages stay on apex.
 * Local / preview hosts skip this and keep path-based routing.
 */
export function resolveHostRouting(input: {
  hostname: string
  pathname: string
  search: string
}): HostRouteAction {
  const { hostname, pathname, search } = input

  if (!isSplitHost(hostname)) return { type: "next" }

  // www → apex (same path)
  if (hostname === MARKETING_WWW_HOST) {
    return {
      type: "redirect",
      location: absoluteOn(MARKETING_ORIGIN, pathname, search),
      status: 308,
    }
  }

  // Marketing pages on chat host → apex (including /home landing)
  if (isProductionChatHost(hostname)) {
    const { pathnameWithoutLocale } = splitLocalePath(pathname)
    if (isMarketingOnlyPath(pathnameWithoutLocale)) {
      return {
        type: "redirect",
        location: absoluteOn(MARKETING_ORIGIN, pathname, search),
        status: 308,
      }
    }
  }

  return { type: "next" }
}
