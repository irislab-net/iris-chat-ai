/**
 * Cache-bust token for favicons / PWA icons / organization logo.
 * Bump when the Exur mark changes so browsers and search crawlers
 * fetch a fresh URL instead of a stale Iris-era cache entry.
 */
export const BRAND_ICON_VERSION = "exur-20260925"

/** Append `?v=` to a root-relative icon path. */
export function brandIconUrl(path: string): string {
  const base = path.startsWith("/") ? path : `/${path}`
  const join = base.includes("?") ? "&" : "?"
  return `${base}${join}v=${BRAND_ICON_VERSION}`
}
