/**
 * Parse tokens / status from the extension OAuth callback URL.
 *
 * Backend should redirect to:
 *   chrome-extension://<id>/callback.html#access_token=…&refresh_token=…&expires_at=…
 * or the same fields in the query string, optionally with
 *   login_success=true | login=success | status=success
 */

import { isLikelyJwt } from "@/lib/api/auth"
import type { TokenPair } from "@/lib/api/types"

export type AuthCallbackResult =
  | { ok: true; pair: TokenPair }
  | { ok: false; error: string }

const SUCCESS_FLAGS = new Set([
  "1",
  "true",
  "yes",
  "ok",
  "success",
  "login_success",
  "signed_in",
])

function mergeUrlParams(url: URL): URLSearchParams {
  const params = new URLSearchParams(url.search)
  const hash = url.hash.replace(/^#/, "")
  if (hash) {
    const hashParams = new URLSearchParams(
      hash.includes("=") ? hash : hash.startsWith("?") ? hash.slice(1) : hash
    )
    for (const [key, value] of hashParams.entries()) {
      params.set(key, value)
    }
  }
  return params
}

function readJsonBlob(params: URLSearchParams): Record<string, unknown> | null {
  for (const key of ["data", "session", "tokens", "auth"]) {
    const raw = params.get(key)
    if (!raw) continue
    try {
      const parsed = JSON.parse(raw) as unknown
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>
      }
    } catch {
      try {
        const parsed = JSON.parse(decodeURIComponent(raw)) as unknown
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          return parsed as Record<string, unknown>
        }
      } catch {
        // ignore malformed blobs
      }
    }
  }
  return null
}

function pickString(
  source: Record<string, unknown> | null,
  params: URLSearchParams,
  keys: string[]
): string | null {
  for (const key of keys) {
    const fromParams = params.get(key)
    if (fromParams?.trim()) return fromParams.trim()
    const fromBlob = source?.[key]
    if (typeof fromBlob === "string" && fromBlob.trim()) return fromBlob.trim()
  }
  return null
}

function resolveExpiresAt(
  expiresAt: string | null,
  expiresIn: string | null
): string {
  if (expiresAt && !Number.isNaN(Date.parse(expiresAt))) return expiresAt
  const seconds = expiresIn ? Number(expiresIn) : NaN
  if (Number.isFinite(seconds) && seconds > 0) {
    return new Date(Date.now() + seconds * 1000).toISOString()
  }
  // Default 1h when API only returns tokens.
  return new Date(Date.now() + 3600_000).toISOString()
}

function isSuccessFlag(params: URLSearchParams): boolean {
  for (const key of [
    "login_success",
    "login",
    "status",
    "auth",
    "result",
    "state",
  ]) {
    const value = params.get(key)?.trim().toLowerCase()
    if (value && SUCCESS_FLAGS.has(value)) return true
  }
  return false
}

export function parseAuthCallbackUrl(
  href = typeof window !== "undefined" ? window.location.href : ""
): AuthCallbackResult {
  let url: URL
  try {
    url = new URL(href)
  } catch {
    return { ok: false, error: "Invalid callback URL" }
  }

  const params = mergeUrlParams(url)
  const blob = readJsonBlob(params)

  const error =
    pickString(blob, params, [
      "error_description",
      "error",
      "message",
      "detail",
    ]) ?? null
  if (error && !pickString(blob, params, ["access_token"])) {
    return { ok: false, error }
  }

  const accessToken = pickString(blob, params, [
    "access_token",
    "accessToken",
  ])
  const refreshToken = pickString(blob, params, [
    "refresh_token",
    "refreshToken",
  ])
  const expiresAt = pickString(blob, params, ["expires_at", "expiresAt"])
  const expiresIn = pickString(blob, params, ["expires_in", "expiresIn"])

  if (!accessToken) {
    if (isSuccessFlag(params)) {
      return {
        ok: false,
        error:
          "Sign-in succeeded but no access token was returned. Ask the API to include tokens on the extension callback.",
      }
    }
    return {
      ok: false,
      error: "Missing access token on the OAuth callback.",
    }
  }

  if (!isLikelyJwt(accessToken)) {
    return { ok: false, error: "Invalid access token shape" }
  }

  return {
    ok: true,
    pair: {
      access_token: accessToken,
      expires_at: resolveExpiresAt(expiresAt, expiresIn),
      token_type: "Bearer",
      ...(refreshToken ? { refresh_token: refreshToken } : {}),
    },
  }
}

/** Drop tokens from the address bar after reading them. */
export function scrubCallbackUrl() {
  if (typeof window === "undefined") return
  try {
    const clean = `${window.location.origin}${window.location.pathname}`
    window.history.replaceState(null, "", clean)
  } catch {
    // ignore
  }
}
