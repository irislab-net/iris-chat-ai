import { authUrl, getAuthDestination, loginWithGoogleUrl } from "@/lib/api/config"
import type { TokenPair, User } from "@/lib/api/types"
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

export function notifyAuthSessionExpired(): void {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT))
}

export function startLoginWithGoogle(options?: {
  ref?: string
  legalAccepted?: boolean
}) {
  const destination = getAuthDestination()
  const url = loginWithGoogleUrl(destination, {
    ref: options?.ref,
    legalAccepted: options?.legalAccepted ?? true,
  })

  // Open API login as the FIRST document in a new browsing context so pkce cookies stick.
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
  // Same-origin rewrite avoids CORS blocks on api.irislab.info/v1/me
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
