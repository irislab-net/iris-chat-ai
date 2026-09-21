import {
  CHAT_APP_ORIGIN,
  isChatDeskSearch,
  isChatOnlyPath,
  isMarketingHost,
  isMarketingOnlyPath,
  isProductionChatHost,
  isSplitHost,
  MARKETING_HOST,
  MARKETING_ORIGIN,
  MARKETING_WWW_HOST,
  splitLocalePath,
  withLocalePrefix,
} from "@/lib/hosts"

export type HostRouteAction =
  | { type: "next" }
  | { type: "redirect"; location: string; status: 308 }
  | { type: "rewrite"; pathname: string }

function absoluteOn(origin: string, pathname: string, search: string): string {
  return `${origin}${pathname}${search}`
}

/**
 * Apex (exur.ai) = landing; chat.exur.ai = desk.
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

  const { localePrefix, pathnameWithoutLocale } = splitLocalePath(pathname)

  if (isMarketingHost(hostname) && hostname === MARKETING_HOST) {
    if (isChatOnlyPath(pathnameWithoutLocale)) {
      return {
        type: "redirect",
        location: absoluteOn(CHAT_APP_ORIGIN, pathname, search),
        status: 308,
      }
    }

    // Legacy /home → canonical landing at /
    if (
      pathnameWithoutLocale === "/home" ||
      pathnameWithoutLocale.startsWith("/home/")
    ) {
      const rest =
        pathnameWithoutLocale === "/home"
          ? "/"
          : pathnameWithoutLocale.slice("/home".length) || "/"
      return {
        type: "redirect",
        location: absoluteOn(
          MARKETING_ORIGIN,
          withLocalePrefix(localePrefix, rest),
          search
        ),
        status: 308,
      }
    }

    // Launch App / handoff query on marketing root → chat desk
    if (
      pathnameWithoutLocale === "/" &&
      isChatDeskSearch(search)
    ) {
      return {
        type: "redirect",
        location: absoluteOn(CHAT_APP_ORIGIN, pathname, search),
        status: 308,
      }
    }

    // Clean marketing root → internal /home page
    if (pathnameWithoutLocale === "/") {
      return {
        type: "rewrite",
        pathname: withLocalePrefix(localePrefix, "/home"),
      }
    }

    return { type: "next" }
  }

  if (isProductionChatHost(hostname)) {
    if (isMarketingOnlyPath(pathnameWithoutLocale)) {
      // /home → apex / ; other marketing pages keep their path on apex
      const targetPath =
        pathnameWithoutLocale === "/home" ||
        pathnameWithoutLocale.startsWith("/home/")
          ? withLocalePrefix(
              localePrefix,
              pathnameWithoutLocale === "/home"
                ? "/"
                : pathnameWithoutLocale.slice("/home".length) || "/"
            )
          : pathname
      return {
        type: "redirect",
        location: absoluteOn(MARKETING_ORIGIN, targetPath, search),
        status: 308,
      }
    }
  }

  return { type: "next" }
}
