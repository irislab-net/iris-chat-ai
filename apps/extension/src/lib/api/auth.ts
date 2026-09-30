import { refreshWithStoredToken } from "@/adapters/auth"
import { chromeTokenStore, storeAuthTokens } from "@/adapters/token-store"
import {
  authUrl,
  getAuthDestination,
  isChatAppHost,
  loginWithGoogleUrl,
} from "@/lib/api/config"
import type { TokenPair, User } from "@/lib/api/types"
import { parseTokenPair, parseUser } from "@/lib/api/schemas"
import { AUTH_PRIVACY_NOTICE_ACCEPTED, AUTH_TERMS_ACCEPTED } from "@/lib/legal"
import { normalizeUser } from "@/lib/user-avatar"

const ACCESS_KEY = "access_token"
const EXPIRES_KEY = "expires_at"

/**
 * Access token storage (extension):
 * - In-memory + sessionStorage for the side-panel JS heap / soft reloads.
 * - chrome.storage.local holds access + refresh across panel closes (MV3 has no
 *   cookies for api.exur.ai). Refresh uses Bearer body via refreshWithStoredToken.
 */
let memoryAccessToken: string | null = null
let memoryExpiresAt: string | null = null

/** Coalesce concurrent refresh calls — reuse detection kills the whole session. */
let refreshInFlight: Promise<TokenPair> | null = null
/** Coalesce plan-upgrade session minting — avoids burning rotated refresh tokens. */
let planUpgradeInFlight: Promise<{
  user: User
  access_token: string
  expires_at: string
  token_type?: string
  refresh_token?: string
}> | null = null

function getSessionStorage(): Storage | null {
  try {
    if (typeof sessionStorage === "undefined") return null
    return sessionStorage
  } catch {
    return null
  }
}

function readSession(key: string): string | null {
  return getSessionStorage()?.getItem(key) ?? null
}

function writeSession(key: string, value: string) {
  try {
    getSessionStorage()?.setItem(key, value)
  } catch {
    // Private mode / quota — memory still holds the token for this page life.
  }
}

function removeSession(key: string) {
  try {
    getSessionStorage()?.removeItem(key)
  } catch {
    // ignore
  }
}

export function getStoredAccessToken() {
  const token = memoryAccessToken ?? readSession(ACCESS_KEY)
  if (!token) return null
  if (!isLikelyJwt(token)) {
    clearStoredTokens()
    return null
  }
  memoryAccessToken = token
  return token
}

export function getStoredExpiresAt() {
  if (memoryExpiresAt) return memoryExpiresAt
  const fromSession = readSession(EXPIRES_KEY)
  if (fromSession) memoryExpiresAt = fromSession
  return fromSession
}

/** Access JWTs are three base64url segments (`header.payload.signature`). */
export function isLikelyJwt(token: string): boolean {
  const parts = token.split(".")
  return parts.length === 3 && parts.every((part) => part.length > 0)
}

export function storeTokenPair(
  pair: Pick<TokenPair, "access_token" | "expires_at" | "refresh_token">
) {
  if (!isLikelyJwt(pair.access_token)) {
    clearStoredTokens()
    throw Object.assign(new Error("invalid access token shape"), {
      status: 401,
    })
  }
  memoryAccessToken = pair.access_token
  memoryExpiresAt = pair.expires_at
  writeSession(ACCESS_KEY, pair.access_token)
  writeSession(EXPIRES_KEY, pair.expires_at)
  void storeAuthTokens({
    access_token: pair.access_token,
    expires_at: pair.expires_at,
    ...(pair.refresh_token ? { refresh_token: pair.refresh_token } : {}),
  }).catch(() => undefined)
}

export function clearStoredTokens() {
  memoryAccessToken = null
  memoryExpiresAt = null
  removeSession(ACCESS_KEY)
  removeSession(EXPIRES_KEY)
  void Promise.resolve(chromeTokenStore.clearAccessToken()).catch(() => undefined)
}

export const AUTH_SUCCESS_MESSAGE = "iris-auth-success"
export const AUTH_POPUP_CLOSED_EVENT = "iris-auth-popup-closed"
export const AUTH_SESSION_EXPIRED_EVENT = "iris-auth-session-expired"
export const AUTH_RETURN_TO_KEY = "iris-auth-return-to"
export const PLAN_UPGRADE_PENDING_REFRESH_KEY =
  "iris-plan-upgrade-pending-refresh"

/**
 * Only allow same-origin relative paths after login (blocks open redirects via
 * tampered sessionStorage returnTo values).
 */
export function safeAuthReturnPath(
  raw: string | null | undefined,
  fallback: string
): string {
  if (!raw) return fallback
  const trimmed = raw.trim()
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.includes("\\")
  ) {
    return fallback
  }
  if (typeof window === "undefined") {
    return trimmed.startsWith("/") ? trimmed : fallback
  }
  try {
    const url = new URL(trimmed, window.location.origin)
    if (url.origin !== window.location.origin) return fallback
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return fallback
  }
}

export function markPlanUpgradePendingRefresh() {
  if (typeof window === "undefined") return
  sessionStorage.setItem(PLAN_UPGRADE_PENDING_REFRESH_KEY, "true")
}

export function hasPlanUpgradePendingRefresh(): boolean {
  if (typeof window === "undefined") return false
  return sessionStorage.getItem(PLAN_UPGRADE_PENDING_REFRESH_KEY) === "true"
}

export function consumePlanUpgradePendingRefresh(): boolean {
  if (typeof window === "undefined") return false
  if (sessionStorage.getItem(PLAN_UPGRADE_PENDING_REFRESH_KEY) !== "true") {
    return false
  }
  sessionStorage.removeItem(PLAN_UPGRADE_PENDING_REFRESH_KEY)
  return true
}

export function notifyAuthSessionExpired(): void {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT))
}

export async function exchangeGoogleOneTapCredential(options: {
  credential: string
  legalAccepted?: boolean
  app?: string
}) {
  const app = options.app ?? (isChatAppHost() ? "chat" : undefined)
  const body: Record<string, string> = {
    credential: options.credential,
  }

  if (options.legalAccepted) {
    body.terms = AUTH_TERMS_ACCEPTED
    body.privacy_notice = AUTH_PRIVACY_NOTICE_ACCEPTED
  }
  if (app) body.app = app

  const res = await fetch(authUrl("/v1/auth/google/one-tap"), {
    method: "POST",
    credentials: "omit",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  const payload = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw Object.assign(
      new Error(
        typeof payload.error === "string"
          ? payload.error
          : "Google One Tap sign-in failed"
      ),
      { status: res.status }
    )
  }

  if (
    payload &&
    typeof payload === "object" &&
    "access_token" in payload &&
    typeof (payload as { access_token?: unknown }).access_token === "string"
  ) {
    const pair = parseTokenPair(payload)
    storeTokenPair(pair)
    return pair
  }

  const pair = await refreshAccessToken()
  storeTokenPair(pair)
  return pair
}

export function startLoginWithGoogle(options?: {
  ref?: string
  legalAccepted?: boolean
  app?: string
  returnTo?: string
}) {
  if (typeof window !== "undefined" && options?.returnTo) {
    sessionStorage.setItem(AUTH_RETURN_TO_KEY, options.returnTo)
  }

  const app = options?.app ?? (isChatAppHost() ? "chat" : undefined)
  const destination = app ? null : getAuthDestination()
  const url = loginWithGoogleUrl(destination, {
    ref: options?.ref,
    legalAccepted: options?.legalAccepted ?? true,
    app,
  })

  // app=chat: API redirects back to chat after Google — full navigation, not popup.
  if (app) {
    window.location.assign(url)
    return
  }

  // destination= flow: popup keeps pkce cookies on api.exur.ai before callback.
  const popup = window.open(url, "iris-google-auth")
  if (!popup) {
    window.location.assign(url)
    return
  }

  // API often sets refresh_token on /callback but fails to 303 → destination.
  // When the popup closes (or user closes the white page), try cookie refresh here.
  const timer = window.setInterval(() => {
    if (!popup.closed) return
    window.clearInterval(timer)
    window.dispatchEvent(new Event(AUTH_POPUP_CLOSED_EVENT))
  }, 400)
}

export async function refreshAccessToken(): Promise<TokenPair> {
  if (refreshInFlight) return refreshInFlight

  refreshInFlight = (async () => {
    const pair = await refreshWithStoredToken()
    storeTokenPair(pair)
    return {
      access_token: pair.access_token,
      expires_at: pair.expires_at,
      token_type: pair.token_type ?? "Bearer",
      ...(pair.refresh_token ? { refresh_token: pair.refresh_token } : {}),
    }
  })()

  try {
    return await refreshInFlight
  } finally {
    refreshInFlight = null
  }
}

export async function getMe(accessToken: string): Promise<User> {
  // Extension calls api.exur.ai with Bearer — CORS must allow chrome-extension:// origins.
  const res = await fetch(authUrl("/v1/me"), {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw Object.assign(new Error(body.error || "me failed"), {
      status: res.status,
    })
  }
  // Some responses wrap user in { data } / { user }
  let raw: unknown = body
  if (
    body &&
    typeof body === "object" &&
    "id" in body &&
    ("x_username" in body || "email" in body || "tier" in body)
  ) {
    raw = body
  } else if (body?.user) {
    raw = body.user
  } else if (body?.data) {
    raw = body.data
  }
  return normalizeUser(parseUser(raw))
}

export async function logoutRemote() {
  await fetch(authUrl("/v1/auth/logout"), {
    method: "POST",
    credentials: "omit",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  }).catch(() => undefined)
  clearStoredTokens()
}

export async function establishSession() {
  const pair = await refreshAccessToken()
  storeTokenPair(pair)
  const user = await getMe(pair.access_token)
  return { user, ...pair }
}

export async function bootstrapSession() {
  let accessToken = getStoredAccessToken()

  if (!accessToken) {
    try {
      const pair = await refreshAccessToken()
      storeTokenPair(pair)
      accessToken = pair.access_token
    } catch {
      return { user: null, accessToken: null }
    }
  }

  try {
    const user = await getMe(accessToken)
    return { user, accessToken }
  } catch (error) {
    const status = (error as { status?: number }).status
    if (status === 401) {
      try {
        const pair = await refreshAccessToken()
        storeTokenPair(pair)
        const user = await getMe(pair.access_token)
        return { user, accessToken: pair.access_token }
      } catch {
        clearStoredTokens()
        return { user: null, accessToken: null }
      }
    }
    throw error
  }
}

export function isPro(user: User | null, now = Date.now()) {
  if (!user) return false
  if (user.tier === "pro" || user.tier === "ultimate") {
    if (!user.pro_expires_at) return true
    return new Date(user.pro_expires_at).getTime() > now
  }
  if (user.trial_ends_at && new Date(user.trial_ends_at).getTime() > now) {
    return true
  }
  return false
}

/** Backoff while billing/auth apply Plus (esp. 100% coupons). */
const PLAN_UPGRADE_ME_POLL_DELAYS_MS = [400, 900, 1600, 2400] as const

function waitMs(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })
}

function isRefreshFailure(error: unknown): boolean {
  const status = (error as { status?: number } | null)?.status
  return status === 400 || status === 401
}

/**
 * Mint a fresh access token after Plus upgrade.
 *
 * Refresh tokens rotate — do **not** hammer `/v1/auth/refresh`. Mint once,
 * poll `/me` until Plus appears, then mint once more so JWT claims match.
 * Concurrent callers share one in-flight promise.
 */
export async function establishSessionAfterPlanUpgrade() {
  const expectPro = hasPlanUpgradePendingRefresh()
  if (!expectPro) {
    return establishSession()
  }

  if (planUpgradeInFlight) return planUpgradeInFlight

  planUpgradeInFlight = (async () => {
    let session = await establishSession()
    if (isPro(session.user)) {
      consumePlanUpgradePendingRefresh()
      return session
    }

    for (const delay of PLAN_UPGRADE_ME_POLL_DELAYS_MS) {
      await waitMs(delay)
      try {
        const user = await getMe(session.access_token)
        if (!isPro(user)) {
          session = { ...session, user }
          continue
        }
        session = await establishSession()
        if (isPro(session.user)) {
          consumePlanUpgradePendingRefresh()
        }
        return session
      } catch (error) {
        if (!isRefreshFailure(error)) throw error
        try {
          session = await establishSession()
          if (isPro(session.user)) {
            consumePlanUpgradePendingRefresh()
            return session
          }
        } catch (refreshError) {
          if (isRefreshFailure(refreshError)) {
            clearStoredTokens()
            throw refreshError
          }
          throw refreshError
        }
      }
    }

    return session
  })()

  try {
    return await planUpgradeInFlight
  } finally {
    planUpgradeInFlight = null
  }
}
