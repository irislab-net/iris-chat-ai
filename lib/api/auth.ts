import {
  authUrl,
  getAuthDestination,
  isChatAppHost,
  loginWithGoogleUrl,
} from "@/lib/api/config"
import type { TokenPair, User } from "@/lib/api/types"
import {
  AUTH_PRIVACY_NOTICE_ACCEPTED,
  AUTH_TERMS_ACCEPTED,
} from "@/lib/legal"
import { normalizeUser } from "@/lib/user-avatar"

const ACCESS_KEY = "access_token"
const EXPIRES_KEY = "expires_at"

/** Coalesce concurrent refresh calls — reuse detection kills the whole session. */
let refreshInFlight: Promise<TokenPair> | null = null

export function getStoredAccessToken() {
  if (typeof window === "undefined") return null
  return sessionStorage.getItem(ACCESS_KEY)
}

export function getStoredExpiresAt() {
  if (typeof window === "undefined") return null
  return sessionStorage.getItem(EXPIRES_KEY)
}

export function storeTokenPair(pair: Pick<TokenPair, "access_token" | "expires_at">) {
  sessionStorage.setItem(ACCESS_KEY, pair.access_token)
  sessionStorage.setItem(EXPIRES_KEY, pair.expires_at)
}

export function clearStoredTokens() {
  sessionStorage.removeItem(ACCESS_KEY)
  sessionStorage.removeItem(EXPIRES_KEY)
}

export const AUTH_SUCCESS_MESSAGE = "iris-auth-success"
export const AUTH_POPUP_CLOSED_EVENT = "iris-auth-popup-closed"
export const AUTH_SESSION_EXPIRED_EVENT = "iris-auth-session-expired"
export const AUTH_RETURN_TO_KEY = "iris-auth-return-to"
export const PLAN_UPGRADE_PENDING_REFRESH_KEY = "iris-plan-upgrade-pending-refresh"

export function markPlanUpgradePendingRefresh() {
  if (typeof window === "undefined") return
  sessionStorage.setItem(PLAN_UPGRADE_PENDING_REFRESH_KEY, "true")
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
    credentials: "include",
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
    typeof payload.access_token === "string"
  ) {
    storeTokenPair(payload as TokenPair)
    return payload as TokenPair
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
    // Same-origin via next.config rewrite → browser sends refresh_token (Domain=.irislab.info, Path=/v1/auth)
    const res = await fetch(authUrl("/v1/auth/refresh"), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw Object.assign(new Error(body.error || "refresh failed"), {
        status: res.status,
      })
    }
    return body as TokenPair
  })()

  try {
    return await refreshInFlight
  } finally {
    refreshInFlight = null
  }
}

export async function getMe(accessToken: string): Promise<User> {
  // Same-origin rewrite avoids CORS blocks on api.exur.ai/v1/me
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
  if (
    body &&
    typeof body === "object" &&
    "id" in body &&
    ("x_username" in body || "email" in body || "tier" in body)
  ) {
    return normalizeUser(body)
  }
  if (body?.user) return normalizeUser(body.user)
  if (body?.data) return normalizeUser(body.data)
  return normalizeUser(body)
}

export async function logoutRemote() {
  await fetch(authUrl("/v1/auth/logout"), {
    method: "POST",
    credentials: "include",
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
