/**
 * Shared first-party persistence across exur.ai subdomains (apex + chat).
 * Preview / localhost keep host-only cookies + localStorage.
 */

export const EXUR_SHARED_COOKIE_DOMAIN = ".exur.ai"

/** 1 year — common consent / legal acceptance TTL. */
export const EXUR_CLIENT_STORAGE_MAX_AGE_SECONDS = 365 * 24 * 60 * 60

export function getSharedCookieDomain(
  hostname = typeof window !== "undefined" ? window.location.hostname : ""
): string | null {
  if (!hostname) return null
  if (hostname === "exur.ai" || hostname.endsWith(".exur.ai")) {
    return EXUR_SHARED_COOKIE_DOMAIN
  }
  return null
}

export function readBrowserCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const prefix = `${encodeURIComponent(name)}=`
  for (const part of document.cookie.split(";")) {
    const trimmed = part.trim()
    if (!trimmed.startsWith(prefix)) continue
    try {
      return decodeURIComponent(trimmed.slice(prefix.length))
    } catch {
      return trimmed.slice(prefix.length)
    }
  }
  return null
}

export function writeBrowserCookie(
  name: string,
  value: string,
  maxAgeSeconds = EXUR_CLIENT_STORAGE_MAX_AGE_SECONDS
): void {
  if (typeof document === "undefined" || typeof window === "undefined") return

  const segments = [
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
    "Path=/",
    `Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}`,
    "SameSite=Lax",
  ]

  const domain = getSharedCookieDomain(window.location.hostname)
  if (domain) segments.push(`Domain=${domain}`)
  if (window.location.protocol === "https:") segments.push("Secure")

  document.cookie = segments.join("; ")
}

export function deleteBrowserCookie(name: string): void {
  if (typeof document === "undefined" || typeof window === "undefined") return

  const base = [
    `${encodeURIComponent(name)}=`,
    "Path=/",
    "Max-Age=0",
    "SameSite=Lax",
  ]
  document.cookie = base.join("; ")

  const domain = getSharedCookieDomain(window.location.hostname)
  if (domain) {
    document.cookie = [...base, `Domain=${domain}`].join("; ")
  }
}

/** Read localStorage, then shared cookie; hydrate localStorage when only cookie exists. */
export function readSharedJson(key: string): string | null {
  if (typeof window === "undefined") return null

  let fromStorage: string | null = null
  try {
    fromStorage = localStorage.getItem(key)
  } catch {
    fromStorage = null
  }
  if (fromStorage) {
    // Backfill parent-domain cookie so apex ↔ chat share later.
    if (!readBrowserCookie(key)) {
      writeBrowserCookie(key, fromStorage)
    }
    return fromStorage
  }

  const fromCookie = readBrowserCookie(key)
  if (!fromCookie) return null

  try {
    localStorage.setItem(key, fromCookie)
  } catch {
    // Private mode — cookie alone is still usable this session.
  }
  return fromCookie
}

export function writeSharedJson(
  key: string,
  value: string,
  maxAgeSeconds = EXUR_CLIENT_STORAGE_MAX_AGE_SECONDS
): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(key, value)
  } catch {
    // fall through to cookie
  }
  writeBrowserCookie(key, value, maxAgeSeconds)
}
