import { APP_METADATA_ICON_URL, APP_METADATA_URL } from "@/config/env"

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, "")
}

/** Active page origin when running in a browser; otherwise the configured canonical URL. */
export function resolveWalletConnectPageOrigin(): string {
  if (typeof window === "undefined") return APP_METADATA_URL
  return stripTrailingSlash(window.location.origin)
}

/**
 * WalletConnect requires `metadata.url` to match the page the user is on.
 * Use the live origin whenever it differs from the env canonical URL (local dev,
 * preview hosts, staging).
 */
export function resolveWalletConnectMetadataUrl(): string {
  const pageOrigin = resolveWalletConnectPageOrigin()
  const canonical = stripTrailingSlash(APP_METADATA_URL)
  return pageOrigin !== canonical ? pageOrigin : canonical
}

/**
 * Post-approval redirect target for mobile wallets. Dev / mismatched hosts must
 * return to the active page (origin + path) so Trust/Safari resume the same SPA
 * route; production keeps the canonical env URL.
 */
export function resolveWalletConnectRedirectUniversal(): string {
  if ((process.env.NODE_ENV !== 'production') && typeof window !== "undefined") {
    const { origin, pathname } = window.location
    const path = pathname && pathname !== "/" ? pathname : ""
    return `${stripTrailingSlash(origin)}${path}`
  }
  return stripTrailingSlash(APP_METADATA_URL)
}

/** Keep icon on the same host as `metadata.url` when only the origin differs. */
export function resolveWalletConnectIconUrl(metadataUrl: string): string {
  try {
    const icon = new URL(APP_METADATA_ICON_URL)
    const canonical = new URL(APP_METADATA_URL)
    const page = new URL(metadataUrl)
    if (icon.origin === canonical.origin && page.origin !== canonical.origin) {
      return `${page.origin}${icon.pathname}`
    }
  } catch {
    // Fall through to env value.
  }
  return APP_METADATA_ICON_URL
}
